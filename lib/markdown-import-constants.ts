const KIB = 1024;
const MIB = 1024 * KIB;

export const MARKDOWN_IMPORT_MAX_FILES = 500;
export const MARKDOWN_IMPORT_MAX_FILE_BYTES = 2 * MIB;
export const MARKDOWN_IMPORT_MAX_TOTAL_BYTES = 20 * MIB;
export const MARKDOWN_IMPORT_READ_CONCURRENCY = 4;

export function normalizeMarkdownImportFileName(name: string) {
  return name.split(/[/\\]/).pop()?.trim() ?? "";
}

export function isMarkdownFileName(name: string) {
  const normalizedName = normalizeMarkdownImportFileName(name);
  return normalizedName.length > 0 && normalizedName.toLowerCase().endsWith(".md");
}

export function formatMarkdownImportBytes(bytes: number) {
  if (bytes >= MIB) {
    return `${Math.round((bytes / MIB) * 10) / 10} MB`;
  }

  if (bytes >= KIB) {
    return `${Math.round(bytes / KIB)} KB`;
  }

  return `${bytes} B`;
}
