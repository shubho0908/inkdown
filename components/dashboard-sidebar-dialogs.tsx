"use client";

import { DeleteDialog } from "@/components/delete-dialog";
import { MoveItemDialog } from "@/components/move-item-dialog";
import { RenameDialog } from "@/components/rename-dialog";
import { ShareDialog } from "@/components/share-dialog";
import type { File, Folder, TreeItem } from "@/lib/validation/models";

interface DashboardSidebarDialogsProps {
  renameItem: TreeItem | null;
  deleteItem: TreeItem | null;
  moveItem: TreeItem | null;
  moveFolders: Folder[];
  isMoving: boolean;
  shareItem: TreeItem | null;
  shareFile: File | null;
  shareFolder: Folder | null;
  isShareTogglePending: boolean;
  onRenameItemChange: (item: TreeItem | null) => void;
  onDeleteItemChange: (item: TreeItem | null) => void;
  onMoveItemChange: (item: TreeItem | null) => void;
  onShareItemChange: (item: TreeItem | null) => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onMove: (targetFolderId: string | null) => void;
  onTogglePublic: (isPublic: boolean) => void;
}

export function DashboardSidebarDialogs({
  renameItem,
  deleteItem,
  moveItem,
  moveFolders,
  isMoving,
  shareItem,
  shareFile,
  shareFolder,
  isShareTogglePending,
  onRenameItemChange,
  onDeleteItemChange,
  onMoveItemChange,
  onShareItemChange,
  onRename,
  onDelete,
  onMove,
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

      {moveItem && (
        <MoveItemDialog
          open={!!moveItem}
          onOpenChange={(open) => !open && onMoveItemChange(null)}
          item={moveItem}
          folders={moveFolders}
          onMove={onMove}
          isPending={isMoving}
        />
      )}

      {shareItem && (shareFile || shareFolder) && (
        <ShareDialog
          open={!!shareItem}
          onOpenChange={(open) => {
            if (!open) {
              onShareItemChange(null);
            }
          }}
          itemName={shareFile?.name ?? shareFolder?.name ?? shareItem.name}
          itemType={shareItem.type}
          isPublic={shareFile?.is_public ?? shareFolder?.is_public ?? false}
          slug={shareFile?.slug ?? shareFolder?.slug ?? null}
          isPending={isShareTogglePending}
          onTogglePublic={onTogglePublic}
        />
      )}
    </>
  );
}
