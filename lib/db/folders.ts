import "server-only";

import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { files, folders } from "@/lib/db/schema";
import { collectSubtreeFolderIds } from "@/lib/folder-subtree";
import { toFolder } from "@/lib/db/rows";
import type { Folder } from "@/lib/validation/models";

const folderTreeSelection = {
  id: folders.id,
  userId: folders.userId,
  name: folders.name,
  parentId: folders.parentId,
  slug: folders.slug,
  isPublic: folders.isPublic,
  createdAt: folders.createdAt,
  updatedAt: folders.updatedAt,
} as const;

export async function listFoldersByUserId(userId: string): Promise<Folder[]> {
  const rows = await db
    .select(folderTreeSelection)
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(asc(folders.name));

  return rows.map(toFolder);
}

export async function listFolderShareState(userId: string) {
  return db
    .select({
      id: folders.id,
      parent_id: folders.parentId,
      slug: folders.slug,
      is_public: folders.isPublic,
    })
    .from(folders)
    .where(eq(folders.userId, userId));
}

export async function insertFolder(input: {
  userId: string;
  name: string;
  parentId: string | null;
}) {
  const rows = await db
    .insert(folders)
    .values({
      userId: input.userId,
      name: input.name,
      parentId: input.parentId,
    })
    .returning();

  return toFolder(rows[0]);
}

export async function updateFolder(
  userId: string,
  folderId: string,
  update: {
    name?: string;
    parentId?: string | null;
    slug?: string | null;
    isPublic?: boolean;
  },
) {
  const rows = await db
    .update(folders)
    .set({
      ...(update.name !== undefined ? { name: update.name } : {}),
      ...(update.parentId !== undefined ? { parentId: update.parentId } : {}),
      ...(update.slug !== undefined ? { slug: update.slug } : {}),
      ...(update.isPublic !== undefined ? { isPublic: update.isPublic } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning();

  return rows[0] ? toFolder(rows[0]) : null;
}

export async function deleteFolder(userId: string, folderId: string) {
  const folderRows = await db
    .select({ id: folders.id, parentId: folders.parentId })
    .from(folders)
    .where(eq(folders.userId, userId));

  if (!folderRows.some((folder) => folder.id === folderId)) {
    return false;
  }

  const subtreeIds = collectSubtreeFolderIds(
    folderRows.map((folder) => ({ id: folder.id, parentId: folder.parentId })),
    folderId,
  );

  const subtreeIdList = [...subtreeIds];

  return db.transaction(async (tx) => {
    await tx
      .delete(files)
      .where(and(eq(files.userId, userId), inArray(files.folderId, subtreeIdList)));

    const deleted = await tx
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning({ id: folders.id });

    return deleted.length > 0;
  });
}

export async function listPublicFolderRowsForSitemap() {
  return db
    .select()
    .from(folders)
    .where(and(eq(folders.isPublic, true), isNotNull(folders.slug)))
    .orderBy(desc(folders.updatedAt));
}
