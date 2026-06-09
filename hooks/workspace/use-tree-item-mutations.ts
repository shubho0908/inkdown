"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { canMoveTreeItem, collectDescendantFolderIds } from "@/lib/folder-tree";
import { fetchJson } from "@/lib/api";
import { workspaceKeys } from "@/lib/query-keys";
import { isFile } from "@/lib/type-guards";
import type { File, Folder, TreeItem } from "@/lib/validation/models";
import { fileSchema, folderSchema, successResponseSchema } from "@/lib/validation/responses";
import { toast } from "sonner";
import {
  cancelWorkspaceQueries,
  getWorkspaceSnapshot,
  replaceFile,
  replaceFolder,
  restoreWorkspaceSnapshot,
  syncFile,
  syncFolder,
  type MutationCallbacks,
  updateFileParent,
  updateFolderParent,
} from "@/hooks/workspace/workspace-cache";

interface RenameTreeItemInput {
  item: TreeItem;
  newName: string;
}

interface DeleteTreeItemInput {
  item: TreeItem;
}

interface MoveTreeItemInput {
  item: TreeItem;
  targetFolderId: string | null;
}

interface MoveTreeItemContext {
  snapshot: ReturnType<typeof getWorkspaceSnapshot>;
  skipped: boolean;
}

function getItemLabel(item: TreeItem) {
  return item.type === "folder" ? "folder" : "file";
}

function getCurrentTreeItemForMove(
  snapshot: ReturnType<typeof getWorkspaceSnapshot>,
  item: TreeItem,
): Pick<TreeItem, "id" | "type" | "parent_id"> {
  if (item.type === "file") {
    const file = snapshot.files.find((candidate) => candidate.id === item.id);

    return file
      ? {
          id: file.id,
          type: "file",
          parent_id: file.folder_id,
        }
      : item;
  }

  const folder = snapshot.folders.find((candidate) => candidate.id === item.id);

  return folder
    ? {
        id: folder.id,
        type: "folder",
        parent_id: folder.parent_id,
      }
    : item;
}

async function renameTreeItem(item: TreeItem, newName: string) {
  if (item.type === "folder") {
    return fetchJson(`/api/folders/${item.id}`, folderSchema, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
  }

  return fetchJson(`/api/files/${item.id}`, fileSchema, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
}

async function moveTreeItem(item: TreeItem, targetFolderId: string | null) {
  if (item.type === "folder") {
    return fetchJson(`/api/folders/${item.id}`, folderSchema, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parent_id: targetFolderId }),
    });
  }

  return fetchJson(`/api/files/${item.id}`, fileSchema, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: targetFolderId }),
  });
}

export function useRenameTreeItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item, newName }: RenameTreeItemInput) => renameTreeItem(item, newName),
    onMutate: async ({ item, newName }) => {
      await cancelWorkspaceQueries(queryClient, item.type === "file" ? item.id : undefined);

      const snapshot = getWorkspaceSnapshot(queryClient);

      if (item.type === "file") {
        const file = snapshot.files.find((candidate) => candidate.id === item.id);
        if (!file) {
          return snapshot;
        }

        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          replaceFile(snapshot.files, {
            ...file,
            name: newName,
          }),
        );

        const previousFile = queryClient.getQueryData<File>(workspaceKeys.file(item.id));
        if (previousFile) {
          queryClient.setQueryData<File>(workspaceKeys.file(item.id), {
            ...previousFile,
            name: newName,
          });
        }
      } else {
        const folder = snapshot.folders.find((candidate) => candidate.id === item.id);
        if (!folder) {
          return snapshot;
        }

        queryClient.setQueryData<Folder[]>(
          workspaceKeys.folders(),
          replaceFolder(snapshot.folders, {
            ...folder,
            name: newName,
          }),
        );
      }

      return snapshot;
    },
    onError: (error, variables, context) => {
      if (!context) return;
      restoreWorkspaceSnapshot(queryClient, context);

      if (variables.item.type === "file") {
        const previousFile = context.files.find((file) => file.id === variables.item.id);
        if (previousFile) {
          queryClient.setQueryData(workspaceKeys.file(variables.item.id), previousFile);
        }
      }
      toast.error(error.message || `Could not rename ${getItemLabel(variables.item)}`);
    },
    onSuccess: (result) => {
      if (isFile(result)) {
        syncFile(queryClient, result);
      } else {
        syncFolder(queryClient, result);
      }
      toast.success(`Renamed "${result.name}"`);
    },
  });
}

export function useDeleteTreeItemMutation(options?: MutationCallbacks<{ item: TreeItem }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item }: DeleteTreeItemInput) =>
      fetchJson(
        `/api/${item.type === "folder" ? "folders" : "files"}/${item.id}`,
        successResponseSchema,
        { method: "DELETE" },
      ),
    onMutate: async ({ item }) => {
      await cancelWorkspaceQueries(queryClient, item.type === "file" ? item.id : undefined);

      const snapshot = getWorkspaceSnapshot(queryClient);

      if (item.type === "file") {
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          snapshot.files.filter((file) => file.id !== item.id),
        );
        queryClient.removeQueries({ queryKey: workspaceKeys.file(item.id) });
      } else {
        const removedFolderIds = collectDescendantFolderIds(snapshot.folders, item.id);

        queryClient.setQueryData<Folder[]>(
          workspaceKeys.folders(),
          snapshot.folders.filter((folder) => !removedFolderIds.has(folder.id)),
        );
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          snapshot.files.filter((file) => !file.folder_id || !removedFolderIds.has(file.folder_id)),
        );
      }

      return snapshot;
    },
    onError: (error, variables, context) => {
      if (!context) return;
      restoreWorkspaceSnapshot(queryClient, context);

      if (variables.item.type === "file") {
        const previousFile = context.files.find((file) => file.id === variables.item.id);
        if (previousFile) {
          queryClient.setQueryData(workspaceKeys.file(variables.item.id), previousFile);
        }
      }
      toast.error(error.message || `Could not delete ${getItemLabel(variables.item)}`);
    },
    onSuccess: (_result, variables) => {
      toast.success(`Deleted "${variables.item.name}"`);
      options?.onSuccess?.({ item: variables.item });
    },
  });
}

export function useMoveTreeItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item, targetFolderId }: MoveTreeItemInput) => moveTreeItem(item, targetFolderId),
    onMutate: async ({ item, targetFolderId }) => {
      await cancelWorkspaceQueries(queryClient, item.type === "file" ? item.id : undefined);

      const snapshot = getWorkspaceSnapshot(queryClient);
      const currentItem = getCurrentTreeItemForMove(snapshot, item);
      const canMove = canMoveTreeItem(snapshot.folders, currentItem, targetFolderId);

      if (!canMove) {
        const context: MoveTreeItemContext = { snapshot, skipped: true };
        return context;
      }

      if (item.type === "file") {
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          updateFileParent(snapshot.files, item.id, targetFolderId),
        );

        const previousFile = queryClient.getQueryData<File>(workspaceKeys.file(item.id));
        if (previousFile) {
          queryClient.setQueryData<File>(workspaceKeys.file(item.id), {
            ...previousFile,
            folder_id: targetFolderId,
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        queryClient.setQueryData<Folder[]>(
          workspaceKeys.folders(),
          updateFolderParent(snapshot.folders, item.id, targetFolderId),
        );
      }

      const context: MoveTreeItemContext = { snapshot, skipped: false };
      return context;
    },
    onError: (error, variables, context) => {
      if (!context) return;
      restoreWorkspaceSnapshot(queryClient, context.snapshot);

      if (variables.item.type === "file") {
        const previousFile = context.snapshot.files.find((file) => file.id === variables.item.id);
        if (previousFile) {
          queryClient.setQueryData(workspaceKeys.file(variables.item.id), previousFile);
        }
      }
      toast.error(error.message || `Could not move ${getItemLabel(variables.item)}`);
    },
    onSuccess: (result, variables, context) => {
      if (context?.skipped) {
        return;
      }

      if (isFile(result)) {
        syncFile(queryClient, result);
        return;
      }

      syncFolder(queryClient, result);
    },
  });
}
