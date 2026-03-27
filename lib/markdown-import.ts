const KIB = 1024
const MIB = 1024 * KIB

export const MARKDOWN_IMPORT_MAX_FILES = 50
export const MARKDOWN_IMPORT_MAX_FILE_BYTES = 2 * MIB
export const MARKDOWN_IMPORT_MAX_TOTAL_BYTES = 20 * MIB
export const MARKDOWN_IMPORT_READ_CONCURRENCY = 4

export interface MarkdownImportSourceFile {
  name: string
  size: number
}

export interface MarkdownImportPayloadFile {
  name: string
  content: string
}

export interface MarkdownImportRejection {
  name: string
  reason: string
}

export interface MarkdownImportSelection {
  accepted: MarkdownImportSourceFile[]
  rejected: MarkdownImportRejection[]
  totalBytes: number
}

export function normalizeMarkdownImportFileName(name: string) {
  return name.split(/[/\\]/).pop()?.trim() ?? ''
}

export function isMarkdownFileName(name: string) {
  const normalizedName = normalizeMarkdownImportFileName(name)
  return normalizedName.length > 0 && normalizedName.toLowerCase().endsWith('.md')
}

export function splitMarkdownImportSelection(
  files: MarkdownImportSourceFile[],
): MarkdownImportSelection {
  const accepted: MarkdownImportSourceFile[] = []
  const rejected: MarkdownImportRejection[] = []
  let totalBytes = 0

  for (const file of files) {
    const normalizedName = normalizeMarkdownImportFileName(file.name)

    if (!isMarkdownFileName(normalizedName)) {
      rejected.push({
        name: normalizedName || 'Unnamed file',
        reason: 'Only .md files can be imported.',
      })
      continue
    }

    if (file.size > MARKDOWN_IMPORT_MAX_FILE_BYTES) {
      rejected.push({
        name: normalizedName,
        reason: `File exceeds the ${formatBytes(MARKDOWN_IMPORT_MAX_FILE_BYTES)} limit.`,
      })
      continue
    }

    accepted.push({
      name: normalizedName,
      size: file.size,
    })
    totalBytes += file.size
  }

  return {
    accepted,
    rejected,
    totalBytes,
  }
}

export function validateMarkdownImportSelection(selection: MarkdownImportSelection) {
  if (selection.accepted.length === 0) {
    if (selection.rejected.length === 1) {
      return `Skipped "${selection.rejected[0].name}": ${selection.rejected[0].reason}`
    }

    if (selection.rejected.length > 1) {
      return 'Only .md files within the import limits can be imported.'
    }

    return 'Drop one or more .md files to import.'
  }

  if (selection.accepted.length > MARKDOWN_IMPORT_MAX_FILES) {
    return `You can import up to ${MARKDOWN_IMPORT_MAX_FILES} markdown files at once.`
  }

  if (selection.totalBytes > MARKDOWN_IMPORT_MAX_TOTAL_BYTES) {
    return `Imported markdown files must stay under ${formatBytes(MARKDOWN_IMPORT_MAX_TOTAL_BYTES)} total.`
  }

  return null
}

export function validateMarkdownImportPayload(files: MarkdownImportPayloadFile[]) {
  if (!Array.isArray(files) || files.length === 0) {
    return 'No markdown files were provided.'
  }

  if (files.length > MARKDOWN_IMPORT_MAX_FILES) {
    return `You can import up to ${MARKDOWN_IMPORT_MAX_FILES} markdown files at once.`
  }

  let totalBytes = 0
  const encoder = new TextEncoder()

  for (const file of files) {
    const normalizedName = normalizeMarkdownImportFileName(file.name)

    if (!isMarkdownFileName(normalizedName)) {
      return `"${normalizedName || 'Unnamed file'}" is not a supported markdown file.`
    }

    if (typeof file.content !== 'string') {
      return `File "${normalizedName}" has invalid content.`
    }

    const bytes = encoder.encode(file.content).byteLength
    if (bytes > MARKDOWN_IMPORT_MAX_FILE_BYTES) {
      return `"${normalizedName}" exceeds the ${formatBytes(MARKDOWN_IMPORT_MAX_FILE_BYTES)} limit.`
    }

    totalBytes += bytes
  }

  if (totalBytes > MARKDOWN_IMPORT_MAX_TOTAL_BYTES) {
    return `Imported markdown files must stay under ${formatBytes(MARKDOWN_IMPORT_MAX_TOTAL_BYTES)} total.`
  }

  return null
}

export function formatMarkdownImportSkipMessage(rejected: MarkdownImportRejection[]) {
  if (rejected.length === 0) {
    return null
  }

  if (rejected.length === 1) {
    return `Skipped "${rejected[0].name}": ${rejected[0].reason}`
  }

  return `Skipped ${rejected.length} files that were not valid .md imports.`
}

function formatBytes(bytes: number) {
  if (bytes >= MIB) {
    return `${Math.round((bytes / MIB) * 10) / 10} MB`
  }

  if (bytes >= KIB) {
    return `${Math.round(bytes / KIB)} KB`
  }

  return `${bytes} B`
}
