import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import {
  normalizeMarkdownImportFileName,
  validateMarkdownImportPayload,
} from '@/lib/markdown-import'
import {
  collectPublicFolderShareSlugsForFileChange,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from '@/lib/public-share-cache'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Convert kebab-case folder name to title case with spaces
 * Example: "hello-world-api" -> "Hello World Api"
 */
function formatFolderName(name: string): string {
  // Handle empty or special cases
  if (!name || name.trim().length === 0) {
    return 'Untitled'
  }
  
  // Limit name length to prevent database issues
  const maxLength = 255
  const trimmedName = name.trim().slice(0, maxLength)
  
  return trimmedName
    .split('-')
    .map((word) => {
      if (word.length === 0) return ''
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
    .trim() || 'Untitled'
}

interface FolderImportFolder {
  name: string
  relativePath: string
}

interface FolderImportFile {
  name: string
  content: string
  relativePath: string
}

interface ImportFolderRequestBody {
  folder_id?: string | null
  folders?: FolderImportFolder[]
  files?: FolderImportFile[]
}

// Performance and safety limits
const MAX_FOLDERS = 500
const MAX_FILES = 1000
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  const supabase = await createClient()

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  let body: ImportFolderRequestBody

  try {
    body = (await request.json()) as ImportFolderRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 })
  }

  const folderId = body.folder_id ?? null
  const folders = Array.isArray(body.folders) ? body.folders : []
  const files = Array.isArray(body.files) ? body.files : []

  // Validate limits
  if (folders.length > MAX_FOLDERS) {
    return NextResponse.json(
      { error: `Too many folders. Maximum ${MAX_FOLDERS} folders allowed.` },
      { status: 400 },
    )
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files. Maximum ${MAX_FILES} files allowed.` },
      { status: 400 },
    )
  }

  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + file.content.length, 0)
  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json(
      { error: `Total content size too large. Maximum ${MAX_TOTAL_SIZE / 1024 / 1024}MB allowed.` },
      { status: 400 },
    )
  }

  // Validate files
  const validationError = validateMarkdownImportPayload(files)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>

  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id)

    if (folderId && !folderShareState.find((folder) => folder.id === folderId)) {
      return NextResponse.json({ error: 'Invalid target folder' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not validate target folder' },
      { status: 500 },
    )
  }

  // Collect affected share slugs
  const affectedShareSlugs = collectPublicFolderShareSlugsForFileChange(
    folderShareState,
    folderId,
    folderId,
  )

  try {
    // Create folders first (in topological order - parents before children)
    // Sort folders by depth to ensure parents are created before children
    // Pre-calculate depths to avoid repeated string splitting
    const foldersWithDepth = folders.map(folder => ({
      ...folder,
      depth: folder.relativePath.split('/').length
    }))
    
    const sortedFolders = foldersWithDepth.sort((a, b) => a.depth - b.depth)

    const folderPathToId = new Map<string, string>()
    const createdFolders: Array<{ id: string; name: string; parent_id: string | null }> = []

    // Insert folders one at a time to maintain parent-child relationships
    for (const folder of sortedFolders) {
      // Determine parent folder dynamically (parent must already exist due to sorting)
      const pathParts = folder.relativePath.split('/')
      const folderName = pathParts.pop()!
      const parentPath = pathParts.join('/')
      
      let parentId = folderId
      if (parentPath && folderPathToId.has(parentPath)) {
        parentId = folderPathToId.get(parentPath)!
      }

      const { data: createdFolder, error: folderError } = await supabase
        .from('folders')
        .insert({
          name: formatFolderName(folderName),
          parent_id: parentId,
          user_id: authState.user.id,
        })
        .select()
        .single()

      if (folderError) {
        console.error(`Failed to create folder ${folder.relativePath}:`, folderError)
        throw new Error(`Failed to create folder ${folder.relativePath}: ${folderError.message}`)
      }

      folderPathToId.set(folder.relativePath, createdFolder.id)
      createdFolders.push(createdFolder)
    }

    // Create files in batches for better performance
    const BATCH_SIZE = 100
    const allCreatedFiles: Array<{ id: string; name: string; content: string; folder_id: string | null }> = []
    
    // Process files in batches without creating intermediate arrays
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, files.length)
      const filesToInsert = []
      
      for (let j = i; j < batchEnd; j++) {
        const file = files[j]
        const pathParts = file.relativePath.split('/')
        pathParts.pop() // Remove file name
        const folderPath = pathParts.join('/')
        
        let fileFolderId = folderId
        if (folderPath && folderPathToId.has(folderPath)) {
          fileFolderId = folderPathToId.get(folderPath)!
        }

        filesToInsert.push({
          name: normalizeMarkdownImportFileName(file.name),
          content: file.content,
          folder_id: fileFolderId,
          user_id: authState.user.id,
        })
      }

      const { data: batchFiles, error: filesError } = await supabase
        .from('files')
        .insert(filesToInsert)
        .select()

      if (filesError) {
        console.error('Failed to create files:', filesError)
        // Attempt to clean up created folders on failure
        await supabase
          .from('folders')
          .delete()
          .in('id', createdFolders.map(f => f.id))
        throw new Error(`Failed to create files: ${filesError.message}`)
      }

      allCreatedFiles.push(...batchFiles)
    }

    revalidatePublicFolderShares(affectedShareSlugs)

    return NextResponse.json({
      folders: createdFolders,
      files: allCreatedFiles,
    })
  } catch (error) {
    console.error('Import folder error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import folder' },
      { status: 500 },
    )
  }
}
