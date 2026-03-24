'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { workspaceKeys } from '@/lib/query-keys'
import type { Folder } from '@/lib/types'
import { toast } from 'sonner'
import {
  MutationCallbacks,
  optimisticFolder,
  replaceFolder,
  syncFolder,
} from '@/hooks/workspace/workspace-cache'

interface CreateFolderInput {
  parentId: string | null
}

export function useCreateFolderMutation(options?: MutationCallbacks<Folder>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ parentId }: CreateFolderInput) =>
      fetchJson<Folder>('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId }),
      }),
    onMutate: async ({ parentId }) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.folders() })

      const previousFolders =
        queryClient.getQueryData<Folder[]>(workspaceKeys.folders()) ?? []
      const optimisticId = `temp-folder-${crypto.randomUUID()}`
      const nextFolder = optimisticFolder({ id: optimisticId, parentId })

      queryClient.setQueryData<Folder[]>(
        workspaceKeys.folders(),
        replaceFolder(previousFolders, nextFolder),
      )

      return { previousFolders, optimisticId }
    },
    onError: (error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(workspaceKeys.folders(), context.previousFolders)
      toast.error(error.message || 'Could not create folder')
    },
    onSuccess: (folder, _variables, context) => {
      syncFolder(queryClient, folder, context?.optimisticId)
      toast.success(`Created "${folder.name}"`)
      options?.onSuccess?.(folder)
    },
  })
}
