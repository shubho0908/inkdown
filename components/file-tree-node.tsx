"use client";

import { memo, useRef, type MutableRefObject } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  FileUp,
  Folder,
  FolderOpen,
  FolderOutput,
  GripVertical,
  MoreHorizontal,
  Move,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { canMoveTreeItem } from "@/lib/folder-tree";
import { isExternalFileDragEvent, type FolderRef } from "@/lib/drag-utils";
import type { TreeItem } from "@/lib/types";

const AUTO_EXPAND_DELAY = 500;

// ─── Interface ───────────────────────────────────────────────────────────────

interface TreeNodeProps {
  item: TreeItem;
  level: number;
  selectedId: string | null;
  isExpanded: boolean;
  expandedFolderIds: Set<string>;
  draggedItemId: string | null;
  dropTargetId: string | "root" | null;
  externalDropTargetId: string | "root" | null;
  draggedItemIdRef: MutableRefObject<string | null>;
  itemIndexRef: MutableRefObject<Map<string, TreeItem>>;
  folderIndexRef: MutableRefObject<FolderRef>;
  onDragStart: (itemId: string) => void;
  onDragEnd: () => void;
  onDropTargetChange: (targetId: string | "root" | null) => void;
  onExternalDropTargetChange: (targetId: string | "root" | null) => void;
  onExternalDragActiveChange: (active: boolean) => void;
  onImportFiles: (
    files: globalThis.File[],
    folderId: string | null,
    items?: DataTransferItemList,
  ) => void;
  onToggleExpanded: (itemId: string) => void;
  onExpand: (itemId: string) => void;
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
}

// ─── Component ───────────────────────────────────────────────────────────────

export const TreeNode = memo(function TreeNode({
  item,
  level,
  selectedId,
  isExpanded,
  expandedFolderIds,
  draggedItemId,
  dropTargetId,
  externalDropTargetId,
  draggedItemIdRef,
  itemIndexRef,
  folderIndexRef,
  onDragStart,
  onDragEnd,
  onDropTargetChange,
  onExternalDropTargetChange,
  onExternalDragActiveChange,
  onImportFiles,
  onToggleExpanded,
  onExpand,
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
}: TreeNodeProps) {
  const isFolder = item.type === "folder";
  const isSelected = selectedId === item.id;
  const isDragging = draggedItemId === item.id;
  const isDropTarget = dropTargetId === item.id;
  const isExternalDropTarget = externalDropTargetId === item.id;

  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time validation using refs — never stale, never depends on render cycle
  const canDropHere = (): boolean => {
    if (!isFolder) return false;
    const id = draggedItemIdRef.current;
    if (!id || id === item.id) return false;
    const dragged = itemIndexRef.current.get(id);
    if (!dragged) return false;
    return canMoveTreeItem(folderIndexRef.current, dragged, item.id);
  };

  const scheduleExpand = () => {
    if (isExpanded || expandTimerRef.current) return;
    expandTimerRef.current = setTimeout(() => {
      expandTimerRef.current = null;
      onExpand(item.id);
    }, AUTO_EXPAND_DELAY);
  };

  const cancelExpand = () => {
    if (!expandTimerRef.current) return;
    clearTimeout(expandTimerRef.current);
    expandTimerRef.current = null;
  };

  return (
    <div>
      <div
        data-tree-node-id={item.id}
        className={cn(
          "group flex min-w-0 items-center gap-1 rounded-xl border border-transparent p-2 text-sm transition-colors hover:bg-accent/70",
          isSelected && "border-border bg-accent/80 shadow-xs",
          isDragging && "cursor-grabbing opacity-55",
          isDropTarget &&
            isFolder &&
            "border-primary/60 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]",
          isExternalDropTarget &&
            isFolder &&
            "border-primary/60 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onDragOver={(event) => {
          if (isFolder && isExternalFileDragEvent(event)) {
            event.stopPropagation();
            event.preventDefault();
            onExternalDragActiveChange(true);
            scheduleExpand();
            if (externalDropTargetId !== item.id) onExternalDropTargetChange(item.id);
            return;
          }

          if (isFolder && canDropHere()) {
            event.stopPropagation();
            event.preventDefault();
            scheduleExpand();
            if (dropTargetId !== item.id) onDropTargetChange(item.id);
            return;
          }

          // Non-folder or invalid target: let event bubble to parent
        }}
        onDragLeave={(event) => {
          cancelExpand();

          if (isExternalDropTarget) {
            event.stopPropagation();
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
            onExternalDropTargetChange(null);
            return;
          }

          if (!isFolder) return;
          event.stopPropagation();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          if (dropTargetId === item.id) onDropTargetChange(null);
        }}
        onDrop={(event) => {
          cancelExpand();

          if (isFolder && isExternalFileDragEvent(event)) {
            event.stopPropagation();
            event.preventDefault();
            onExternalDragActiveChange(false);
            onExternalDropTargetChange(null);
            const files = Array.from(event.dataTransfer.files);
            const transferItems = event.dataTransfer.items;
            if (files.length > 0) onImportFiles(files, item.id, transferItems);
            return;
          }

          if (isFolder && canDropHere()) {
            event.stopPropagation();
            event.preventDefault();
            // Resolve dragged item and execute move
            const dragged = itemIndexRef.current.get(draggedItemIdRef.current!);
            if (dragged) onMove(dragged, item.id);
            onDragEnd();
            return;
          }

          // Always prevent default for internal drags to stop browser from
          // navigating to or downloading the dataTransfer text/plain content
          if (draggedItemIdRef.current) {
            event.preventDefault();
          }
        }}
      >
        <button
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", item.id);
            onDragStart(item.id);
          }}
          onDragEnd={() => {
            cancelExpand();
            onDragEnd();
          }}
          className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground/55 transition-colors hover:text-muted-foreground"
          aria-label={`Drag ${item.name}`}
        >
          <GripVertical className="size-3.5" />
        </button>

        {isFolder ? (
          <button
            onClick={() => onToggleExpanded(item.id)}
            className="flex size-4 shrink-0 items-center justify-center"
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.name}`}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <button
          onClick={() => {
            if (isFolder) {
              onToggleExpanded(item.id);
              return;
            }
            onSelect(item);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left"
          title={item.name}
          aria-expanded={isFolder ? isExpanded : undefined}
        >
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted-foreground" />
            )
          ) : (
            <FileText className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          {isFolder && isExternalDropTarget && (
            <FileUp className="size-3.5 shrink-0 text-primary" />
          )}
          {item.is_public && <Share2 className="size-3 shrink-0 text-primary" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isFolder && (
              <>
                <DropdownMenuItem onClick={() => onCreateFile(item.id)}>
                  <Plus className="mr-2 size-4" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateFolder(item.id)}>
                  <Folder className="mr-2 size-4" />
                  New Folder
                </DropdownMenuItem>
                {onExportFolder && (
                  <DropdownMenuItem onClick={() => onExportFolder(item.id, item.name)}>
                    <FolderOutput className="mr-2 size-4" />
                    Export Folder
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            {onTogglePublic && (
              <>
                <DropdownMenuItem onClick={() => onTogglePublic(item)}>
                  <Share2 className="mr-2 size-4" />
                  {item.is_public ? "Make Private" : "Make Public"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isFolder && onDownloadFile ? (
              <DropdownMenuItem onClick={() => onDownloadFile(item)}>
                <Download className="mr-2 size-4" />
                Download .md
              </DropdownMenuItem>
            ) : null}
            {!isFolder && onDownloadFile ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onClick={() => onMoveClick(item)}>
              <Move className="mr-2 size-4" />
              Move to…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRename(item)}>
              <Pencil className="mr-2 size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(item)}
              className="mt-1 rounded-lg"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isFolder && isExpanded && item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              isExpanded={expandedFolderIds.has(child.id)}
              expandedFolderIds={expandedFolderIds}
              draggedItemId={draggedItemId}
              dropTargetId={dropTargetId}
              externalDropTargetId={externalDropTargetId}
              draggedItemIdRef={draggedItemIdRef}
              itemIndexRef={itemIndexRef}
              folderIndexRef={folderIndexRef}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropTargetChange={onDropTargetChange}
              onExternalDropTargetChange={onExternalDropTargetChange}
              onExternalDragActiveChange={onExternalDragActiveChange}
              onImportFiles={onImportFiles}
              onToggleExpanded={onToggleExpanded}
              onExpand={onExpand}
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
            />
          ))}
        </div>
      )}
    </div>
  );
});
