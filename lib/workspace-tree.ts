import type { File, Folder, TreeItem } from "@/lib/validation/models";

export function findFirstFileInTree(items: TreeItem[]): string | null {
  for (const item of items) {
    if (item.type === "file") {
      return item.id;
    }

    const nestedFileId = item.children ? findFirstFileInTree(item.children) : null;
    if (nestedFileId) {
      return nestedFileId;
    }
  }

  return null;
}

/**
 * Build a navigable tree for a shared folder subtree. Shared folders are often nested
 * inside the owner's workspace, so ancestor folders are intentionally excluded from
 * `folders`. Promote the shared root to the virtual tree root before building.
 */
export function buildPublicFolderTree(
  sharedRootFolderId: string,
  folders: Folder[],
  files: File[],
): TreeItem[] {
  const foldersForTree = folders.map((folder) =>
    folder.id === sharedRootFolderId ? { ...folder, parent_id: null } : folder,
  );

  const tree = buildTree(foldersForTree, files);
  const sharedRoot = tree.find(
    (item): item is TreeItem & { type: "folder" } =>
      item.type === "folder" && item.id === sharedRootFolderId,
  );

  return sharedRoot ? [sharedRoot] : [];
}

export function buildTree(folders: Folder[], files: File[]): TreeItem[] {
  const folderMap = new Map<string, TreeItem>();
  const rootItems: TreeItem[] = [];

  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      type: "folder",
      parent_id: folder.parent_id,
      is_public: folder.is_public,
      slug: folder.slug,
      children: [],
    });
  });

  folders.forEach((folder) => {
    const item = folderMap.get(folder.id);

    if (!item) {
      return;
    }

    if (folder.parent_id) {
      if (folderMap.has(folder.parent_id)) {
        folderMap.get(folder.parent_id)?.children?.push(item);
      }

      return;
    }

    rootItems.push(item);
  });

  files.forEach((file) => {
    const fileItem: TreeItem = {
      id: file.id,
      name: file.name,
      type: "file",
      parent_id: file.folder_id,
      is_public: file.is_public,
      slug: file.slug,
    };

    if (file.folder_id) {
      if (folderMap.has(file.folder_id)) {
        folderMap.get(file.folder_id)?.children?.push(fileItem);
      }

      return;
    }

    rootItems.push(fileItem);
  });

  sortTreeItems(rootItems);

  return rootItems;
}

function sortTreeItems(items: TreeItem[]) {
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  items.forEach((item) => {
    if (item.children) {
      sortTreeItems(item.children);
    }
  });
}
