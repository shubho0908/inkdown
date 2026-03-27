'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, fetchJson } from '@/lib/api'
import { workspaceKeys } from '@/lib/query-keys'
import type { File } from '@/lib/types'
import { toast } from 'sonner'
import {
  cancelWorkspaceQueries,
  type MutationCallbacks,
  optimisticFile,
  replaceFile,
  syncFile,
} from '@/hooks/workspace/workspace-cache'
import {
  MARKDOWN_IMPORT_MAX_FILE_BYTES,
  MARKDOWN_IMPORT_READ_CONCURRENCY,
  formatMarkdownImportSkipMessage,
  isMarkdownFileName,
  normalizeMarkdownImportFileName,
  splitMarkdownImportSelection,
  validateMarkdownImportSelection,
} from '@/lib/markdown-import'

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

interface ImportMarkdownFilesInput {
  files: globalThis.File[]
  folderId: string | null
}

interface ImportMarkdownFilesResult {
  files: File[]
  skippedMessage: string | null
}

interface ImportMarkdownFilesCallbacks {
  onSuccess?: (files: File[]) => void
}

function getMarkdownImportLoadingMessage(files: globalThis.File[]) {
  const acceptedFiles = files.filter(
    (file) =>
      isMarkdownFileName(file.name) && file.size <= MARKDOWN_IMPORT_MAX_FILE_BYTES,
  )

  if (acceptedFiles.length === 1) {
    return `"${acceptedFiles[0].name}" is being uploaded`
  }

  if (acceptedFiles.length > 1) {
    return `${acceptedFiles.length} files are being uploaded`
  }

  if (files.length === 1) {
    return `"${files[0].name}" is being uploaded`
  }

  return `${files.length} files are being uploaded`
}

async function mapWithConcurrency<TInput, TResult>(
  items: TInput[],
  concurrency: number,
  worker: (item: TInput) => Promise<TResult>,
) {
  const results = new Array<TResult>(items.length)
  let nextIndex = 0

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(concurrency, items.length)) },
      runWorker,
    ),
  )

  return results
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

export function useImportMarkdownFilesMutation(options?: ImportMarkdownFilesCallbacks) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      files,
      folderId,
    }: ImportMarkdownFilesInput): Promise<ImportMarkdownFilesResult> => {
      const selection = splitMarkdownImportSelection(
        files.map((file) => ({ name: file.name, size: file.size })),
      )
      const validationError = validateMarkdownImportSelection(selection)

      if (validationError) {
        throw new ApiError(validationError, 400)
      }

      const acceptedFiles = files.filter((file) =>
        isMarkdownFileName(file.name) && file.size <= MARKDOWN_IMPORT_MAX_FILE_BYTES,
      )

      const payloadFiles = await mapWithConcurrency(
        acceptedFiles,
        MARKDOWN_IMPORT_READ_CONCURRENCY,
        async (file) => ({
          name: normalizeMarkdownImportFileName(file.name),
          content: await file.text(),
        }),
      )

      const createdFiles = await fetchJson<File[]>('/api/files/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_id: folderId,
          files: payloadFiles,
        }),
      })

      return {
        files: createdFiles,
        skippedMessage: formatMarkdownImportSkipMessage(selection.rejected),
      }
    },
    onMutate: ({ files }) => {
      const uploadToastId = toast.loading(getMarkdownImportLoadingMessage(files))
      return { uploadToastId }
    },
    onSuccess: ({ files, skippedMessage }, _variables, context) => {
      files.forEach((file) => syncFile(queryClient, file))

      const successMessage =
        files.length === 1
          ? `Imported "${files[0].name}"`
          : `Imported ${files.length} markdown files`

      toast.success(
        skippedMessage ? `${successMessage}. ${skippedMessage}` : successMessage,
        { id: context?.uploadToastId },
      )

      options?.onSuccess?.(files)
    },
    onError: (error, _variables, context) => {
      toast.error(error.message || 'Could not import markdown files', {
        id: context?.uploadToastId,
      })
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
