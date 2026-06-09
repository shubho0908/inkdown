import type { Folder, TreeItem } from "@/lib/validation/models";

type FolderParentReference = Pick<Folder, "id" | "parent_id">;

export function collectDescendantFolderIds(folders: FolderParentReference[], folderId: string) {
  const ids = new Set<string>([folderId]);
  let found = true;

  while (found) {
    found = false;

    for (const folder of folders) {
      if (folder.parent_id && ids.has(folder.parent_id) && !ids.has(folder.id)) {
        ids.add(folder.id);
        found = true;
      }
    }
  }

  return ids;
}

export function wouldCreateFolderCycle(
  folders: FolderParentReference[],
  folderId: string,
  targetParentId: string | null,
) {
  if (targetParentId === null) {
    return false;
  }

  if (folderId === targetParentId) {
    return true;
  }

  return collectDescendantFolderIds(folders, folderId).has(targetParentId);
}

function canMoveFile(currentFolderId: string | null, targetFolderId: string | null) {
  return currentFolderId !== targetFolderId;
}

function canMoveFolder(
  folders: FolderParentReference[],
  folderId: string,
  currentParentId: string | null,
  targetParentId: string | null,
) {
  if (currentParentId === targetParentId) {
    return false;
  }

  return !wouldCreateFolderCycle(folders, folderId, targetParentId);
}

export function canMoveTreeItem(
  folders: FolderParentReference[],
  item: Pick<TreeItem, "id" | "type" | "parent_id">,
  targetFolderId: string | null,
) {
  return item.type === "file"
    ? canMoveFile(item.parent_id, targetFolderId)
    : canMoveFolder(folders, item.id, item.parent_id, targetFolderId);
}
