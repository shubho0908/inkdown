'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { workspaceKeys } from '@/lib/query-keys'
import type { File } from '@/lib/types'
import { toast } from 'sonner'
import {
  cancelWorkspaceQueries,
  MutationCallbacks,
  optimisticFile,
  replaceFile,
  syncFile,
} from '@/hooks/workspace/workspace-cache'

interface CreateFileInput {
  folderId: string | null
}

interface ToggleFilePublicInput {
  file: File
  isPublic: boolean
}

interface UpdateFileInput {
  fileId: string
  data: Partial<Pick<File, 'name' | 'content' | 'folder_id' | 'is_public' | 'slug'>>
}

export function useCreateFileMutation(options?: MutationCallbacks<File>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId }: CreateFileInput) =>
      fetchJson<File>('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId }),
      }),
    onMutate: async ({ folderId }) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.files() })

      const previousFiles = queryClient.getQueryData<File[]>(workspaceKeys.files()) ?? []
      const optimisticId = `temp-file-${crypto.randomUUID()}`
      const nextFile = optimisticFile({ id: optimisticId, folderId })

      queryClient.setQueryData<File[]>(
        workspaceKeys.files(),
        replaceFile(previousFiles, nextFile),
      )

      return { previousFiles, optimisticId }
    },
    onError: (error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(workspaceKeys.files(), context.previousFiles)
      queryClient.removeQueries({ queryKey: workspaceKeys.file(context.optimisticId) })
      toast.error(error.message || 'Could not create file')
    },
    onSuccess: (file, _variables, context) => {
      syncFile(queryClient, file, context?.optimisticId)
      if (context?.optimisticId) {
        queryClient.removeQueries({ queryKey: workspaceKeys.file(context.optimisticId) })
      }
      toast.success(`Created "${file.name}"`)
      options?.onSuccess?.(file)
    },
  })
}

export function useToggleFilePublicMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, isPublic }: ToggleFilePublicInput) =>
      fetchJson<File>(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: isPublic }),
      }),
    onMutate: async ({ file, isPublic }) => {
      await cancelWorkspaceQueries(queryClient, file.id)

      const previousFiles = queryClient.getQueryData<File[]>(workspaceKeys.files()) ?? []
      const previousFile = queryClient.getQueryData<File>(workspaceKeys.file(file.id))
      const optimistic = { ...file, is_public: isPublic }

      queryClient.setQueryData<File[]>(
        workspaceKeys.files(),
        replaceFile(previousFiles, optimistic),
      )
      queryClient.setQueryData<File>(workspaceKeys.file(file.id), optimistic)

      return { previousFiles, previousFile }
    },
    onError: (error, variables, context) => {
      if (!context) return
      queryClient.setQueryData(workspaceKeys.files(), context.previousFiles)
      if (context.previousFile) {
        queryClient.setQueryData(workspaceKeys.file(variables.file.id), context.previousFile)
      }
      toast.error(error.message || 'Could not update sharing settings')
    },
    onSuccess: (file) => {
      syncFile(queryClient, file)
      toast.success(
        file.is_public
          ? `"${file.name}" is now public`
          : `"${file.name}" is now private`,
      )
    },
  })
}

export function useUpdateFileMutation(options?: MutationCallbacks<File>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, data }: UpdateFileInput) =>
      fetchJson<File>(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async ({ fileId, data }) => {
      await cancelWorkspaceQueries(queryClient, fileId)

      const previousFiles = queryClient.getQueryData<File[]>(workspaceKeys.files()) ?? []
      const previousFile = queryClient.getQueryData<File>(workspaceKeys.file(fileId))

      if (previousFile) {
        const optimisticFileState: File = {
          ...previousFile,
          ...data,
          updated_at: new Date().toISOString(),
        }

        queryClient.setQueryData<File>(workspaceKeys.file(fileId), optimisticFileState)
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          replaceFile(previousFiles, optimisticFileState),
        )
      }

      return { previousFiles, previousFile }
    },
    onError: (_error, variables, context) => {
      if (!context) return
      queryClient.setQueryData(workspaceKeys.files(), context.previousFiles)
      if (context.previousFile) {
        queryClient.setQueryData(workspaceKeys.file(variables.fileId), context.previousFile)
      }
    },
    onSuccess: (file) => {
      syncFile(queryClient, file)
      options?.onSuccess?.(file)
    },
  })
}
