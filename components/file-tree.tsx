"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { FileUp, Move } from "lucide-react";
import { TreeNode } from "@/components/file-tree-node";
import { canMoveTreeItem } from "@/lib/folder-tree";
import { isExternalFileDragEvent, getDroppedFiles, type FolderRef } from "@/lib/drag-utils";
import { cn } from "@/lib/utils";
import type { TreeItem } from "@/lib/types";

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
}

interface RootDropZoneProps {
  active: boolean;
  mode: "move" | "import";
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

// ─── Internal components ─────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function isTreeBackgroundDragEvent(event: DragEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement | null;
  return !target?.closest("[data-tree-node-id]");
}

// ─── Main component ──────────────────────────────────────────────────────────

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
}: FileTreeProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | "root" | null>(null);
  const [externalDropTargetId, setExternalDropTargetId] = useState<string | "root" | null>(null);
  const [isExternalDragging, setIsExternalDragging] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set());

  // Synchronous ref — updated in the same microtask as onDragStart so that
  // dragover handlers on target nodes can always resolve the dragged item,
  // even before React re-renders.
  const draggedItemIdRef = useRef<string | null>(null);

  // ── Derived indexes (O(n) on items change only) ──
  const itemIndex = useMemo(() => {
    const map = new Map<string, TreeItem>();
    const visit = (nodes: TreeItem[]) => {
      for (const node of nodes) {
        map.set(node.id, node);
        if (node.children?.length) visit(node.children);
      }
    };
    visit(items);
    return map;
  }, [items]);

  const folderIndex: FolderRef = useMemo(
    () =>
      Array.from(itemIndex.values()).reduce<FolderRef>((acc, node) => {
        if (node.type === "folder") acc.push({ id: node.id, parent_id: node.parent_id });
        return acc;
      }, []),
    [itemIndex],
  );

  // Refs kept in sync so event handlers always access current data
  const itemIndexRef = useRef(itemIndex);
  const folderIndexRef = useRef(folderIndex);

  useEffect(() => {
    itemIndexRef.current = itemIndex;
  }, [itemIndex]);

  useEffect(() => {
    folderIndexRef.current = folderIndex;
  }, [folderIndex]);

  // Ref for expandedFolderIds so TreeNode can check expansion without
  // receiving a callback that changes identity on every expand/collapse
  const expandedRef = useRef(expandedFolderIds);
  useEffect(() => {
    expandedRef.current = expandedFolderIds;
  }, [expandedFolderIds]);

  // Stable function — reads from ref, never changes identity
  const isFolderExpanded = useCallback(
    (itemId: string) => expandedRef.current.has(itemId),
    [],
  );

  // Event-time validation (uses refs, never stale)
  const canDropRealtime = useCallback((targetFolderId: string | null) => {
    const id = draggedItemIdRef.current;
    if (!id) return false;
    if (id === targetFolderId) return false;
    const dragged = itemIndexRef.current.get(id);
    if (!dragged) return false;
    return canMoveTreeItem(folderIndexRef.current, dragged, targetFolderId);
  }, []);

  const draggedItem = draggedItemId ? itemIndex.get(draggedItemId) : undefined;
  const canDropToRoot = draggedItem ? canMoveTreeItem(folderIndex, draggedItem, null) : false;

  // ── Keyboard shortcut: Cmd+X collapses all ──
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key.toLowerCase() !== "x") return;
      if (isEditableElement(event.target)) return;
      event.preventDefault();
      setExpandedFolderIds(new Set());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Drag lifecycle ──
  const handleDragStart = useCallback((itemId: string) => {
    draggedItemIdRef.current = itemId;
    setDraggedItemId(itemId);
  }, []);

  const resetDragState = useCallback(() => {
    draggedItemIdRef.current = null;
    setDraggedItemId(null);
    setDropTargetId(null);
    setExternalDropTargetId(null);
    setIsExternalDragging(false);
  }, []);

  const handleRootDrop = useCallback(() => {
    const id = draggedItemIdRef.current;
    if (!id) return;
    const item = itemIndexRef.current.get(id);
    if (!item || !canMoveTreeItem(folderIndexRef.current, item, null)) return;
    onMove(item, null);
    resetDragState();
  }, [onMove, resetDragState]);

  // ── Root zone handlers ──
  const handleRootZoneDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (isExternalFileDragEvent(event)) {
        event.stopPropagation();
        event.preventDefault();
        setIsExternalDragging(true);
        setExternalDropTargetId((prev) => (prev === "root" ? prev : "root"));
        return;
      }
      if (!canDropRealtime(null)) return;
      event.stopPropagation();
      event.preventDefault();
      setDropTargetId((prev) => (prev === "root" ? prev : "root"));
    },
    [canDropRealtime],
  );

  const handleRootZoneDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setExternalDropTargetId((prev) => (prev === "root" ? null : prev));
    setDropTargetId((prev) => (prev === "root" ? null : prev));
  }, []);

  const handleRootZoneDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (isExternalFileDragEvent(event)) {
        event.stopPropagation();
        event.preventDefault();
        const files = getDroppedFiles(event);
        const transferItems = event.dataTransfer.items;
        setExternalDropTargetId(null);
        setIsExternalDragging(false);
        if (files.length > 0) onImportFiles(files, null, transferItems);
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      handleRootDrop();
    },
    [onImportFiles, handleRootDrop],
  );

  // ── Folder expansion (stable callbacks) ──
  const handleToggleFolder = useCallback((itemId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handleExpandFolder = useCallback((itemId: string) => {
    setExpandedFolderIds((current) => {
      if (current.has(itemId)) return current;
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
  }, []);

  // ── Derived display state ──
  const isRootDropTargetActive = dropTargetId === "root" || externalDropTargetId === "root";
  const shouldShowRootDropZone = (draggedItem && canDropToRoot) || isExternalDragging;
  const shouldShowBottomRootDropZone =
    shouldShowRootDropZone && items.length > 0 && !isExternalDragging;

  return (
    <div
      className={cn("flex flex-col gap-1 rounded-2xl", isRootDropTargetActive && "bg-accent/30")}
      onDragOver={(event) => {
        if (isExternalFileDragEvent(event)) {
          setIsExternalDragging(true);
          if (!isTreeBackgroundDragEvent(event)) return;
          event.preventDefault();
          setExternalDropTargetId((prev) => (prev === "root" ? prev : "root"));
          return;
        }
        // Always preventDefault for internal drags so the browser fires the
        // drop event (required by HTML5 DnD spec) and doesn't show "not allowed" cursor
        event.preventDefault();
        if (!isTreeBackgroundDragEvent(event)) return;
        if (!canDropRealtime(null)) return;
        setDropTargetId((prev) => (prev === "root" ? prev : "root"));
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setExternalDropTargetId(null);
        setIsExternalDragging(false);
        setDropTargetId((prev) => (prev === "root" ? null : prev));
      }}
      onDrop={(event) => {
        if (isExternalFileDragEvent(event)) {
          if (!isTreeBackgroundDragEvent(event)) return;
          event.preventDefault();
          const files = getDroppedFiles(event);
          const transferItems = event.dataTransfer.items;
          setExternalDropTargetId(null);
          setIsExternalDragging(false);
          if (files.length > 0) onImportFiles(files, null, transferItems);
          return;
        }
        // Always prevent default for internal drags to stop the browser from
        // navigating to or downloading the dataTransfer text/plain content
        event.preventDefault();
        if (!isTreeBackgroundDragEvent(event)) return;
        if (!canDropRealtime(null)) return;
        handleRootDrop();
      }}
    >
      {shouldShowRootDropZone && (
        <RootDropZone
          active={isRootDropTargetActive}
          mode={isExternalDragging ? "import" : "move"}
          onDragOver={handleRootZoneDragOver}
          onDragLeave={handleRootZoneDragLeave}
          onDrop={handleRootZoneDrop}
        />
      )}

      {items.length === 0 && emptyState ? (
        <div
          className={cn(
            "mx-1 min-h-36 rounded-2xl border border-dashed p-4 transition-colors",
            externalDropTargetId === "root"
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
          isExpanded={expandedFolderIds.has(item.id)}
          draggedItemId={draggedItemId}
          dropTargetId={dropTargetId}
          externalDropTargetId={externalDropTargetId}
          draggedItemIdRef={draggedItemIdRef}
          itemIndexRef={itemIndexRef}
          folderIndexRef={folderIndexRef}
          onDragStart={handleDragStart}
          onDragEnd={resetDragState}
          onDropTargetChange={setDropTargetId}
          onExternalDropTargetChange={setExternalDropTargetId}
          onExternalDragActiveChange={setIsExternalDragging}
          onImportFiles={onImportFiles}
          isFolderExpanded={isFolderExpanded}
          onToggleExpanded={handleToggleFolder}
          onExpand={handleExpandFolder}
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

      {shouldShowBottomRootDropZone && (
        <RootDropZone
          active={isRootDropTargetActive}
          mode={isExternalDragging ? "import" : "move"}
          onDragOver={handleRootZoneDragOver}
          onDragLeave={handleRootZoneDragLeave}
          onDrop={handleRootZoneDrop}
        />
      )}
    </div>
  );
}
