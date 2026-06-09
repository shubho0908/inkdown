"use client";

import { memo, type DragEvent, type ReactNode } from "react";
import { FileUp, Move } from "lucide-react";
import { TreeNode } from "@/components/file-tree-node";
import { useFileTree } from "@/hooks/use-file-tree";
import { cn } from "@/lib/utils";
import type { TreeItem } from "@/lib/validation/models";

export interface FileTreeProps {
  items: TreeItem[];
  selectedId: string | null;
  emptyState?: ReactNode;
  onImportFiles: (
    files: globalThis.File[],
    folderId: string | null,
    items?: DataTransferItemList,
  ) => void;
  onSelect: (item: TreeItem) => void;
  onMove: (item: TreeItem, targetFolderId: string | null) => void;
  onCreateFile: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRename: (item: TreeItem) => void;
  onDelete: (item: TreeItem) => void;
  onMoveClick: (item: TreeItem) => void;
  onTogglePublic?: (item: TreeItem) => void;
  onDownloadFile?: (item: TreeItem) => void;
  onExportFolder?: (folderId: string, folderName: string) => void;
  onPrefetchFile?: (fileId: string) => void;
}

interface RootDropZoneProps {
  active: boolean;
  mode: "move" | "import";
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

const RootDropZone = memo(function RootDropZone({
  active,
  mode,
  onDragOver,
  onDragLeave,
  onDrop,
}: RootDropZoneProps) {
  return (
    <div
      className={cn(
        "mx-1 flex min-h-9 items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border/70 bg-background/40",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {mode === "import" ? <FileUp className="size-3.5" /> : <Move className="size-3.5" />}
      {mode === "import"
        ? "Drop .md files to import to workspace root"
        : "Drop to move to workspace root"}
    </div>
  );
});

export function FileTree({
  items,
  selectedId,
  emptyState,
  onImportFiles,
  onSelect,
  onMove,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onMoveClick,
  onTogglePublic,
  onDownloadFile,
  onExportFolder,
  onPrefetchFile,
}: FileTreeProps) {
  const tree = useFileTree({ items, onImportFiles, onMove });

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl",
        tree.isRootDropTargetActive && "bg-accent/30",
      )}
      onDragOver={tree.handleContainerDragOver}
      onDragLeave={tree.handleContainerDragLeave}
      onDrop={tree.handleContainerDrop}
    >
      {tree.shouldShowRootDropZone && (
        <RootDropZone
          active={tree.isRootDropTargetActive}
          mode={tree.isExternalDragging ? "import" : "move"}
          onDragOver={tree.handleRootZoneDragOver}
          onDragLeave={tree.handleRootZoneDragLeave}
          onDrop={tree.handleRootZoneDrop}
        />
      )}

      {items.length === 0 && emptyState ? (
        <div
          className={cn(
            "mx-1 min-h-36 rounded-2xl border border-dashed p-4 transition-colors",
            tree.externalDropTargetId === "root"
              ? "border-primary/50 bg-primary/10"
              : "border-border/70 bg-background/40",
          )}
        >
          {emptyState}
        </div>
      ) : null}

      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          level={0}
          selectedId={selectedId}
          isExpanded={tree.expandedFolderIds.has(item.id)}
          expandedFolderIds={tree.expandedFolderIds}
          draggedItemId={tree.draggedItemId}
          dropTargetId={tree.dropTargetId}
          externalDropTargetId={tree.externalDropTargetId}
          draggedItemIdRef={tree.draggedItemIdRef}
          itemIndexRef={tree.itemIndexRef}
          folderIndexRef={tree.folderIndexRef}
          onDragStart={tree.handleDragStart}
          onDragEnd={tree.resetDragState}
          onDropTargetChange={tree.setDropTargetId}
          onExternalDropTargetChange={tree.setExternalDropTargetId}
          onExternalDragActiveChange={tree.setIsExternalDragging}
          onImportFiles={onImportFiles}
          onToggleExpanded={tree.handleToggleFolder}
          onExpand={tree.handleExpandFolder}
          onSelect={onSelect}
          onMove={onMove}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          onDelete={onDelete}
          onMoveClick={onMoveClick}
          onTogglePublic={onTogglePublic}
          onDownloadFile={onDownloadFile}
          onExportFolder={onExportFolder}
          onPrefetchFile={onPrefetchFile}
        />
      ))}

      {tree.shouldShowBottomRootDropZone && (
        <RootDropZone
          active={tree.isRootDropTargetActive}
          mode={tree.isExternalDragging ? "import" : "move"}
          onDragOver={tree.handleRootZoneDragOver}
          onDragLeave={tree.handleRootZoneDragLeave}
          onDrop={tree.handleRootZoneDrop}
        />
      )}
    </div>
  );
}
