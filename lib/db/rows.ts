import type { FileContentRow, FileMetadataRow, FolderTreeRow } from "@/lib/db/row-types";
import {
  fileMetadataRowSchema,
  fileMetadataSchema,
  fileSchema,
  folderTreeRowSchema,
  folderSchema,
  toIsoDateTime,
  type File,
  type FileMetadata,
  type Folder,
} from "@/lib/validation/models";

export function toFolder(row: FolderTreeRow): Folder {
  const parsed = folderTreeRowSchema.parse(row);

  return folderSchema.parse({
    id: parsed.id,
    user_id: parsed.userId,
    name: parsed.name,
    parent_id: parsed.parentId,
    slug: parsed.slug,
    is_public: parsed.isPublic,
    created_at: toIsoDateTime(parsed.createdAt),
    updated_at: toIsoDateTime(parsed.updatedAt),
  });
}

export function toFileMetadata(row: FileMetadataRow): FileMetadata {
  const parsed = fileMetadataRowSchema.parse(row);

  return fileMetadataSchema.parse({
    id: parsed.id,
    user_id: parsed.userId,
    folder_id: parsed.folderId,
    name: parsed.name,
    slug: parsed.slug,
    is_public: parsed.isPublic,
    created_at: toIsoDateTime(parsed.createdAt),
    updated_at: toIsoDateTime(parsed.updatedAt),
    content_size: parsed.contentSize,
  });
}

function toFile(row: FileMetadataRow, content: string): File {
  const metadata = toFileMetadata(row);

  return fileSchema.parse({
    ...metadata,
    content,
  });
}

export function toFileFromContentRow(row: FileContentRow, content: string): File {
  return toFile(row, content);
}
