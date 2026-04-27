import { requireVerifiedUser } from '@/lib/auth'
import { createAuthErrorResponse } from '@/lib/auth/server'
import {
  collectPublicFolderShareSlugsForFolderCreate,
  listOwnedFolderShareState,
  revalidatePublicFolderShares,
} from '@/lib/public-share-cache'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface CopyFolderRequest {
  destination_parent_id: string | null
}

interface SharedFolderRow {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  slug: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

interface SharedFileRow {
  id: string
  user_id: string
  folder_id: string
  name: string
  content: string
  slug: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

async function fetchSharedFolderSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
) {
  const { data: folders, error: foldersError } = await supabase.rpc(
    'get_public_folder_subtree_folders',
    { folder_slug: slug },
  )

  if (foldersError) {
    throw new Error(`Failed to fetch shared folders: ${foldersError.message}`)
  }

  const sharedFolders = (folders ?? []) as SharedFolderRow[]
  const rootFolder = sharedFolders.find((folder) => folder.slug === slug)

  if (!rootFolder) {
    throw new Error('Shared folder not found')
  }

  const { data: fileRows, error: filesError } = await supabase.rpc(
    'get_public_folder_subtree_files',
    { folder_slug: slug },
  )

  if (filesError) {
    throw new Error(`Failed to fetch shared files: ${filesError.message}`)
  }

  const sharedFileRows = (fileRows ?? []) as Array<Omit<SharedFileRow, 'content'>>
  const files = await Promise.all(
    sharedFileRows.map(async (file) => {
      const { data: fileContentRows, error: fileContentError } = await supabase.rpc(
        'get_public_folder_file',
        {
          folder_slug: slug,
          target_file_id: file.id,
        },
      )

      if (fileContentError) {
        throw new Error(`Failed to fetch file content: ${fileContentError.message}`)
      }

      const [fileWithContent] = (fileContentRows ?? []) as SharedFileRow[]
      if (!fileWithContent) {
        throw new Error(`Failed to fetch file content for "${file.name}"`)
      }

      return fileWithContent
    }),
  )

  return {
    rootFolder,
    folders: sharedFolders,
    files,
  }
}

function sortFoldersForCopy(folders: SharedFolderRow[], rootFolderId: string) {
  const foldersByParentId = new Map<string | null, SharedFolderRow[]>()

  for (const folder of folders) {
    const siblings = foldersByParentId.get(folder.parent_id) ?? []
    siblings.push(folder)
    foldersByParentId.set(folder.parent_id, siblings)
  }

  const rootFolder = folders.find((folder) => folder.id === rootFolderId)
  if (!rootFolder) {
    return []
  }

  const sortedFolders: SharedFolderRow[] = []
  const queue = [rootFolder]

  while (queue.length > 0) {
    const folder = queue.shift()!
    sortedFolders.push(folder)
    queue.push(...(foldersByParentId.get(folder.id) ?? []))
  }

  return sortedFolders
}

async function copyFolderSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  snapshot: Awaited<ReturnType<typeof fetchSharedFolderSnapshot>>,
  destinationParentId: string | null,
) {
  const folderMap = new Map<string, string>()
  const fileMap = new Map<string, string>()
  const foldersToCopy = sortFoldersForCopy(snapshot.folders, snapshot.rootFolder.id)

  if (foldersToCopy.length !== snapshot.folders.length) {
    throw new Error('Shared folder tree is incomplete')
  }

  for (const folder of foldersToCopy) {
    const parentId =
      folder.id === snapshot.rootFolder.id
        ? destinationParentId
        : folderMap.get(folder.parent_id ?? '')

    if (folder.id !== snapshot.rootFolder.id && !parentId) {
      throw new Error(`Missing copied parent for folder "${folder.name}"`)
    }

    const { data: newFolder, error: createError } = await supabase
      .from('folders')
      .insert({
        name: folder.name,
        parent_id: parentId,
        user_id: userId,
        is_public: false,
        slug: null,
      })
      .select()
      .single()

    if (createError || !newFolder) {
      throw new Error(`Failed to create folder: ${createError?.message}`)
    }

    folderMap.set(folder.id, newFolder.id)
  }

  for (const file of snapshot.files) {
    const newFolderId = folderMap.get(file.folder_id)

    if (!newFolderId) {
      throw new Error(`Missing copied folder for file "${file.name}"`)
    }

    const { data: newFile, error: fileError } = await supabase
      .from('files')
      .insert({
        name: file.name,
        folder_id: newFolderId,
        content: file.content,
        user_id: userId,
        is_public: false,
        slug: null,
      })
      .select()
      .single()

    if (fileError || !newFile) {
      throw new Error(`Failed to create file: ${fileError?.message}`)
    }

    fileMap.set(file.id, newFile.id)
  }

  return { folderMap, fileMap }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const supabase = await createClient()
  const { slug } = await params

  const authState = await requireVerifiedUser(supabase)
  if (authState.kind !== 'authenticated') {
    return createAuthErrorResponse(authState)
  }

  const body: CopyFolderRequest = await request.json()
  const { destination_parent_id } = body

  // Validate destination folder
  let folderShareState = [] as Awaited<ReturnType<typeof listOwnedFolderShareState>>
  try {
    folderShareState = await listOwnedFolderShareState(supabase, authState.user.id)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load folders' },
      { status: 500 },
    )
  }

  if (destination_parent_id) {
    const parentFolder = folderShareState.find((folder) => folder.id === destination_parent_id)
    if (!parentFolder) {
      return NextResponse.json({ error: 'Invalid destination folder' }, { status: 400 })
    }
  }

  // Calculate affected share slugs for revalidation
  const affectedShareSlugs = collectPublicFolderShareSlugsForFolderCreate(
    folderShareState,
    destination_parent_id || null,
  )

  try {
    const snapshot = await fetchSharedFolderSnapshot(supabase, slug)
    const { folderMap, fileMap } = await copyFolderSnapshot(
      supabase,
      authState.user.id,
      snapshot,
      destination_parent_id || null,
    )

    // Revalidate public folder shares
    revalidatePublicFolderShares(affectedShareSlugs)

    return NextResponse.json({
      success: true,
      folderId: folderMap.get(snapshot.rootFolder.id),
      folderCount: folderMap.size,
      fileCount: fileMap.size,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to copy folder'
    const status = message === 'Shared folder not found' ? 404 : 500

    return NextResponse.json(
      { error: message },
      { status },
    )
  }
}
