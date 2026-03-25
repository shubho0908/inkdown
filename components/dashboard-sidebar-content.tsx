'use client'

import Link from 'next/link'
import { FilePlus, FolderPlus, LogOut, X } from 'lucide-react'
import { FileTree } from '@/components/file-tree'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { TreeItem } from '@/lib/types'

interface DashboardSidebarContentProps {
  isLoading: boolean
  treeItems: TreeItem[]
  selectedFileId: string | null
  filesCount: number
  showCloseAction?: boolean
  onClose?: () => void
  onCreateFile: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onSelect: (item: TreeItem) => void
  onMove: (item: TreeItem, targetFolderId: string | null) => void
  onRename: (item: TreeItem) => void
  onDelete: (item: TreeItem) => void
  onTogglePublic: (item: TreeItem) => void
  onSignOut: () => void
}

export function DashboardSidebarContent({
  isLoading,
  treeItems,
  selectedFileId,
  filesCount,
  showCloseAction = false,
  onClose,
  onCreateFile,
  onCreateFolder,
  onSelect,
  onMove,
  onRename,
  onDelete,
  onTogglePublic,
  onSignOut,
}: DashboardSidebarContentProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-sidebar">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/">
          <InkdownLogo size="md" />
        </Link>
        <div className="flex items-center gap-1">
          {showCloseAction && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close workspace"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>

      <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full justify-center rounded-lg"
          onClick={() => onCreateFile(null)}
        >
          <FilePlus className="mr-1.5 h-4 w-4" />
          File
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full justify-center rounded-lg"
          onClick={() => onCreateFolder(null)}
        >
          <FolderPlus className="mr-1.5 h-4 w-4" />
          Folder
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="space-y-3 px-3 py-4">
          {isLoading ? (
            <div className="space-y-2 px-1">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-[86%] rounded-xl" />
              <Skeleton className="h-10 w-[72%] rounded-xl" />
            </div>
          ) : treeItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No files yet. Create your first file!
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Workspace
                </p>
                <p className="text-xs text-muted-foreground">
                  {filesCount} {filesCount === 1 ? 'file' : 'files'}
                </p>
              </div>
              <FileTree
                items={treeItems}
                selectedId={selectedFileId}
                onSelect={onSelect}
                onMove={onMove}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onRename={onRename}
                onDelete={onDelete}
                onTogglePublic={onTogglePublic}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-start rounded-lg text-muted-foreground"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
