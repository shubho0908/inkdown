'use client'

import { DeleteDialog } from '@/components/delete-dialog'
import { RenameDialog } from '@/components/rename-dialog'
import { ShareDialog } from '@/components/share-dialog'
import type { File, TreeItem } from '@/lib/types'

interface DashboardSidebarDialogsProps {
  renameItem: TreeItem | null
  deleteItem: TreeItem | null
  shareItem: TreeItem | null
  shareFile: File | null
  onRenameItemChange: (item: TreeItem | null) => void
  onDeleteItemChange: (item: TreeItem | null) => void
  onShareStateChange: (item: TreeItem | null, file: File | null) => void
  onRename: (newName: string) => void
  onDelete: () => void
  onTogglePublic: (isPublic: boolean) => void
}

export function DashboardSidebarDialogs({
  renameItem,
  deleteItem,
  shareItem,
  shareFile,
  onRenameItemChange,
  onDeleteItemChange,
  onShareStateChange,
  onRename,
  onDelete,
  onTogglePublic,
}: DashboardSidebarDialogsProps) {
  return (
    <>
      {renameItem && (
        <RenameDialog
          open={!!renameItem}
          onOpenChange={(open) => !open && onRenameItemChange(null)}
          currentName={renameItem.name}
          type={renameItem.type}
          onRename={onRename}
        />
      )}

      {deleteItem && (
        <DeleteDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && onDeleteItemChange(null)}
          itemName={deleteItem.name}
          type={deleteItem.type}
          onConfirm={onDelete}
        />
      )}

      {shareItem && shareFile && (
        <ShareDialog
          open={!!shareItem}
          onOpenChange={(open) => {
            if (!open) {
              onShareStateChange(null, null)
            }
          }}
          fileName={shareFile.name}
          isPublic={shareFile.is_public}
          slug={shareFile.slug}
          onTogglePublic={onTogglePublic}
        />
      )}
    </>
  )
}
