import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { files, folders } from "@/lib/db/schema";
import {
  isoDateTimeSchema,
  nullableUuidSchema,
  userIdSchema,
  uuidSchema,
} from "@/lib/validation/primitives";

const fileRowSchema = createSelectSchema(files);
const folderRowSchema = createSelectSchema(folders);

export const fileMetadataRowSchema = fileRowSchema.pick({
  id: true,
  userId: true,
  folderId: true,
  name: true,
  slug: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
  contentSize: true,
});

export const folderTreeRowSchema = folderRowSchema.pick({
  id: true,
  userId: true,
  name: true,
  parentId: true,
  slug: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
});

export const fileMetadataSchema = z.object({
  id: uuidSchema,
  user_id: userIdSchema,
  folder_id: nullableUuidSchema,
  name: z.string(),
  slug: z.string().nullable(),
  is_public: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  content_size: z.number().int(),
});

export const folderSchema = z.object({
  id: uuidSchema,
  user_id: userIdSchema,
  name: z.string(),
  parent_id: nullableUuidSchema,
  slug: z.string().nullable(),
  is_public: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const fileSchema = fileMetadataSchema.extend({
  content: z.string().optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type Folder = z.infer<typeof folderSchema>;
export type File = z.infer<typeof fileSchema>;

export interface TreeItem {
  id: string;
  name: string;
  type: "file" | "folder";
  parent_id: string | null;
  children?: TreeItem[];
  is_public?: boolean;
  slug?: string | null;
}

const treeItemSchema: z.ZodType<TreeItem> = z.lazy(() =>
  z.object({
    id: uuidSchema,
    name: z.string(),
    type: z.enum(["file", "folder"]),
    parent_id: nullableUuidSchema,
    children: z.array(treeItemSchema).optional(),
    is_public: z.boolean().optional(),
    slug: z.string().nullable().optional(),
  }),
);

export const folderListSchema = z.array(folderSchema);
export const fileListSchema = z.array(fileMetadataSchema);
export const fileWithContentListSchema = z.array(fileSchema);

export function toIsoDateTime(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
