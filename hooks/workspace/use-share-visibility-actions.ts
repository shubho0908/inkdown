"use client";

import { useToggleFilePublicMutation } from "@/hooks/workspace/use-file-mutations";
import { useToggleFolderPublicMutation } from "@/hooks/workspace/use-folder-mutations";
import type { File, Folder } from "@/lib/validation/models";

export function useShareVisibilityActions() {
  const fileMutation = useToggleFilePublicMutation();
  const folderMutation = useToggleFolderPublicMutation();

  function isPendingFor(itemId: string) {
    if (fileMutation.isPending && fileMutation.variables?.file.id === itemId) {
      return true;
    }

    return folderMutation.isPending && folderMutation.variables?.folder.id === itemId;
  }

  function toggle(
    input:
      | { type: "file"; file: File; isPublic: boolean }
      | { type: "folder"; folder: Folder; isPublic: boolean },
  ) {
    if (input.type === "file") {
      fileMutation.mutate({ file: input.file, isPublic: input.isPublic });
      return;
    }

    folderMutation.mutate({ folder: input.folder, isPublic: input.isPublic });
  }

  return {
    toggle,
    isPendingFor,
  };
}
