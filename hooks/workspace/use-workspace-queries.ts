'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import {
  QUERY_GC_TIME,
  WORKSPACE_COLLECTION_STALE_TIME,
  WORKSPACE_FILE_STALE_TIME,
} from '@/lib/query-defaults'
import { workspaceKeys } from '@/lib/query-keys'
import type { File, Folder } from '@/lib/types'

export function useFilesQuery() {
  return useQuery({
    queryKey: workspaceKeys.files(),
    queryFn: () => fetchJson<File[]>('/api/files'),
    staleTime: WORKSPACE_COLLECTION_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export function useFoldersQuery() {
  return useQuery({
    queryKey: workspaceKeys.folders(),
    queryFn: () => fetchJson<Folder[]>('/api/folders'),
    staleTime: WORKSPACE_COLLECTION_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export function useFileQuery(fileId: string | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: workspaceKeys.file(fileId ?? 'missing'),
    queryFn: () => fetchJson<File>(`/api/files/${fileId}`),
    enabled: Boolean(fileId),
    staleTime: WORKSPACE_FILE_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnMount: false,
    refetchOnReconnect: false,
    initialData: () => {
      if (!fileId) {
        return undefined
      }

      const files = queryClient.getQueryData<File[]>(workspaceKeys.files()) ?? []
      return files.find((file) => file.id === fileId)
    },
    initialDataUpdatedAt: () => {
      if (!fileId) {
        return undefined
      }

      return queryClient.getQueryState<File[]>(workspaceKeys.files())?.dataUpdatedAt
    },
  })
}
