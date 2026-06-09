import { collectSubtreeFolderIds } from "@/lib/folder-subtree";
import type { File, Folder } from "@/lib/validation/models";

type FolderParentRef = Pick<Folder, "id" | "parent_id">;

function toFolderNodes(folders: FolderParentRef[]) {
  return folders.map((folder) => ({ id: folder.id, parentId: folder.parent_id }));
}

export function getSubtreeFolderIdSet(folders: FolderParentRef[], rootFolderId: string) {
  return collectSubtreeFolderIds(toFolderNodes(folders), rootFolderId);
}

export function filterFoldersExcludingSubtree<T extends FolderParentRef>(
  folders: T[],
  rootFolderId: string,
): T[] {
  const removedIds = getSubtreeFolderIdSet(folders, rootFolderId);
  return folders.filter((folder) => !removedIds.has(folder.id));
}

export function filterFilesExcludingSubtree(
  files: File[],
  folders: FolderParentRef[],
  rootFolderId: string,
): { files: File[]; removedFileIds: string[] } {
  const removedIds = getSubtreeFolderIdSet(folders, rootFolderId);
  const removedFileIds: string[] = [];

  const remaining = files.filter((file) => {
    const shouldRemove = file.folder_id !== null && removedIds.has(file.folder_id);

    if (shouldRemove) {
      removedFileIds.push(file.id);
    }

    return !shouldRemove;
  });

  return { files: remaining, removedFileIds };
}
