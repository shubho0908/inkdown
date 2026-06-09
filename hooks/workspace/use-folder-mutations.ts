"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { workspaceKeys } from "@/lib/query-keys";
import type { Folder } from "@/lib/validation/models";
import { folderSchema } from "@/lib/validation/responses";
import { toast } from "sonner";
import {
  cancelWorkspaceQueries,
  MutationCallbacks,
  optimisticFolder,
  replaceFolder,
  syncFolder,
} from "@/hooks/workspace/workspace-cache";

interface CreateFolderInput {
  parentId: string | null;
}

interface ToggleFolderPublicInput {
  folder: Folder;
  isPublic: boolean;
}

export function useCreateFolderMutation(options?: MutationCallbacks<Folder>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId }: CreateFolderInput) =>
      fetchJson("/api/folders", folderSchema, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: parentId }),
      }),
    onMutate: async ({ parentId }) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.folders() });

      const previousFolders = queryClient.getQueryData<Folder[]>(workspaceKeys.folders()) ?? [];
      const optimisticId = `temp-folder-${crypto.randomUUID()}`;
      const nextFolder = optimisticFolder({ id: optimisticId, parentId });

      queryClient.setQueryData<Folder[]>(
        workspaceKeys.folders(),
        replaceFolder(previousFolders, nextFolder),
      );

      return { previousFolders, optimisticId };
    },
    onError: (error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(workspaceKeys.folders(), context.previousFolders);
      toast.error(error.message || "Could not create folder");
    },
    onSuccess: (folder, _variables, context) => {
      syncFolder(queryClient, folder, context?.optimisticId);
      toast.success(`Created "${folder.name}"`);
      options?.onSuccess?.(folder);
    },
  });
}

export function useToggleFolderPublicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folder, isPublic }: ToggleFolderPublicInput) =>
      fetchJson(`/api/folders/${folder.id}`, folderSchema, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: isPublic }),
      }),
    onMutate: async ({ folder, isPublic }) => {
      await cancelWorkspaceQueries(queryClient);

      const previousFolders = queryClient.getQueryData<Folder[]>(workspaceKeys.folders()) ?? [];
      const optimistic = { ...folder, is_public: isPublic };

      queryClient.setQueryData<Folder[]>(
        workspaceKeys.folders(),
        replaceFolder(previousFolders, optimistic),
      );

      return { previousFolders };
    },
    onError: (error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(workspaceKeys.folders(), context.previousFolders);
      toast.error(error.message || "Could not update folder sharing settings");
    },
    onSuccess: (folder) => {
      syncFolder(queryClient, folder);
      toast.success(
        folder.is_public ? `"${folder.name}" is now public` : `"${folder.name}" is now private`,
      );
    },
  });
}
