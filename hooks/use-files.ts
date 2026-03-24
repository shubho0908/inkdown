'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { File } from '@/lib/types'

const QUERY_KEY = ['files']

async function fetchFiles(): Promise<File[]> {
  const res = await fetch('/api/files')
  if (!res.ok) throw new Error('Failed to fetch files')
  return res.json()
}

async function fetchFile(id: string): Promise<File> {
  const res = await fetch(`/api/files/${id}`)
  if (!res.ok) throw new Error('Failed to fetch file')
  return res.json()
}

async function createFile(data: { folder_id?: string | null; name?: string }): Promise<File> {
  const res = await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create file')
  return res.json()
}

async function updateFile(
  id: string,
  data: Partial<Pick<File, 'name' | 'content' | 'folder_id' | 'is_public'>>
): Promise<File> {
  const res = await fetch(`/api/files/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update file')
  return res.json()
}

async function deleteFile(id: string): Promise<void> {
  const res = await fetch(`/api/files/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete file')
}

// Hook: Fetch all files
export function useFiles() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFiles,
  })
}

// Hook: Fetch single file
export function useFile(id: string | null) {
  return useQuery({
    queryKey: ['file', id],
    queryFn: () => fetchFile(id!),
    enabled: !!id,
  })
}

// Hook: Create file
export function useCreateFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFile,
    onSuccess: (newFile) => {
      queryClient.setQueryData<File[]>(QUERY_KEY, (old = []) => [...old, newFile])
    },
  })
}

// Hook: Update file with optimistic update
export function useUpdateFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<File, 'name' | 'content' | 'folder_id' | 'is_public'>> }) =>
      updateFile(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      await queryClient.cancelQueries({ queryKey: ['file', id] })

      // Snapshot previous values
      const previousFiles = queryClient.getQueryData<File[]>(QUERY_KEY)
      const previousFile = queryClient.getQueryData<File>(['file', id])

      // Optimistically update the files list
      if (previousFiles) {
        queryClient.setQueryData<File[]>(QUERY_KEY, (old = []) =>
          old.map((f) => (f.id === id ? { ...f, ...data } : f))
        )
      }

      // Optimistically update the single file
      if (previousFile) {
        queryClient.setQueryData<File>(['file', id], { ...previousFile, ...data })
      }

      return { previousFiles, previousFile }
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousFiles) {
        queryClient.setQueryData(QUERY_KEY, context.previousFiles)
      }
      if (context?.previousFile) {
        queryClient.setQueryData(['file', id], context.previousFile)
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['file', id] })
    },
  })
}

// Hook: Delete file with optimistic update
export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFile,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })

      const previousFiles = queryClient.getQueryData<File[]>(QUERY_KEY)

      // Optimistically remove file
      queryClient.setQueryData<File[]>(QUERY_KEY, (old = []) =>
        old.filter((f) => f.id !== id)
      )

      return { previousFiles }
    },
    onError: (_err, _id, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(QUERY_KEY, context.previousFiles)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

// Hook: Move file to folder with optimistic update
export function useMoveFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      updateFile(id, { folder_id: folderId }),
    onMutate: async ({ id, folderId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })

      const previousFiles = queryClient.getQueryData<File[]>(QUERY_KEY)

      // Optimistically move file
      queryClient.setQueryData<File[]>(QUERY_KEY, (old = []) =>
        old.map((f) => (f.id === id ? { ...f, folder_id: folderId } : f))
      )

      return { previousFiles }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(QUERY_KEY, context.previousFiles)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
