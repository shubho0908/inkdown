"use client";

import { DeleteDialog } from "@/components/delete-dialog";
import { MoveItemDialog } from "@/components/move-item-dialog";
import { RenameDialog } from "@/components/rename-dialog";
import { ShareDialog } from "@/components/share-dialog";
import type { File, Folder, TreeItem } from "@/lib/types";

interface DashboardSidebarDialogsProps {
  renameItem: TreeItem | null;
  deleteItem: TreeItem | null;
  moveItem: TreeItem | null;
  moveFolders: Folder[];
  isMoving: boolean;
  shareItem: TreeItem | null;
  shareFile: File | null;
  shareFolder: Folder | null;
  onRenameItemChange: (item: TreeItem | null) => void;
  onDeleteItemChange: (item: TreeItem | null) => void;
  onMoveItemChange: (item: TreeItem | null) => void;
  onShareStateChange: (item: TreeItem | null, file: File | null, folder: Folder | null) => void;
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
  onRenameItemChange,
  onDeleteItemChange,
  onMoveItemChange,
  onShareStateChange,
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
              onShareStateChange(null, null, null);
            }
          }}
          itemName={shareFile?.name ?? shareFolder?.name ?? shareItem.name}
          itemType={shareItem.type}
          isPublic={shareFile?.is_public ?? shareFolder?.is_public ?? false}
          slug={shareFile?.slug ?? shareFolder?.slug ?? null}
          onTogglePublic={onTogglePublic}
        />
      )}
    </>
  );
}
