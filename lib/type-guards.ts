import type { File, Folder } from "@/lib/validation/models";

export function isFile(value: File | Folder): value is File {
  return "folder_id" in value;
}
