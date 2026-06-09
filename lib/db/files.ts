import "server-only";

import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { files, folders } from "@/lib/db/schema";
import { toFileFromContentRow, toFileMetadata } from "@/lib/db/rows";
import { DEFAULT_FILE_CONTENT, readFileContent, writeFileContent } from "@/lib/storage/content";
import type { File, FileMetadata } from "@/lib/validation/models";

const fileMetadataSelection = {
  id: files.id,
  userId: files.userId,
  folderId: files.folderId,
  name: files.name,
  slug: files.slug,
  isPublic: files.isPublic,
  createdAt: files.createdAt,
  updatedAt: files.updatedAt,
  contentSize: files.contentSize,
} as const;

const fileContentSelection = {
  ...fileMetadataSelection,
  contentKey: files.contentKey,
} as const;

export async function listFileMetadataByUserId(userId: string): Promise<FileMetadata[]> {
  const rows = await db
    .select(fileMetadataSelection)
    .from(files)
    .where(eq(files.userId, userId))
    .orderBy(asc(files.name));

  return rows.map(toFileMetadata);
}

export async function getFileByIdForUser(userId: string, fileId: string): Promise<File | null> {
  const rows = await db
    .select(fileContentSelection)
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const content = await readFileContent(row.userId, row.id, row.contentKey);
  return toFileFromContentRow(row, content);
}

async function getFileRowByIdForUser(userId: string, fileId: string) {
  const rows = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getFileMetadataByIdForUser(userId: string, fileId: string) {
  const rows = await db
    .select(fileMetadataSelection)
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .limit(1);

  const row = rows[0];
  return row ? toFileMetadata(row) : null;
}

export async function getPublicFileBySlug(slug: string) {
  const rows = await db
    .select(fileContentSelection)
    .from(files)
    .where(and(eq(files.slug, slug), eq(files.isPublic, true)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const content = await readFileContent(row.userId, row.id, row.contentKey);
  return toFileFromContentRow(row, content);
}

export async function slugExists(table: "files" | "folders", slug: string) {
  if (table === "files") {
    const rows = await db.select({ id: files.id }).from(files).where(eq(files.slug, slug)).limit(1);
    return rows.length > 0;
  }

  const rows = await db
    .select({ id: folders.id })
    .from(folders)
    .where(eq(folders.slug, slug))
    .limit(1);
  return rows.length > 0;
}

export async function createFile(input: {
  userId: string;
  name: string;
  folderId: string | null;
  content?: string;
  fileId?: string;
}) {
  const fileId = input.fileId ?? crypto.randomUUID();
  const content = input.content ?? DEFAULT_FILE_CONTENT;
  const { key, size } = await writeFileContent(input.userId, fileId, content);

  const rows = await db
    .insert(files)
    .values({
      id: fileId,
      userId: input.userId,
      folderId: input.folderId,
      name: input.name,
      contentKey: key,
      contentSize: size,
    })
    .returning();

  return toFileFromContentRow(rows[0], content);
}

export async function updateFile(
  userId: string,
  fileId: string,
  update: {
    name?: string;
    content?: string;
    folderId?: string | null;
    isPublic?: boolean;
    slug?: string | null;
  },
) {
  const existing = await getFileRowByIdForUser(userId, fileId);
  if (!existing) return null;

  let contentSize = existing.contentSize;
  if (update.content !== undefined) {
    const result = await writeFileContent(userId, fileId, update.content, existing.contentKey);
    contentSize = result.size;
  }

  const rows = await db
    .update(files)
    .set({
      ...(update.name !== undefined ? { name: update.name } : {}),
      ...(update.folderId !== undefined ? { folderId: update.folderId } : {}),
      ...(update.isPublic !== undefined ? { isPublic: update.isPublic } : {}),
      ...(update.slug !== undefined ? { slug: update.slug } : {}),
      contentSize,
      updatedAt: new Date(),
    })
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning();

  const row = rows[0];
  if (!row) return null;

  const content = update.content ?? (await readFileContent(userId, fileId, row.contentKey));
  return toFileFromContentRow(row, content);
}

export async function deleteFile(userId: string, fileId: string) {
  const existing = await getFileRowByIdForUser(userId, fileId);
  if (!existing) return false;

  await db.delete(files).where(and(eq(files.id, fileId), eq(files.userId, userId)));

  return true;
}

export async function bulkInsertFiles(
  userId: string,
  items: Array<{ name: string; folderId: string | null; content: string; fileId?: string }>,
) {
  return Promise.all(
    items.map((item) =>
      createFile({
        userId,
        name: item.name,
        folderId: item.folderId,
        content: item.content,
        fileId: item.fileId,
      }),
    ),
  );
}

export async function listFileExportRowsByUserId(userId: string) {
  return db
    .select(fileContentSelection)
    .from(files)
    .where(eq(files.userId, userId))
    .orderBy(asc(files.name));
}

export async function listPublicFileRowsForSitemap() {
  return db
    .select(fileContentSelection)
    .from(files)
    .where(and(eq(files.isPublic, true), isNotNull(files.slug)))
    .orderBy(desc(files.updatedAt));
}
