import type { FileRow, FolderRow, ProfileRow } from "@/lib/db/schema";

export type FileMetadataRow = Pick<
  FileRow,
  | "id"
  | "userId"
  | "folderId"
  | "name"
  | "slug"
  | "isPublic"
  | "createdAt"
  | "updatedAt"
  | "contentSize"
>;

export type FileContentRow = FileMetadataRow & Pick<FileRow, "contentKey">;

export type FolderTreeRow = Pick<
  FolderRow,
  "id" | "userId" | "name" | "parentId" | "slug" | "isPublic" | "createdAt" | "updatedAt"
>;

export type { ProfileRow };
