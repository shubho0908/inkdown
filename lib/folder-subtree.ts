export interface FolderNode {
  id: string;
  parentId: string | null;
}

export function collectSubtreeFolderIds(allFolders: FolderNode[], rootFolderId: string) {
  const childrenByParent = new Map<string | null, string[]>();

  for (const folder of allFolders) {
    const siblings = childrenByParent.get(folder.parentId) ?? [];
    siblings.push(folder.id);
    childrenByParent.set(folder.parentId, siblings);
  }

  const subtreeIds = new Set<string>();
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const currentFolderId = queue.shift()!;
    subtreeIds.add(currentFolderId);
    queue.push(...(childrenByParent.get(currentFolderId) ?? []));
  }

  return subtreeIds;
}
