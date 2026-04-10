import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import archiver from 'archiver'
import { PassThrough } from 'node:stream'

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none';",
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}

function buildFolderPath(
  folderId: string | null, 
  folderMap: Map<string, { id: string; name: string; parent_id: string | null }>
): string {
  if (!folderId) return ''
  
  const parts: string[] = []
  let current = folderMap.get(folderId)
  
  while (current) {
    parts.unshift(sanitizeFileName(current.name))
    current = current.parent_id ? folderMap.get(current.parent_id) : undefined
  }
  
  return parts.join('/')
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .trim() || 'Untitled'
}

function ensureMarkdownExtension(name: string): string {
  const sanitized = sanitizeFileName(name)
  return sanitized.toLowerCase().endsWith('.md') 
    ? sanitized 
    : `${sanitized}.md`
}

function getFolderDescendants(folderId: string, folderMap: Map<string, { id: string; parent_id: string | null }>): Set<string> {
  const descendants = new Set<string>([folderId])
  const queue = [folderId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const [, folder] of folderMap) {
      if (folder.parent_id === current) {
        descendants.add(folder.id)
        queue.push(folder.id)
      }
    }
  }

  return descendants
}

function validateClientToken(request: Request): boolean {
  const clientToken = request.headers.get('x-client-token')
  const requestedWith = request.headers.get('x-requested-with')
  
  if (!clientToken || clientToken.length !== 32) {
    return false
  }
  
  if (requestedWith?.toLowerCase() !== 'xmlhttprequest') {
    return false
  }
  
  return /^[a-f0-9]{32}$/.test(clientToken)
}

function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: getSecurityHeaders() }
  )
}

export async function GET(request: Request) {
  if (!validateClientToken(request)) {
    console.warn('[SECURITY] Invalid client token on export endpoint')
    return createErrorResponse('Unauthorized', 401)
  }

  const supabase = await createClient()

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    const [{ data: files }, { data: folders }] = await Promise.all([
      supabase
        .from('files')
        .select('id, name, content, folder_id, updated_at')
        .eq('user_id', authState.user.id)
        .order('name'),
      supabase
        .from('folders')
        .select('id, name, parent_id, updated_at')
        .eq('user_id', authState.user.id)
        .order('name'),
    ])

    const folderMap = new Map((folders || []).map(f => [f.id, f]))

    if (folderId) {
      const folder = folderMap.get(folderId)
      if (!folder) {
        return createErrorResponse('Folder not found', 404)
      }

      const descendants = getFolderDescendants(folderId, folderMap)
      const folderFiles = (files || []).filter(f => f.folder_id && descendants.has(f.folder_id))
      
      if (folderFiles.length === 0) {
        return createErrorResponse('Folder is empty', 400)
      }

      const archive = archiver('zip', { zlib: { level: 6 } })
      const passThrough = new PassThrough()
      archive.pipe(passThrough)

      const basePath = buildFolderPath(folderId, folderMap)

      for (const file of folderFiles) {
        const relativePath = buildFolderPath(file.folder_id, folderMap).slice(basePath.length + 1)
        const fileName = ensureMarkdownExtension(file.name)
        const fullPath = relativePath ? `${relativePath}/${fileName}` : fileName

        archive.append(file.content || '# Empty Document\n', { 
          name: fullPath,
          date: file.updated_at ? new Date(file.updated_at) : new Date()
        })
      }

      archive.finalize()

      const timestamp = new Date().toISOString().split('T')[0]
      const folderName = sanitizeFileName(folder.name)
      const downloadName = `${folderName}-${timestamp}.zip`

      return new Response(passThrough as unknown as ReadableStream, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          ...getSecurityHeaders(),
        },
      })
    }

    if ((!files || files.length === 0) && (!folders || folders.length === 0)) {
      return createErrorResponse('No files to export', 400)
    }

    const archive = archiver('zip', {
      zlib: { level: 6 },
    })

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Zip export warning:', err.message)
      } else {
        console.error('Zip export error:', err)
      }
    })

    archive.on('error', (err) => {
      console.error('Archive error:', err)
    })

    const passThrough = new PassThrough()
    archive.pipe(passThrough)

    for (const folder of folders || []) {
      const folderPath = buildFolderPath(folder.id, folderMap)
      if (folderPath) {
        archive.append('', { name: `${folderPath}/.folder` })
      }
    }

    for (const file of files || []) {
      const folderPath = buildFolderPath(file.folder_id, folderMap)
      const fileName = ensureMarkdownExtension(file.name)
      const fullPath = folderPath 
        ? `${folderPath}/${fileName}` 
        : fileName

      archive.append(file.content || '# Empty Document\n', { 
        name: fullPath,
        date: file.updated_at ? new Date(file.updated_at) : new Date()
      })
    }

    archive.finalize()

    const timestamp = new Date().toISOString().split('T')[0]
    const downloadName = `inkdown-export-${timestamp}.zip`

    return new Response(passThrough as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        ...getSecurityHeaders(),
      },
    })

  } catch (error) {
    console.error('Zip export failed:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Export failed',
      500
    )
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
