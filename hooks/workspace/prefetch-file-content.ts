"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { fetchJson } from "@/lib/api";
import { WORKSPACE_FILE_STALE_TIME } from "@/lib/query-defaults";
import { workspaceKeys } from "@/lib/query-keys";
import { fileSchema } from "@/lib/validation/responses";

function fileContentQueryOptions(fileId: string) {
  return {
    queryKey: workspaceKeys.file(fileId),
    queryFn: () => fetchJson(`/api/files/${fileId}`, fileSchema),
    staleTime: WORKSPACE_FILE_STALE_TIME,
  } as const;
}

export function usePrefetchFileContent() {
  const queryClient = useQueryClient();

  return useCallback(
    (fileId: string) => {
      void queryClient.prefetchQuery(fileContentQueryOptions(fileId));
    },
    [queryClient],
  );
}

export async function fetchCachedFileContent(queryClient: QueryClient, fileId: string) {
  return queryClient.fetchQuery(fileContentQueryOptions(fileId));
}
