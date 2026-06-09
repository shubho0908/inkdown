import "server-only";

import { cache } from "react";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { files, folders } from "@/lib/db/schema";
import {
  collectSubtreeFolderIds,
  filterFilesInSubtree,
  filterFoldersInSubtree,
} from "@/lib/db/subtree";
import { getPublicFolderRootBySlug } from "@/lib/db/public-snapshot";
import { toFileMetadata, toFolder } from "@/lib/db/rows";
import { buildTree } from "@/lib/workspace-tree";
import type { FileMetadata, Folder, TreeItem } from "@/lib/validation/models";
import { getProfileUsername } from "@/lib/db/profiles";
import { readFileContent } from "@/lib/storage/content";
import { listPublicFolderRowsForSitemap } from "@/lib/db/folders";

export type PublicFolderRecord = Folder & {
  username: string | null;
};

export interface PublicFolderTreeData {
  folder: PublicFolderRecord;
  folders: Folder[];
  files: FileMetadata[];
  treeItems: TreeItem[];
}

export type PublicFolderFileRecord = FileMetadata & {
  content: string;
  username: string | null;
};

async function fetchPublicFolderSubtreeFolders(slug: string) {
  const rootRow = await getPublicFolderRootBySlug(slug);
  if (!rootRow) return [];

  const folderRows = await db.select().from(folders).where(eq(folders.userId, rootRow.userId));

  return filterFoldersInSubtree(folderRows, rootRow.id).map(toFolder);
}

async function fetchPublicFolderSubtreeFiles(slug: string) {
  const rootRow = await getPublicFolderRootBySlug(slug);
  if (!rootRow) return [];

  const [folderRows, fileRows] = await Promise.all([
    db.select().from(folders).where(eq(folders.userId, rootRow.userId)),
    db.select().from(files).where(eq(files.userId, rootRow.userId)),
  ]);

  const subtreeIds = collectSubtreeFolderIds(
    folderRows.map((folder) => ({ id: folder.id, parentId: folder.parentId })),
    rootRow.id,
  );

  return filterFilesInSubtree(fileRows, subtreeIds).map(toFileMetadata);
}

function normalizeTreeItemsToSharedRoot(items: TreeItem[], rootFolderId: string) {
  const rootFolder = items.find(
    (item): item is TreeItem & { type: "folder" } =>
      item.type === "folder" && item.id === rootFolderId,
  );

  if (!rootFolder) {
    return [];
  }

  return [rootFolder];
}

export const getPublicFolderBySlug = cache(
  async (slug: string): Promise<PublicFolderRecord | null> => {
    const folder = await getPublicFolderRootBySlug(slug);
    if (!folder) return null;

    return {
      ...toFolder(folder),
      username: await getProfileUsername(folder.userId),
    };
  },
);

export const getPublicFolderTreeBySlug = cache(async (slug: string) => {
  const folder = await getPublicFolderBySlug(slug);
  if (!folder) return null;

  const [foldersInSubtree, filesInSubtree] = await Promise.all([
    fetchPublicFolderSubtreeFolders(slug),
    fetchPublicFolderSubtreeFiles(slug),
  ]);

  const treeItems = normalizeTreeItemsToSharedRoot(
    buildTree(
      foldersInSubtree,
      filesInSubtree.map((file) => ({ ...file, content: "" })),
    ),
    folder.id,
  );

  return { folder, folders: foldersInSubtree, files: filesInSubtree, treeItems };
});

export const getPublicFolderFileById = cache(async (slug: string, fileId: string) => {
  const folder = await getPublicFolderBySlug(slug);
  if (!folder) return null;

  const rootRow = await getPublicFolderRootBySlug(slug);
  if (!rootRow) return null;

  const [folderRows, fileRows] = await Promise.all([
    db.select().from(folders).where(eq(folders.userId, rootRow.userId)),
    db
      .select()
      .from(files)
      .where(and(eq(files.userId, rootRow.userId), eq(files.id, fileId)))
      .limit(1),
  ]);

  const subtreeIds = collectSubtreeFolderIds(
    folderRows.map((entry) => ({ id: entry.id, parentId: entry.parentId })),
    rootRow.id,
  );

  const row = fileRows[0];
  if (!row || row.folderId === null || !subtreeIds.has(row.folderId)) {
    return null;
  }

  const content = await readFileContent(row.userId, row.id, row.contentKey);

  return {
    ...toFileMetadata(row),
    content,
    username: folder.username,
  };
});

export async function listPublicFoldersForSitemap() {
  const rows = await listPublicFolderRowsForSitemap();

  return rows.map((row) => ({
    ...toFolder(row),
    username: null,
  }));
}
