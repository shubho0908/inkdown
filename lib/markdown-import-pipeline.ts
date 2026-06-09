import { ApiError, fetchJson } from "@/lib/api";
import {
  formatMarkdownImportSkipMessage,
  splitMarkdownImportSelection,
  validateMarkdownImportSelection,
} from "@/lib/markdown-import";
import {
  MARKDOWN_IMPORT_MAX_FILE_BYTES,
  MARKDOWN_IMPORT_READ_CONCURRENCY,
  isMarkdownFileName,
  normalizeMarkdownImportFileName,
} from "@/lib/markdown-import-constants";
import {
  hasStructuredImport,
  normalizeDroppedImportSelection,
  type DroppedImportSelection,
} from "@/lib/folder-import";
import { FileReadQueue } from "@/lib/upload-queue";
import type { File } from "@/lib/validation/models";
import { fileWithContentListSchema, importFolderResponseSchema } from "@/lib/validation/responses";

export interface MarkdownImportPipelineResult {
  files: File[];
  skippedMessage: string | null;
}

async function mapWithConcurrency<TInput, TResult>(
  items: TInput[],
  concurrency: number,
  worker: (item: TInput) => Promise<TResult>,
): Promise<TResult[]> {
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const chunkStarts = Array.from(
    { length: Math.ceil(items.length / limit) },
    (_, index) => index * limit,
  );

  const chunkResults = await Promise.all(
    chunkStarts.map((start) => {
      const chunk = items.slice(start, start + limit);
      return Promise.all(chunk.map(worker));
    }),
  );

  return chunkResults.flat();
}

async function importStructuredSelection(
  selection: DroppedImportSelection,
  folderId: string | null,
): Promise<MarkdownImportPipelineResult> {
  const markdownFiles = selection.files.filter(
    ({ file }) => isMarkdownFileName(file.name) && file.size <= MARKDOWN_IMPORT_MAX_FILE_BYTES,
  );

  if (markdownFiles.length === 0) {
    throw new ApiError("No markdown files found in the dropped items", 400);
  }

  const fileReadQueue = new FileReadQueue({
    concurrency: MARKDOWN_IMPORT_READ_CONCURRENCY,
    maxQueueSize: 500,
  });

  try {
    const fileReadResults = await Promise.all(
      markdownFiles.map(({ file }) => fileReadQueue.add({ file })),
    );

    const fileContentMap = new Map<globalThis.File, string>();
    for (const result of fileReadResults) {
      fileContentMap.set(result.file, result.content);
    }

    const folders = selection.folderPaths.map((path) => {
      const parts = path.split("/");
      return {
        name: parts[parts.length - 1]!,
        relativePath: path,
      };
    });

    const payloadFiles = markdownFiles.map(({ file, relativePath }) => ({
      name: normalizeMarkdownImportFileName(file.name),
      content: fileContentMap.get(file) ?? "",
      relativePath,
    }));

    const response = await fetchJson("/api/files/import-folder", importFolderResponseSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder_id: folderId,
        folders,
        files: payloadFiles,
      }),
    });

    return {
      files: response.files,
      skippedMessage: null,
    };
  } finally {
    fileReadQueue.reset();
  }
}

async function importFlatSelection(
  selection: DroppedImportSelection,
  folderId: string | null,
): Promise<MarkdownImportPipelineResult> {
  const filesToImport = selection.files.map(({ file }) => file);

  const importSelection = splitMarkdownImportSelection(
    filesToImport.map((file) => ({ name: file.name, size: file.size })),
  );
  const validationError = validateMarkdownImportSelection(importSelection);

  if (validationError) {
    throw new ApiError(validationError, 400);
  }

  const acceptedFiles = filesToImport.filter(
    (file) => isMarkdownFileName(file.name) && file.size <= MARKDOWN_IMPORT_MAX_FILE_BYTES,
  );

  const payloadFiles = await mapWithConcurrency(
    acceptedFiles,
    MARKDOWN_IMPORT_READ_CONCURRENCY,
    async (file) => ({
      name: normalizeMarkdownImportFileName(file.name),
      content: await file.text(),
    }),
  );

  const createdFiles = await fetchJson("/api/files/import", fileWithContentListSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder_id: folderId,
      files: payloadFiles,
    }),
  });

  return {
    files: createdFiles,
    skippedMessage: formatMarkdownImportSkipMessage(importSelection.rejected),
  };
}

/**
 * Single client-side entry point for workspace markdown imports.
 * Structured drops never fall back to flat import.
 */
export async function importDroppedMarkdownSelection(
  rawSelection: DroppedImportSelection,
  folderId: string | null,
): Promise<MarkdownImportPipelineResult> {
  const selection = normalizeDroppedImportSelection(rawSelection);

  if (hasStructuredImport(selection)) {
    return importStructuredSelection(selection, folderId);
  }

  return importFlatSelection(selection, folderId);
}
