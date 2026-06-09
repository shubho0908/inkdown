import { getDataTransferEntry } from "@/lib/data-transfer-entry";

export interface DroppedImportSelection {
  files: Array<{ file: File; relativePath: string }>;
  folderPaths: string[];
}

export interface FileSystemEntryWithFile extends FileSystemEntry {
  file?: (callback: (file: File) => void, errorCallback?: (error: Error) => void) => void;
}

type FileWithRelativePath = File & { webkitRelativePath?: string };

// Safety limits to prevent stack overflow and memory issues
const MAX_DEPTH = 100;
const MAX_ENTRIES = 10000;

/**
 * Check if the browser supports webkitGetAsEntry
 */
export function supportsWebkitGetAsEntry(): boolean {
  return (
    "webkitGetAsEntry" in DataTransferItem.prototype || "getAsEntry" in DataTransferItem.prototype
  );
}

/**
 * Read all entries from a directory reader, handling the 100-entry limit in Chromium
 * This is critical - readEntries() only returns 100 entries max per call
 * Must call repeatedly until empty array is returned
 * Converted to iterative to prevent stack overflow
 */
async function readAllEntries(
  directoryReader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  const entries: FileSystemEntry[] = [];

  const readNextBatch = (): Promise<void> =>
    new Promise((resolve, reject) => {
      directoryReader.readEntries(
        (results) => {
          if (results.length === 0) {
            resolve();
            return;
          }

          entries.push(...results);

          if (entries.length > MAX_ENTRIES) {
            reject(new Error(`Too many entries (max ${MAX_ENTRIES})`));
            return;
          }

          readNextBatch().then(resolve).catch(reject);
        },
        (error) => {
          reject(error);
        },
      );
    });

  await readNextBatch();
  return entries;
}

async function processDirectoryEntry(
  directoryEntry: FileSystemDirectoryEntry,
  path: string,
  depth: number,
): Promise<{ files: Array<{ file: File; relativePath: string }>; folderPaths: string[] }> {
  if (depth > MAX_DEPTH) {
    console.error(`Directory depth exceeds maximum (${MAX_DEPTH}), skipping: ${path}`);
    return { files: [], folderPaths: [] };
  }

  const files: Array<{ file: File; relativePath: string }> = [];
  const folderPaths: string[] = [];

  try {
    const directoryReader = directoryEntry.createReader();
    const entries = await readAllEntries(directoryReader);

    const fileEntries: Array<{ fileEntry: FileSystemEntryWithFile; entryPath: string }> = [];
    const subdirectoryEntries: Array<{
      entry: FileSystemDirectoryEntry;
      entryPath: string;
    }> = [];

    for (const dirEntry of entries) {
      try {
        const entryPath = path ? `${path}/${dirEntry.name}` : dirEntry.name;

        if (dirEntry.isDirectory) {
          folderPaths.push(entryPath);
          subdirectoryEntries.push({
            entry: dirEntry as FileSystemDirectoryEntry,
            entryPath,
          });
        } else if (dirEntry.isFile) {
          fileEntries.push({
            fileEntry: dirEntry as FileSystemEntryWithFile,
            entryPath,
          });
        }
      } catch (error) {
        console.error(`Error processing entry ${dirEntry.name}:`, error);
      }
    }

    const readFiles = await Promise.all(
      fileEntries.map(async ({ fileEntry, entryPath }) => {
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file?.(resolve, reject);
        });
        return { file, relativePath: entryPath };
      }),
    );
    files.push(...readFiles);

    const childResults = await Promise.all(
      subdirectoryEntries.map(({ entry, entryPath }) =>
        processDirectoryEntry(entry, entryPath, depth + 1),
      ),
    );

    for (const childResult of childResults) {
      files.push(...childResult.files);
      folderPaths.push(...childResult.folderPaths);
    }
  } catch (error) {
    console.error(`Error reading directory ${path}:`, error);
  }

  return { files, folderPaths };
}

async function traverseDirectory(
  directoryEntry: FileSystemDirectoryEntry,
  basePath: string = "",
): Promise<{ files: Array<{ file: File; relativePath: string }>; folderPaths: string[] }> {
  return processDirectoryEntry(directoryEntry, basePath, 0);
}

/**
 * Parse dropped items using webkitGetAsEntry API
 * This is the modern, robust approach for folder drag-drop
 */
export async function parseDroppedItems(
  items: DataTransferItemList | DataTransferItem[],
): Promise<{ files: Array<{ file: File; relativePath: string }>; folderPaths: string[] }> {
  const allFiles: Array<{ file: File; relativePath: string }> = [];
  const allFolderPaths: string[] = [];

  const itemResults = await Promise.all(
    Array.from(items).map(async (item) => {
      if (item.kind !== "file") {
        return null;
      }

      try {
        const entry = getDataTransferEntry(item);

        if (!entry) {
          return null;
        }

        if (entry.isDirectory) {
          const result = await traverseDirectory(entry as FileSystemDirectoryEntry, entry.name);
          return {
            files: result.files,
            folderPaths: [entry.name, ...result.folderPaths],
          };
        }

        if (entry.isFile) {
          const fileEntry = entry as FileSystemEntryWithFile;
          const file = await new Promise<File>((resolve, reject) => {
            fileEntry.file?.(resolve, reject);
          });
          return {
            files: [{ file, relativePath: file.name }],
            folderPaths: [] as string[],
          };
        }
      } catch (error) {
        console.error("Error processing dropped item:", error);
      }

      return null;
    }),
  );

  for (const result of itemResults) {
    if (!result) continue;
    allFiles.push(...result.files);
    allFolderPaths.push(...result.folderPaths);
  }

  return { files: allFiles, folderPaths: allFolderPaths };
}

export function collectFolderPathsFromRelativePath(relativePath: string): string[] {
  const slashIndex = relativePath.lastIndexOf("/");
  if (slashIndex === -1) return [];

  const folderPathSet = new Set<string>();
  addFolderPathSegments(folderPathSet, relativePath.slice(0, slashIndex));
  return [...folderPathSet].toSorted((a, b) => a.split("/").length - b.split("/").length);
}

function addFolderPathSegments(folderPathSet: Set<string>, directoryPath: string) {
  const parts = directoryPath.split("/").filter(Boolean);
  let current = "";

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    folderPathSet.add(current);
  }
}

export function hasStructuredImport(selection: DroppedImportSelection): boolean {
  if (selection.folderPaths.length > 0) return true;
  return selection.files.some(({ relativePath }) => relativePath.includes("/"));
}

/**
 * Enforces the invariant that every nested file path has matching folder paths.
 */
export function normalizeDroppedImportSelection(
  selection: DroppedImportSelection,
): DroppedImportSelection {
  const folderPathSet = new Set(selection.folderPaths);

  for (const { relativePath } of selection.files) {
    for (const folderPath of collectFolderPathsFromRelativePath(relativePath)) {
      folderPathSet.add(folderPath);
    }
  }

  return {
    files: selection.files,
    folderPaths: [...folderPathSet].toSorted((a, b) => a.split("/").length - b.split("/").length),
  };
}

/**
 * Fallback when webkitGetAsEntry is unavailable or already invalidated.
 * Folder drops from Chromium still populate File.webkitRelativePath.
 */
export function parseFilesFromWebkitRelativePaths(files: File[]): DroppedImportSelection {
  const parsedFiles: DroppedImportSelection["files"] = [];
  const folderPathSet = new Set<string>();

  for (const file of files) {
    const relativePath = file.webkitRelativePath?.trim() || file.name;
    parsedFiles.push({ file, relativePath });

    const slashIndex = relativePath.lastIndexOf("/");
    if (slashIndex === -1) continue;

    addFolderPathSegments(folderPathSet, relativePath.slice(0, slashIndex));
  }

  const folderPaths = [...folderPathSet].toSorted(
    (a, b) => a.split("/").length - b.split("/").length,
  );

  return { files: parsedFiles, folderPaths };
}

async function captureFromDataTransferEntries(
  items: DataTransferItem[],
): Promise<DroppedImportSelection | null> {
  if (!supportsWebkitGetAsEntry()) return null;

  try {
    const parsed = await parseDroppedItems(items);
    return parsed.files.length > 0 ? normalizeDroppedImportSelection(parsed) : null;
  } catch (error) {
    console.error("Error parsing dropped entries:", error);
    return null;
  }
}

function captureFromDataTransferFiles(dataTransfer: DataTransfer): DroppedImportSelection | null {
  const files = Array.from(dataTransfer.files ?? []);
  if (files.length === 0) return null;

  const hasRelativePaths = files.some((file) =>
    Boolean((file as FileWithRelativePath).webkitRelativePath),
  );

  const selection = hasRelativePaths
    ? parseFilesFromWebkitRelativePaths(files)
    : {
        files: files.map((file) => ({ file, relativePath: file.name })),
        folderPaths: [],
      };

  return normalizeDroppedImportSelection(selection);
}

/**
 * Capture dropped files while the DataTransfer is still valid.
 * Must be awaited inside the drop handler before it returns.
 */
export async function captureDroppedImportSelection(
  dataTransfer: DataTransfer,
): Promise<DroppedImportSelection | null> {
  const items = Array.from(dataTransfer.items ?? []).filter((item) => item.kind === "file");
  if (items.length === 0) return null;

  const fromEntries = await captureFromDataTransferEntries(items);
  if (fromEntries) return fromEntries;

  return captureFromDataTransferFiles(dataTransfer);
}
