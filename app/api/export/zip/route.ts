import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import archiver from 'archiver'
import { PassThrough } from 'node:stream'

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

export async function GET() {
  const supabase = await createClient()

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  try {
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

    if ((!files || files.length === 0) && (!folders || folders.length === 0)) {
      return NextResponse.json(
        { error: 'No files to export' },
        { status: 400 }
      )
    }

    const folderMap = new Map((folders || []).map(f => [f.id, f]))

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
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Zip export failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
