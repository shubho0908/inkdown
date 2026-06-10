import { z } from "zod";

import {
  fileListSchema,
  fileSchema,
  fileWithContentListSchema,
  folderListSchema,
  folderSchema,
} from "@/lib/validation/models";

export const successResponseSchema = z.object({
  success: z.literal(true),
});

export const checkEmailResponseSchema = z.object({
  exists: z.boolean(),
});

export const copySharedItemResponseSchema = z.object({
  success: z.literal(true),
  fileId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  folderCount: z.number().int().nonnegative().optional(),
  fileCount: z.number().int().nonnegative().optional(),
});

export const platformMetricsResponseSchema = z.object({
  total_users: z.number().int().nonnegative(),
  total_documents: z.number().int().nonnegative(),
  total_folders: z.number().int().nonnegative(),
  public_documents: z.number().int().nonnegative(),
  is_ready: z.boolean(),
  computed_at: z.string().datetime(),
});

export const importFolderResponseSchema = z.object({
  folders: z.array(
    folderSchema.pick({
      id: true,
      name: true,
      parent_id: true,
    }),
  ),
  files: fileWithContentListSchema,
});

export { fileSchema, folderSchema, fileListSchema, folderListSchema, fileWithContentListSchema };
