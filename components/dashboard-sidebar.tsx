'use client'

import { useState } from 'react'
import { FileTree } from '@/components/file-tree'
import { RenameDialog } from '@/components/rename-dialog'
import { DeleteDialog } from '@/components/delete-dialog'
import { ShareDialog } from '@/components/share-dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderPlus, FilePlus, LogOut } from 'lucide-react'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { TreeItem, File, Folder } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useFiles,
  useCreateFile,
  useUpdateFile,
  useDeleteFile,
  useMoveFile,
} from '@/hooks/use-files'
import {
  useFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from '@/hooks/use-folders'

function buildTree(folders: Folder[], files: File[]): TreeItem[] {
  const folderMap = new Map<string, TreeItem>()
  const rootItems: TreeItem[] = []

  // Create folder items
  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      parent_id: folder.parent_id,
      children: [],
    })
  })

  // Add folders to their parents or root
  folders.forEach((folder) => {
    const item = folderMap.get(folder.id)!
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id)!.children!.push(item)
    } else {
      rootItems.push(item)
    }
  })

  // Add files to their folders or root
  files.forEach((file) => {
    const fileItem: TreeItem = {
      id: file.id,
      name: file.name,
      type: 'file',
      parent_id: file.folder_id,
      is_public: file.is_public,
      slug: file.slug,
    }
    if (file.folder_id && folderMap.has(file.folder_id)) {
      folderMap.get(file.folder_id)!.children!.push(fileItem)
    } else {
      rootItems.push(fileItem)
    }
  })

  // Sort items: folders first, then by name
  const sortItems = (items: TreeItem[]) => {
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    items.forEach((item) => {
      if (item.children) sortItems(item.children)
    })
  }
  sortItems(rootItems)

  return rootItems
}

interface DashboardSidebarProps {
  selectedFileId: string | null
  onFileSelect: (fileId: string) => void
}

export function DashboardSidebar({ selectedFileId, onFileSelect }: DashboardSidebarProps) {
  const router = useRouter()

  // TanStack Query hooks
  const { data: folders = [], isLoading: foldersLoading } = useFolders()
  const { data: files = [], isLoading: filesLoading } = useFiles()

  // Mutations
  const createFile = useCreateFile()
  const updateFile = useUpdateFile()
  const deleteFileMutation = useDeleteFile()
  const moveFile = useMoveFile()
  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const deleteFolderMutation = useDeleteFolder()

  const [renameItem, setRenameItem] = useState<TreeItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<TreeItem | null>(null)
  const [shareItem, setShareItem] = useState<TreeItem | null>(null)
  const [shareFile, setShareFile] = useState<File | null>(null)

  const isLoading = foldersLoading || filesLoading
  const treeItems = buildTree(folders, files)

  const handleCreateFile = async (folderId: string | null) => {
    const result = await createFile.mutateAsync({ folder_id: folderId })
    if (result) {
      onFileSelect(result.id)
    }
  }

  const handleCreateFolder = async (parentId: string | null) => {
    await createFolder.mutateAsync({ parent_id: parentId })
  }

  const handleRename = async (newName: string) => {
    if (!renameItem) return
    if (renameItem.type === 'folder') {
      await updateFolder.mutateAsync({ id: renameItem.id, data: { name: newName } })
    } else {
      await updateFile.mutateAsync({ id: renameItem.id, data: { name: newName } })
    }
    setRenameItem(null)
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    if (deleteItem.type === 'folder') {
      await deleteFolderMutation.mutateAsync(deleteItem.id)
    } else {
      await deleteFileMutation.mutateAsync(deleteItem.id)
      if (selectedFileId === deleteItem.id) {
        onFileSelect('')
      }
    }
    setDeleteItem(null)
  }

  const handleTogglePublic = (item: TreeItem) => {
    const file = files.find((f) => f.id === item.id)
    if (file) {
      setShareItem(item)
      setShareFile(file)
    }
  }

  const handleShareToggle = async (isPublic: boolean) => {
    if (!shareFile) return
    const result = await updateFile.mutateAsync({
      id: shareFile.id,
      data: { is_public: isPublic },
    })
    if (result) {
      setShareFile(result)
    }
  }

  const handleSelect = (item: TreeItem) => {
    if (item.type === 'file') {
      onFileSelect(item.id)
    }
  }

  // Drag and drop handler
  const handleDrop = async (draggedId: string, targetFolderId: string | null) => {
    // Check if it's a file being dropped
    const file = files.find((f) => f.id === draggedId)
    if (file) {
      await moveFile.mutateAsync({ id: draggedId, folderId: targetFolderId })
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/dashboard">
          <InkdownLogo size="sm" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-b p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => handleCreateFile(null)}
          disabled={createFile.isPending}
        >
          <FilePlus className="mr-1.5 h-4 w-4" />
          File
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => handleCreateFolder(null)}
          disabled={createFolder.isPending}
        >
          <FolderPlus className="mr-1.5 h-4 w-4" />
          Folder
        </Button>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div
          className="min-h-full p-2"
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add('bg-accent/50')
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-accent/50')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('bg-accent/50')
            const draggedId = e.dataTransfer.getData('text/plain')
            if (draggedId) {
              handleDrop(draggedId, null) // Drop to root
            }
          }}
        >
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          ) : treeItems.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No files yet. Create your first file!
            </div>
          ) : (
            <FileTree
              items={treeItems}
              selectedId={selectedFileId}
              onSelect={handleSelect}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onRename={setRenameItem}
              onDelete={setDeleteItem}
              onTogglePublic={handleTogglePublic}
              onDrop={handleDrop}
            />
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>

      {/* Dialogs */}
      {renameItem && (
        <RenameDialog
          open={!!renameItem}
          onOpenChange={(open) => !open && setRenameItem(null)}
          currentName={renameItem.name}
          type={renameItem.type}
          onRename={handleRename}
        />
      )}

      {deleteItem && (
        <DeleteDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          itemName={deleteItem.name}
          type={deleteItem.type}
          onConfirm={handleDelete}
        />
      )}

      {shareItem && shareFile && (
        <ShareDialog
          open={!!shareItem}
          onOpenChange={(open) => {
            if (!open) {
              setShareItem(null)
              setShareFile(null)
            }
          }}
          fileName={shareFile.name}
          isPublic={shareFile.is_public}
          slug={shareFile.slug}
          onTogglePublic={handleShareToggle}
        />
      )}
    </div>
  )
}
