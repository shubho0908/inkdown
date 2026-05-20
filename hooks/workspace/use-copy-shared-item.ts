"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { workspaceKeys } from "@/lib/query-keys";
import type { File, Folder } from "@/lib/types";
import { toast } from "sonner";
import {
  getWorkspaceSnapshot,
  optimisticFile,
  optimisticFolder,
  replaceFile,
  replaceFolder,
} from "@/hooks/workspace/workspace-cache";

interface CopySharedItemInput {
  shareSlug: string;
  itemType: "file" | "folder";
  itemName: string;
  destinationParentId: string | null;
}

export function useCopySharedItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareSlug,
      itemType,
      destinationParentId,
      itemName,
    }: CopySharedItemInput) => {
      const endpoint =
        itemType === "folder"
          ? `/api/public/folders/${shareSlug}/copy`
          : `/api/public/files/${shareSlug}/copy`;

      return fetchJson<{ success: true; fileId?: string; folderId?: string }>(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination_parent_id: destinationParentId }),
      });
    },
    onMutate: async ({ itemType, destinationParentId, itemName }) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.files() });
      await queryClient.cancelQueries({ queryKey: workspaceKeys.folders() });

      const snapshot = getWorkspaceSnapshot(queryClient);
      const optimisticId = `temp-copy-${crypto.randomUUID()}`;

      if (itemType === "file") {
        const optimisticItem = optimisticFile({
          id: optimisticId,
          folderId: destinationParentId,
          name: itemName,
        });
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          replaceFile(snapshot.files, optimisticItem),
        );
      } else {
        const optimisticItem = optimisticFolder({
          id: optimisticId,
          parentId: destinationParentId,
          name: itemName,
        });
        queryClient.setQueryData<Folder[]>(
          workspaceKeys.folders(),
          replaceFolder(snapshot.folders, optimisticItem),
        );
      }

      return { snapshot, optimisticId };
    },
    onError: (error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(workspaceKeys.files(), context.snapshot.files);
      queryClient.setQueryData(workspaceKeys.folders(), context.snapshot.folders);
      toast.error(error instanceof Error ? error.message : "Failed to copy item");
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.files() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.folders() });
      toast.success(`"${variables.itemName}" copied to your workspace`);
    },
  });
}
