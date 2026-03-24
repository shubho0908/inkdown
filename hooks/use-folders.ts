'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Folder } from '@/lib/types'

const QUERY_KEY = ['folders']

async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch('/api/folders')
  if (!res.ok) throw new Error('Failed to fetch folders')
  return res.json()
}

async function createFolder(data: { parent_id?: string | null; name?: string }): Promise<Folder> {
  const res = await fetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create folder')
  return res.json()
}

async function updateFolder(
  id: string,
  data: Partial<Pick<Folder, 'name' | 'parent_id'>>
): Promise<Folder> {
  const res = await fetch(`/api/folders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update folder')
  return res.json()
}

async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete folder')
}

// Hook: Fetch all folders
export function useFolders() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFolders,
  })
}

// Hook: Create folder
export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFolder,
    onSuccess: (newFolder) => {
      queryClient.setQueryData<Folder[]>(QUERY_KEY, (old = []) => [...old, newFolder])
    },
  })
}

// Hook: Update folder with optimistic update
export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Folder, 'name' | 'parent_id'>> }) =>
      updateFolder(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })

      const previousFolders = queryClient.getQueryData<Folder[]>(QUERY_KEY)

      // Optimistically update
      queryClient.setQueryData<Folder[]>(QUERY_KEY, (old = []) =>
        old.map((f) => (f.id === id ? { ...f, ...data } : f))
      )

      return { previousFolders }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(QUERY_KEY, context.previousFolders)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

// Hook: Delete folder with optimistic update
export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFolder,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })

      const previousFolders = queryClient.getQueryData<Folder[]>(QUERY_KEY)

      // Optimistically remove folder
      queryClient.setQueryData<Folder[]>(QUERY_KEY, (old = []) =>
        old.filter((f) => f.id !== id)
      )

      return { previousFolders }
    },
    onError: (_err, _id, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(QUERY_KEY, context.previousFolders)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
