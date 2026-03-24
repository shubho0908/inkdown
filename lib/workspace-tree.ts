import type { File, Folder, TreeItem } from '@/lib/types'

export function buildTree(folders: Folder[], files: File[]): TreeItem[] {
  const folderMap = new Map<string, TreeItem>()
  const rootItems: TreeItem[] = []

  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      parent_id: folder.parent_id,
      children: [],
    })
  })

  folders.forEach((folder) => {
    const item = folderMap.get(folder.id)

    if (!item) {
      return
    }

    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id)?.children?.push(item)
      return
    }

    rootItems.push(item)
  })

  files.forEach((file) => {
    const fileItem: TreeItem = {
      id: file.id,
      name: file.name,
      type: 'file',
      parent_id: file.folder_id,
      is_public: file.is_public,
      slug: file.slug,
    }

    if (file.folder_id && folderMap.has(file.folder_id)) {
      folderMap.get(file.folder_id)?.children?.push(fileItem)
      return
    }

    rootItems.push(fileItem)
  })

  sortTreeItems(rootItems)

  return rootItems
}

function sortTreeItems(items: TreeItem[]) {
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  items.forEach((item) => {
    if (item.children) {
      sortTreeItems(item.children)
    }
  })
}
