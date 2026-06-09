"use client";

import { HydrationBoundary, dehydrate, QueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { QUERY_GC_TIME, WORKSPACE_COLLECTION_STALE_TIME } from "@/lib/query-defaults";
import { workspaceKeys } from "@/lib/query-keys";
import type { FileMetadata, Folder } from "@/lib/validation/models";

interface WorkspaceHydrationBoundaryProps {
  files: FileMetadata[];
  folders: Folder[];
  children: ReactNode;
}

export function WorkspaceHydrationBoundary({
  files,
  folders,
  children,
}: WorkspaceHydrationBoundaryProps) {
  const [dehydratedState] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: WORKSPACE_COLLECTION_STALE_TIME,
          gcTime: QUERY_GC_TIME,
        },
      },
    });

    queryClient.setQueryData(workspaceKeys.files(), files);
    queryClient.setQueryData(workspaceKeys.folders(), folders);

    return dehydrate(queryClient);
  });

  return <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>;
}
