'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { workspaceKeys } from '@/lib/query-keys'
import type { File, Folder, TreeItem } from '@/lib/types'
import {
  cancelWorkspaceQueries,
  collectDescendantFolderIds,
  getWorkspaceSnapshot,
  replaceFile,
  replaceFolder,
  restoreWorkspaceSnapshot,
  syncFile,
  syncFolder,
  type MutationCallbacks,
  updateFileParent,
  updateFolderParent,
} from '@/hooks/workspace/workspace-cache'

interface RenameTreeItemInput {
  item: TreeItem
  newName: string
}

interface DeleteTreeItemInput {
  item: TreeItem
}

interface MoveTreeItemInput {
  item: TreeItem
  targetFolderId: string | null
}

export function useRenameTreeItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ item, newName }: RenameTreeItemInput) =>
      fetchJson<File | Folder>(
        `/api/${item.type === 'folder' ? 'folders' : 'files'}/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        },
      ),
    onMutate: async ({ item, newName }) => {
      await cancelWorkspaceQueries(queryClient, item.type === 'file' ? item.id : undefined)

      const snapshot = getWorkspaceSnapshot(queryClient)

      if (item.type === 'file') {
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          replaceFile(snapshot.files, {
            ...(snapshot.files.find((file) => file.id === item.id) as File),
            name: newName,
          }),
        )

        const previousFile = queryClient.getQueryData<File>(workspaceKeys.file(item.id))
        if (previousFile) {
          queryClient.setQueryData<File>(workspaceKeys.file(item.id), {
            ...previousFile,
            name: newName,
          })
        }
      } else {
        queryClient.setQueryData<Folder[]>(
          workspaceKeys.folders(),
          replaceFolder(snapshot.folders, {
            ...(snapshot.folders.find((folder) => folder.id === item.id) as Folder),
            name: newName,
          }),
        )
      }

      return snapshot
    },
    onError: (_error, variables, context) => {
      if (!context) return
      restoreWorkspaceSnapshot(queryClient, context)

      if (variables.item.type === 'file') {
        const previousFile = context.files.find((file) => file.id === variables.item.id)
        if (previousFile) {
          queryClient.setQueryData(workspaceKeys.file(variables.item.id), previousFile)
        }
      }
    },
    onSuccess: (result, variables) => {
      if (variables.item.type === 'file') {
        syncFile(queryClient, result as File)
        return
      }

      syncFolder(queryClient, result as Folder)
    },
  })
}

export function useDeleteTreeItemMutation(
  options?: MutationCallbacks<{ item: TreeItem }>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ item }: DeleteTreeItemInput) =>
      fetchJson<{ success: true }>(
        `/api/${item.type === 'folder' ? 'folders' : 'files'}/${item.id}`,
        { method: 'DELETE' },
      ),
    onMutate: async ({ item }) => {
      await cancelWorkspaceQueries(queryClient, item.type === 'file' ? item.id : undefined)

      const snapshot = getWorkspaceSnapshot(queryClient)

      if (item.type === 'file') {
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          snapshot.files.filter((file) => file.id !== item.id),
        )
        queryClient.removeQueries({ queryKey: workspaceKeys.file(item.id) })
      } else {
        const removedFolderIds = collectDescendantFolderIds(snapshot.folders, item.id)

        queryClient.setQueryData<Folder[]>(
          workspaceKeys.folders(),
          snapshot.folders.filter((folder) => !removedFolderIds.has(folder.id)),
        )
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          snapshot.files.filter(
            (file) => !file.folder_id || !removedFolderIds.has(file.folder_id),
          ),
        )
      }

      return snapshot
    },
    onError: (_error, variables, context) => {
      if (!context) return
      restoreWorkspaceSnapshot(queryClient, context)

      if (variables.item.type === 'file') {
        const previousFile = context.files.find((file) => file.id === variables.item.id)
        if (previousFile) {
          queryClient.setQueryData(workspaceKeys.file(variables.item.id), previousFile)
        }
      }
    },
    onSuccess: (_result, variables) => {
      options?.onSuccess?.({ item: variables.item })
    },
  })
}

export function useMoveTreeItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ item, targetFolderId }: MoveTreeItemInput) =>
      fetchJson<File | Folder>(
        `/api/${item.type === 'folder' ? 'folders' : 'files'}/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            item.type === 'folder'
              ? { parent_id: targetFolderId }
              : { folder_id: targetFolderId },
          ),
        },
      ),
    onMutate: async ({ item, targetFolderId }) => {
      await cancelWorkspaceQueries(queryClient, item.type === 'file' ? item.id : undefined)

      const snapshot = getWorkspaceSnapshot(queryClient)

      if (item.type === 'file') {
        queryClient.setQueryData<File[]>(
          workspaceKeys.files(),
          updateFileParent(snapshot.files, item.id, targetFolderId),
        )

        const previousFile = queryClient.getQueryData<File>(workspaceKeys.file(item.id))
        if (previousFile) {
          queryClient.setQueryData<File>(workspaceKeys.file(item.id), {
            ...previousFile,
            folder_id: targetFolderId,
            updated_at: new Date().toISOString(),
          })
        }
      } else {
        queryClient.setQueryData<Folder[]>(
          workspaceKeys.folders(),
          updateFolderParent(snapshot.folders, item.id, targetFolderId),
        )
      }

      return snapshot
    },
    onError: (_error, variables, context) => {
      if (!context) return
      restoreWorkspaceSnapshot(queryClient, context)

      if (variables.item.type === 'file') {
        const previousFile = context.files.find((file) => file.id === variables.item.id)
        if (previousFile) {
          queryClient.setQueryData(workspaceKeys.file(variables.item.id), previousFile)
        }
      }
    },
    onSuccess: (result, variables) => {
      if (variables.item.type === 'file') {
        syncFile(queryClient, result as File)
        return
      }

      syncFolder(queryClient, result as Folder)
    },
  })
}
