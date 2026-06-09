import { z } from "zod";

import {
  emailSchema,
  nullableUuidSchema,
  nonEmptyStringSchema,
  uuidSchema,
} from "@/lib/validation/primitives";
import { markdownImportFilesSchema } from "@/lib/validation/markdown-import";

export const createFileBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  folder_id: nullableUuidSchema.optional(),
  content: z.string().optional(),
});

export const updateFileBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  content: z.string().optional(),
  folder_id: nullableUuidSchema.optional(),
  is_public: z.boolean().optional(),
});

export const createFolderBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  parent_id: nullableUuidSchema.optional(),
});

export const updateFolderBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  parent_id: nullableUuidSchema.optional(),
  is_public: z.boolean().optional(),
});

export const importFilesBodySchema = z.object({
  folder_id: nullableUuidSchema.optional(),
  files: markdownImportFilesSchema,
});

const folderImportFolderSchema = z.object({
  name: nonEmptyStringSchema,
  relativePath: nonEmptyStringSchema,
});

const folderImportFileSchema = z.object({
  name: nonEmptyStringSchema,
  content: z.string(),
  relativePath: nonEmptyStringSchema,
});

const MAX_FOLDER_IMPORT_FOLDERS = 500;
const MAX_FOLDER_IMPORT_FILES = 1000;
const MAX_FOLDER_IMPORT_TOTAL_BYTES = 50 * 1024 * 1024;

function measureUtf8Bytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export const importFolderBodySchema = z
  .object({
    folder_id: nullableUuidSchema.optional(),
    folders: z.array(folderImportFolderSchema).max(MAX_FOLDER_IMPORT_FOLDERS).default([]),
    files: z.array(folderImportFileSchema).max(MAX_FOLDER_IMPORT_FILES).default([]),
  })
  .superRefine((body, ctx) => {
    if (body.files.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No markdown files were provided.",
        path: ["files"],
      });
      return;
    }

    const filesValidation = markdownImportFilesSchema.safeParse(body.files);
    if (!filesValidation.success) {
      for (const issue of filesValidation.error.issues) {
        ctx.addIssue(issue);
      }
    }

    const totalBytes = body.files.reduce((sum, file) => sum + measureUtf8Bytes(file.content), 0);

    if (totalBytes > MAX_FOLDER_IMPORT_TOTAL_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Imported folder exceeds the total content size limit.",
        path: ["files"],
      });
    }
  });

export const checkEmailBodySchema = z.object({
  email: emailSchema,
});

export const copySharedItemBodySchema = z.object({
  destination_parent_id: nullableUuidSchema,
});

export const exportZipBodySchema = z.object({
  folderId: uuidSchema.nullable().optional(),
});

export const signInBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signUpBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
    repeatPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((value) => value.password === value.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

export const resetPasswordBodySchema = z
  .object({
    password: z.string().min(1, "Password is required"),
    repeatPassword: z.string().min(1, "Please confirm your password"),
    token: z.string().min(1, "Reset token is required"),
  })
  .refine((value) => value.password === value.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });
