import type { DragEvent } from "react";

import type { Folder } from "@/lib/validation/models";

export type FolderRef = Pick<Folder, "id" | "parent_id">[];

export function isExternalFileDragEvent(event: DragEvent): boolean {
  return event.dataTransfer?.types?.includes("Files") ?? false;
}

export function getDroppedFiles(event: DragEvent): File[] {
  return Array.from(event.dataTransfer?.files ?? []);
}
