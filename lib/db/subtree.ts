import "server-only";

import { collectSubtreeFolderIds, type FolderNode } from "@/lib/folder-subtree";
import type { FileRow, FolderRow } from "@/lib/db/schema";

export type { FolderNode };
export { collectSubtreeFolderIds };

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
