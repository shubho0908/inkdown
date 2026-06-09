import type { DragEvent } from "react";

import { captureDroppedImportSelection, type DroppedImportSelection } from "@/lib/folder-import";
import type { Folder } from "@/lib/validation/models";

export type FolderRef = Pick<Folder, "id" | "parent_id">[];

export function isExternalFileDragEvent(event: DragEvent): boolean {
  return event.dataTransfer?.types?.includes("Files") ?? false;
}

interface ExternalFileDropOptions {
  event: DragEvent;
  folderId: string | null;
  onImport: (selection: DroppedImportSelection, folderId: string | null) => void;
  stopPropagation?: boolean;
}

/**
 * Canonical handler for external file/folder drops into the workspace tree.
 * Parses the DataTransfer synchronously (awaited in-handler) before import.
 */
export async function handleExternalFileDrop({
  event,
  folderId,
  onImport,
  stopPropagation = true,
}: ExternalFileDropOptions): Promise<boolean> {
  if (!isExternalFileDragEvent(event)) {
    return false;
  }

  if (stopPropagation) {
    event.stopPropagation();
  }

  event.preventDefault();

  const selection = await captureDroppedImportSelection(event.dataTransfer);
  if (selection && selection.files.length > 0) {
    onImport(selection, folderId);
  }

  return true;
}
