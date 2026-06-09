import { z } from "zod";

import {
  MARKDOWN_IMPORT_MAX_FILE_BYTES,
  MARKDOWN_IMPORT_MAX_FILES,
  MARKDOWN_IMPORT_MAX_TOTAL_BYTES,
  isMarkdownFileName,
  normalizeMarkdownImportFileName,
} from "@/lib/markdown-import-constants";
import { nonEmptyStringSchema } from "@/lib/validation/primitives";

const markdownContentSchema = z.string();

function measureUtf8Bytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function validateMarkdownFilesByteLimits(
  files: Array<{ name: string; content: string }>,
  ctx: z.RefinementCtx,
) {
  let totalBytes = 0;

  for (const [index, file] of files.entries()) {
    const normalizedName = normalizeMarkdownImportFileName(file.name);

    if (!isMarkdownFileName(normalizedName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `"${normalizedName || "Unnamed file"}" is not a supported markdown file.`,
        path: ["files", index, "name"],
      });
      continue;
    }

    const bytes = measureUtf8Bytes(file.content);
    if (bytes > MARKDOWN_IMPORT_MAX_FILE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `"${normalizedName}" exceeds the per-file import limit.`,
        path: ["files", index, "content"],
      });
    }

    totalBytes += bytes;
  }

  if (totalBytes > MARKDOWN_IMPORT_MAX_TOTAL_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Imported markdown files exceed the total size limit.",
      path: ["files"],
    });
  }
}

const markdownImportFileSchema = z.object({
  name: nonEmptyStringSchema,
  content: markdownContentSchema,
});

export const markdownImportFilesSchema = z
  .array(markdownImportFileSchema)
  .min(1, "No markdown files were provided.")
  .max(
    MARKDOWN_IMPORT_MAX_FILES,
    `You can import up to ${MARKDOWN_IMPORT_MAX_FILES} markdown files at once.`,
  )
  .superRefine(validateMarkdownFilesByteLimits);
