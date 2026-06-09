import type { DragEvent, SetStateAction } from "react";

export type DropTargetId = string | "root" | null;

export type FileTreeState = {
  draggedItemId: string | null;
  dropTargetId: DropTargetId;
  externalDropTargetId: DropTargetId;
  isExternalDragging: boolean;
  expandedFolderIds: Set<string>;
};

export type FileTreeAction =
  | { type: "drag_start"; itemId: string }
  | { type: "reset_drag" }
  | { type: "set_drop_target"; target: SetStateAction<DropTargetId> }
  | { type: "set_external_drop_target"; target: SetStateAction<DropTargetId> }
  | { type: "set_external_dragging"; active: SetStateAction<boolean> }
  | { type: "toggle_folder"; itemId: string }
  | { type: "expand_folder"; itemId: string }
  | { type: "collapse_all" };

function resolveStateAction<T>(value: SetStateAction<T>, current: T): T {
  if (typeof value === "function") {
    return (value as (prevState: T) => T)(current);
  }

  return value;
}

export function fileTreeReducer(state: FileTreeState, action: FileTreeAction): FileTreeState {
  switch (action.type) {
    case "drag_start":
      return { ...state, draggedItemId: action.itemId };
    case "reset_drag":
      return {
        ...state,
        draggedItemId: null,
        dropTargetId: null,
        externalDropTargetId: null,
        isExternalDragging: false,
      };
    case "set_drop_target":
      return {
        ...state,
        dropTargetId: resolveStateAction(action.target, state.dropTargetId),
      };
    case "set_external_drop_target":
      return {
        ...state,
        externalDropTargetId: resolveStateAction(action.target, state.externalDropTargetId),
      };
    case "set_external_dragging":
      return {
        ...state,
        isExternalDragging: resolveStateAction(action.active, state.isExternalDragging),
      };
    case "toggle_folder": {
      const next = new Set(state.expandedFolderIds);
      if (next.has(action.itemId)) {
        next.delete(action.itemId);
      } else {
        next.add(action.itemId);
      }
      return { ...state, expandedFolderIds: next };
    }
    case "expand_folder": {
      if (state.expandedFolderIds.has(action.itemId)) {
        return state;
      }
      const next = new Set(state.expandedFolderIds);
      next.add(action.itemId);
      return { ...state, expandedFolderIds: next };
    }
    case "collapse_all":
      return { ...state, expandedFolderIds: new Set() };
    default:
      return state;
  }
}

export function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function isTreeBackgroundDragEvent(event: DragEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement | null;
  return !target?.closest("[data-tree-node-id]");
}
