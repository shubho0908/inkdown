import 'server-only'

import { revalidateTag } from 'next/cache'
import type { createClient } from '@/lib/supabase/server'

export interface FolderShareState {
  id: string
  parent_id: string | null
  slug: string | null
  is_public: boolean
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export function getPublicFolderShareTag(slug: string) {
  return `public-folder:${slug}`
}

export function getPublicFileShareTag(slug: string) {
  return `public-file:${slug}`
}

function addShareSlug(slugs: Set<string>, slug: string | null | undefined) {
  if (slug) {
    slugs.add(slug)
  }
}

export async function listOwnedFolderShareState(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from('folders')
    .select('id, parent_id, slug, is_public')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return (data ?? []) as FolderShareState[]
}

export function collectAncestorPublicFolderShareSlugs(
  folders: FolderShareState[],
  folderId: string | null | undefined,
) {
  const slugs = new Set<string>()

  if (!folderId) {
    return slugs
  }

  const foldersById = new Map(folders.map((folder) => [folder.id, folder]))
  const visited = new Set<string>()
  let currentFolderId: string | null = folderId

  while (currentFolderId && !visited.has(currentFolderId)) {
    visited.add(currentFolderId)

    const currentFolder = foldersById.get(currentFolderId)
    if (!currentFolder) {
      break
    }

    if (currentFolder.is_public && currentFolder.slug) {
      slugs.add(currentFolder.slug)
    }

    currentFolderId = currentFolder.parent_id
  }

  return slugs
}

export function collectPublicFolderShareSlugsForFolderCreate(
  folders: FolderShareState[],
  parentFolderId: string | null | undefined,
) {
  return collectAncestorPublicFolderShareSlugs(folders, parentFolderId)
}

export function collectDescendantPublicFolderShareSlugs(
  folders: FolderShareState[],
  rootFolderId: string,
) {
  const slugs = new Set<string>()
  const childFolderIdsByParentId = new Map<string, string[]>()

  folders.forEach((folder) => {
    if (!folder.parent_id) {
      return
    }

    const siblingIds = childFolderIdsByParentId.get(folder.parent_id) ?? []
    siblingIds.push(folder.id)
    childFolderIdsByParentId.set(folder.parent_id, siblingIds)
  })

  const foldersById = new Map(folders.map((folder) => [folder.id, folder]))
  const pendingFolderIds = [rootFolderId]
  const visited = new Set<string>()

  while (pendingFolderIds.length > 0) {
    const folderId = pendingFolderIds.pop()

    if (!folderId || visited.has(folderId)) {
      continue
    }

    visited.add(folderId)

    const folder = foldersById.get(folderId)
    if (folder?.is_public && folder.slug) {
      slugs.add(folder.slug)
    }

    const childFolderIds = childFolderIdsByParentId.get(folderId) ?? []
    pendingFolderIds.push(...childFolderIds)
  }

  return slugs
}

export function collectPublicFolderShareSlugsForFolderUpdate(
  previousFolders: FolderShareState[],
  nextFolders: FolderShareState[],
  folderId: string,
) {
  const slugs = new Set<string>([
    ...collectAncestorPublicFolderShareSlugs(previousFolders, folderId),
    ...collectAncestorPublicFolderShareSlugs(nextFolders, folderId),
  ])

  addShareSlug(
    slugs,
    previousFolders.find((folder) => folder.id === folderId)?.slug,
  )
  addShareSlug(
    slugs,
    nextFolders.find((folder) => folder.id === folderId)?.slug,
  )

  return slugs
}

export function collectPublicFolderShareSlugsForFolderDelete(
  folders: FolderShareState[],
  folderId: string,
) {
  const slugs = new Set<string>([
    ...collectAncestorPublicFolderShareSlugs(folders, folderId),
    ...collectDescendantPublicFolderShareSlugs(folders, folderId),
  ])

  addShareSlug(
    slugs,
    folders.find((folder) => folder.id === folderId)?.slug,
  )

  return slugs
}

export function collectPublicFolderShareSlugsForFileChange(
  folders: FolderShareState[],
  previousFolderId: string | null | undefined,
  nextFolderId: string | null | undefined,
) {
  return new Set<string>([
    ...collectAncestorPublicFolderShareSlugs(folders, previousFolderId),
    ...collectAncestorPublicFolderShareSlugs(folders, nextFolderId),
  ])
}

export function collectPublicFileShareSlugs(...slugsToMerge: Array<string | null | undefined>) {
  const slugs = new Set<string>()

  for (const slug of slugsToMerge) {
    addShareSlug(slugs, slug)
  }

  return slugs
}

export function revalidatePublicFolderShares(slugs: Iterable<string>) {
  for (const slug of new Set(slugs)) {
    revalidateTag(getPublicFolderShareTag(slug), 'max')
  }
}

export function revalidatePublicFileShares(slugs: Iterable<string>) {
  for (const slug of new Set(slugs)) {
    revalidateTag(getPublicFileShareTag(slug), 'max')
  }
}
