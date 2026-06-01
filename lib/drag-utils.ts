import type { DragEvent } from "react";

export type FolderRef = { id: string; parent_id: string | null }[];

export function isExternalFileDragEvent(event: DragEvent): boolean {
  return event.dataTransfer?.types?.includes("Files") ?? false;
}

export function getDroppedFiles(event: DragEvent): File[] {
  return Array.from(event.dataTransfer?.files ?? []);
}
