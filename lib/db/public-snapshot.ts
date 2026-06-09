import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { files, folders } from "@/lib/db/schema";
import {
  collectSubtreeFolderIds,
  filterFilesInSubtree,
  filterFoldersInSubtree,
} from "@/lib/db/subtree";
import { toFileFromContentRow, toFolder } from "@/lib/db/rows";
import { readFileContent } from "@/lib/storage/content";
import type { File, Folder } from "@/lib/validation/models";

export async function getPublicFolderRootBySlug(slug: string) {
  const rows = await db
    .select()
    .from(folders)
    .where(and(eq(folders.slug, slug), eq(folders.isPublic, true)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getPublicFolderSnapshot(slug: string): Promise<{
  rootFolder: Folder;
  folders: Folder[];
  files: Array<File & { content_key: string }>;
} | null> {
  const rootRow = await getPublicFolderRootBySlug(slug);
  if (!rootRow) return null;

  const [folderRows, fileRows] = await Promise.all([
    db.select().from(folders).where(eq(folders.userId, rootRow.userId)),
    db.select().from(files).where(eq(files.userId, rootRow.userId)),
  ]);

  const subtreeFolderRows = filterFoldersInSubtree(folderRows, rootRow.id);
  const subtreeIds = collectSubtreeFolderIds(
    folderRows.map((folder) => ({ id: folder.id, parentId: folder.parentId })),
    rootRow.id,
  );
  const subtreeFileRows = filterFilesInSubtree(fileRows, subtreeIds);

  const filesWithContent = await Promise.all(
    subtreeFileRows.map(async (row) => {
      const content = await readFileContent(row.userId, row.id, row.contentKey);
      return {
        ...toFileFromContentRow(row, content),
        content_key: row.contentKey,
      };
    }),
  );

  return {
    rootFolder: toFolder(rootRow),
    folders: subtreeFolderRows.map(toFolder),
    files: filesWithContent,
  };
}
