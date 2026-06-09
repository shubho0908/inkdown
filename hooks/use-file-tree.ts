"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type DragEvent,
  type SetStateAction,
} from "react";
import { canMoveTreeItem } from "@/lib/folder-tree";
import { handleExternalFileDrop, isExternalFileDragEvent, type FolderRef } from "@/lib/drag-utils";
import type { DroppedImportSelection } from "@/lib/folder-import";
import type { TreeItem } from "@/lib/validation/models";
import {
  fileTreeReducer,
  isEditableElement,
  isTreeBackgroundDragEvent,
  type DropTargetId,
} from "@/components/file-tree-state";
interface UseFileTreeParams {
  items: TreeItem[];
  onImportFiles: (selection: DroppedImportSelection, folderId: string | null) => void;
  onMove: (item: TreeItem, targetFolderId: string | null) => void;
}

export function useFileTree({ items, onImportFiles, onMove }: UseFileTreeParams) {
  const [treeState, dispatch] = useReducer(fileTreeReducer, {
    draggedItemId: null,
    dropTargetId: null,
    externalDropTargetId: null,
    isExternalDragging: false,
    expandedFolderIds: new Set<string>(),
  });
  const {
    draggedItemId,
    dropTargetId,
    externalDropTargetId,
    isExternalDragging,
    expandedFolderIds,
  } = treeState;
  const setDropTargetId = useCallback((value: SetStateAction<DropTargetId>) => {
    dispatch({ type: "set_drop_target", target: value });
  }, []);
  const setExternalDropTargetId = useCallback((value: SetStateAction<DropTargetId>) => {
    dispatch({ type: "set_external_drop_target", target: value });
  }, []);
  const setIsExternalDragging = useCallback((value: SetStateAction<boolean>) => {
    dispatch({ type: "set_external_dragging", active: value });
  }, []);

  const draggedItemIdRef = useRef<string | null>(null);

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

  const itemIndexRef = useRef(itemIndex);
  const folderIndexRef = useRef(folderIndex);

  useEffect(() => {
    itemIndexRef.current = itemIndex;
  }, [itemIndex]);

  useEffect(() => {
    folderIndexRef.current = folderIndex;
  }, [folderIndex]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key.toLowerCase() !== "x") return;
      if (isEditableElement(event.target)) return;
      event.preventDefault();
      dispatch({ type: "collapse_all" });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDragStart = useCallback((itemId: string) => {
    draggedItemIdRef.current = itemId;
    dispatch({ type: "drag_start", itemId });
  }, []);

  const resetDragState = useCallback(() => {
    draggedItemIdRef.current = null;
    dispatch({ type: "reset_drag" });
  }, []);

  const handleRootDrop = useCallback(() => {
    const id = draggedItemIdRef.current;
    if (!id) return;
    const item = itemIndexRef.current.get(id);
    if (!item || !canMoveTreeItem(folderIndexRef.current, item, null)) return;
    onMove(item, null);
    resetDragState();
  }, [onMove, resetDragState]);

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
    [canDropRealtime, setDropTargetId, setExternalDropTargetId, setIsExternalDragging],
  );

  const handleRootZoneDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setExternalDropTargetId((prev) => (prev === "root" ? null : prev));
      setDropTargetId((prev) => (prev === "root" ? null : prev));
    },
    [setDropTargetId, setExternalDropTargetId],
  );

  const handleRootZoneDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      if (
        await handleExternalFileDrop({
          event,
          folderId: null,
          onImport: onImportFiles,
        })
      ) {
        setExternalDropTargetId(null);
        setIsExternalDragging(false);
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      handleRootDrop();
    },
    [onImportFiles, handleRootDrop, setExternalDropTargetId, setIsExternalDragging],
  );

  const handleToggleFolder = useCallback((itemId: string) => {
    dispatch({ type: "toggle_folder", itemId });
  }, []);

  const handleExpandFolder = useCallback((itemId: string) => {
    dispatch({ type: "expand_folder", itemId });
  }, []);

  const isRootDropTargetActive = dropTargetId === "root" || externalDropTargetId === "root";
  const shouldShowRootDropZone = (draggedItem && canDropToRoot) || isExternalDragging;
  const shouldShowBottomRootDropZone =
    shouldShowRootDropZone && items.length > 0 && !isExternalDragging;

  const handleContainerDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (isExternalFileDragEvent(event)) {
        setIsExternalDragging(true);
        if (!isTreeBackgroundDragEvent(event)) return;
        event.preventDefault();
        setExternalDropTargetId((prev) => (prev === "root" ? prev : "root"));
        return;
      }
      event.preventDefault();
      if (!isTreeBackgroundDragEvent(event)) return;
      if (!canDropRealtime(null)) return;
      setDropTargetId((prev) => (prev === "root" ? prev : "root"));
    },
    [canDropRealtime, setDropTargetId, setExternalDropTargetId, setIsExternalDragging],
  );

  const handleContainerDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setExternalDropTargetId(null);
      setIsExternalDragging(false);
      setDropTargetId((prev) => (prev === "root" ? null : prev));
    },
    [setDropTargetId, setExternalDropTargetId, setIsExternalDragging],
  );

  const handleContainerDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      if (isExternalFileDragEvent(event)) {
        if (!isTreeBackgroundDragEvent(event)) return;
        if (
          await handleExternalFileDrop({
            event,
            folderId: null,
            onImport: onImportFiles,
            stopPropagation: false,
          })
        ) {
          setExternalDropTargetId(null);
          setIsExternalDragging(false);
        }
        return;
      }
      event.preventDefault();
      if (!isTreeBackgroundDragEvent(event)) return;
      if (!canDropRealtime(null)) return;
      handleRootDrop();
    },
    [
      canDropRealtime,
      handleRootDrop,
      onImportFiles,
      setExternalDropTargetId,
      setIsExternalDragging,
    ],
  );

  return {
    draggedItemId,
    dropTargetId,
    externalDropTargetId,
    expandedFolderIds,
    draggedItemIdRef,
    itemIndexRef,
    folderIndexRef,
    draggedItem,
    isRootDropTargetActive,
    isExternalDragging,
    shouldShowRootDropZone,
    shouldShowBottomRootDropZone,
    handleDragStart,
    resetDragState,
    setDropTargetId,
    setExternalDropTargetId,
    setIsExternalDragging,
    handleRootZoneDragOver,
    handleRootZoneDragLeave,
    handleRootZoneDrop,
    handleToggleFolder,
    handleExpandFolder,
    handleContainerDragOver,
    handleContainerDragLeave,
    handleContainerDrop,
  };
}
