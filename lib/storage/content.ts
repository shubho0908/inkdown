import "server-only";

import { buildFileContentKey, getObjectText, putObjectText } from "@/lib/storage/r2";

export const DEFAULT_FILE_CONTENT = "# New Document\n\nStart writing here...";
const EMPTY_FILE_CONTENT = "# Empty Document\n";

function getContentKeyForFile(userId: string, fileId: string) {
  return buildFileContentKey(userId, fileId);
}

export async function readFileContent(userId: string, fileId: string, contentKey: string) {
  const content = await getObjectText(contentKey);
  return content ?? EMPTY_FILE_CONTENT;
}

export async function writeFileContent(
  userId: string,
  fileId: string,
  content: string,
  existingKey?: string,
) {
  const key = existingKey ?? getContentKeyForFile(userId, fileId);
  const size = await putObjectText(key, content);
  return { key, size };
}
