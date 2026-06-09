"use client";

import type { QueryClient } from "@tanstack/react-query";
import { workspaceKeys } from "@/lib/query-keys";
import type { File, Folder } from "@/lib/validation/models";

export interface MutationCallbacks<TData> {
  onSuccess?: (data: TData) => void;
}

export interface WorkspaceSnapshot {
  files: File[];
  folders: Folder[];
}

function sortByName<T extends { name: string }>(items: T[]) {
  return items.toSorted((a, b) => a.name.localeCompare(b.name));
}

export function replaceFile(files: File[], updatedFile: File, optimisticId?: string) {
  const withoutPrevious = files.filter(
    (file) => file.id !== updatedFile.id && file.id !== optimisticId,
  );

  return sortByName([...withoutPrevious, updatedFile]);
}

export function replaceFolder(folders: Folder[], updatedFolder: Folder, optimisticId?: string) {
  const withoutPrevious = folders.filter(
    (folder) => folder.id !== updatedFolder.id && folder.id !== optimisticId,
  );

  return sortByName([...withoutPrevious, updatedFolder]);
}

export function optimisticFile(input: {
  id: string;
  folderId: string | null;
  name?: string;
  content?: string;
}): File {
  const now = new Date().toISOString();

  return {
    id: input.id,
    user_id: "optimistic",
    folder_id: input.folderId,
    name: input.name || "Untitled.md",
    content: input.content || "# New Document\n\nStart writing here...",
    slug: null,
    is_public: false,
    content_size: 0,
    created_at: now,
    updated_at: now,
  };
}

export function optimisticFolder(input: {
  id: string;
  parentId: string | null;
  name?: string;
}): Folder {
  const now = new Date().toISOString();

  return {
    id: input.id,
    user_id: "optimistic",
    parent_id: input.parentId,
    name: input.name || "New Folder",
    slug: null,
    is_public: false,
    created_at: now,
    updated_at: now,
  };
}

export function updateFileParent(files: File[], fileId: string, folderId: string | null) {
  return sortByName(
    files.map((file) =>
      file.id === fileId
        ? { ...file, folder_id: folderId, updated_at: new Date().toISOString() }
        : file,
    ),
  );
}

export function updateFolderParent(folders: Folder[], folderId: string, parentId: string | null) {
  return sortByName(
    folders.map((folder) =>
      folder.id === folderId
        ? { ...folder, parent_id: parentId, updated_at: new Date().toISOString() }
        : folder,
    ),
  );
}

export function getWorkspaceSnapshot(queryClient: QueryClient): WorkspaceSnapshot {
  return {
    files: queryClient.getQueryData<File[]>(workspaceKeys.files()) ?? [],
    folders: queryClient.getQueryData<Folder[]>(workspaceKeys.folders()) ?? [],
  };
}

export function restoreWorkspaceSnapshot(queryClient: QueryClient, snapshot: WorkspaceSnapshot) {
  queryClient.setQueryData(workspaceKeys.files(), snapshot.files);
  queryClient.setQueryData(workspaceKeys.folders(), snapshot.folders);
}

export async function cancelWorkspaceQueries(queryClient: QueryClient, fileId?: string) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: workspaceKeys.files() }),
    queryClient.cancelQueries({ queryKey: workspaceKeys.folders() }),
    ...(fileId ? [queryClient.cancelQueries({ queryKey: workspaceKeys.file(fileId) })] : []),
  ]);
}

export function syncFile(queryClient: QueryClient, file: File, optimisticId?: string) {
  const currentFiles = queryClient.getQueryData<File[]>(workspaceKeys.files()) ?? [];
  queryClient.setQueryData<File[]>(
    workspaceKeys.files(),
    replaceFile(currentFiles, file, optimisticId),
  );
  queryClient.setQueryData(workspaceKeys.file(file.id), file);
}

export function syncFolder(queryClient: QueryClient, folder: Folder, optimisticId?: string) {
  const currentFolders = queryClient.getQueryData<Folder[]>(workspaceKeys.folders()) ?? [];
  queryClient.setQueryData<Folder[]>(
    workspaceKeys.folders(),
    replaceFolder(currentFolders, folder, optimisticId),
  );
}
