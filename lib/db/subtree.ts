import "server-only";

import type { FileRow, FolderRow } from "@/lib/db/schema";

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
    const folderId = queue.shift()!;
    subtreeIds.add(folderId);
    queue.push(...(childrenByParent.get(folderId) ?? []));
  }

  return subtreeIds;
}

export function filterFoldersInSubtree(allFolders: FolderRow[], rootFolderId: string) {
  const subtreeIds = collectSubtreeFolderIds(
    allFolders.map((folder) => ({ id: folder.id, parentId: folder.parentId })),
    rootFolderId,
  );

  return allFolders
    .filter((folder) => subtreeIds.has(folder.id))
    .sort((left, right) => {
      if (left.parentId === right.parentId) {
        return left.name.localeCompare(right.name);
      }

      if (left.parentId === null) return -1;
      if (right.parentId === null) return 1;
      return left.name.localeCompare(right.name);
    });
}

export function filterFilesInSubtree(allFiles: FileRow[], subtreeFolderIds: Set<string>) {
  return allFiles
    .filter((file) => file.folderId !== null && subtreeFolderIds.has(file.folderId))
    .sort((left, right) => left.name.localeCompare(right.name));
}
