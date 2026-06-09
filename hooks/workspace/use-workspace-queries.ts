"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import {
  QUERY_GC_TIME,
  WORKSPACE_COLLECTION_STALE_TIME,
  WORKSPACE_FILE_STALE_TIME,
} from "@/lib/query-defaults";
import { workspaceKeys } from "@/lib/query-keys";
import type { FileMetadata } from "@/lib/validation/models";
import { fileListSchema, fileSchema, folderListSchema } from "@/lib/validation/responses";

export function useFilesQuery() {
  return useQuery({
    queryKey: workspaceKeys.files(),
    queryFn: () => fetchJson("/api/files", fileListSchema),
    staleTime: WORKSPACE_COLLECTION_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useFoldersQuery() {
  return useQuery({
    queryKey: workspaceKeys.folders(),
    queryFn: () => fetchJson("/api/folders", folderListSchema),
    staleTime: WORKSPACE_COLLECTION_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useFileQuery(fileId: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: workspaceKeys.file(fileId ?? "missing"),
    queryFn: () => fetchJson(`/api/files/${fileId}`, fileSchema),
    enabled: Boolean(fileId),
    staleTime: WORKSPACE_FILE_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    // Metadata from the file list is shown immediately, but content must always
    // be fetched from /api/files/:id (R2-backed). initialData would skip that fetch.
    placeholderData: () => {
      if (!fileId) {
        return undefined;
      }

      const files = queryClient.getQueryData<FileMetadata[]>(workspaceKeys.files()) ?? [];
      return files.find((file) => file.id === fileId);
    },
  });
}
