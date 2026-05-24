"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Folder, FolderOpen, ChevronDown, ChevronRight, Move, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { collectDescendantFolderIds } from "@/lib/folder-tree";
import type { Folder as FolderType, TreeItem } from "@/lib/types";

interface MoveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TreeItem;
  folders: FolderType[];
  onMove: (targetFolderId: string | null) => void;
  isPending: boolean;
}

interface FolderNode {
  folder: FolderType;
  level: number;
  children: FolderNode[];
  isCurrentLocation: boolean;
  isDisabled: boolean;
}

function buildFilteredFolderTree(folders: FolderType[], item: TreeItem): FolderNode[] {
  let invalidTargetIds = new Set<string>();

  if (item.type === "file") {
    if (item.parent_id) {
      invalidTargetIds = new Set([item.parent_id]);
    }
  } else {
    invalidTargetIds = collectDescendantFolderIds(folders, item.id);
    if (item.parent_id) {
      invalidTargetIds.add(item.parent_id);
    }
  }

  const validFolders = folders.filter((f) => !invalidTargetIds.has(f.id));
  const folderMap = new Map<string, FolderNode>();
  const rootNodes: FolderNode[] = [];

  validFolders.forEach((folder) => {
    folderMap.set(folder.id, {
      folder,
      level: 0,
      children: [],
      isCurrentLocation: folder.id === item.parent_id,
      isDisabled: folder.id === item.parent_id,
    });
  });

  validFolders.forEach((folder) => {
    const node = folderMap.get(folder.id);
    if (!node) return;

    const resolvedLevel =
      folder.parent_id && folderMap.has(folder.parent_id)
        ? folderMap.get(folder.parent_id)!.level + 1
        : 0;
    node.level = resolvedLevel;

    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

function getFolderAncestorIds(folders: FolderType[], folderId: string | null): string[] {
  const ancestors: string[] = [];
  if (!folderId) return ancestors;

  let currentId: string | null = folderId;
  const folderMap = new Map(folders.map((f) => [f.id, f]));

  while (currentId && folderMap.has(currentId)) {
    ancestors.push(currentId);
    currentId = folderMap.get(currentId)!.parent_id;
  }

  return ancestors.reverse();
}

function FolderTreeItem({
  node,
  selectedFolderId,
  onSelectFolder,
  expandedFolderIds,
  onToggleFolder,
}: {
  node: FolderNode;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  expandedFolderIds: Set<string>;
  onToggleFolder: (folderId: string) => void;
}) {
  const isExpanded = expandedFolderIds.has(node.folder.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedFolderId === node.folder.id;

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
    >
      <div
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          isSelected && !node.isDisabled && "bg-accent text-accent-foreground",
          node.isDisabled && "opacity-50",
          !node.isDisabled &&
            "cursor-pointer hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
        )}
        style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        onClick={() => {
          if (!node.isDisabled) {
            onSelectFolder(node.folder.id);
          }
        }}
        onKeyDown={(e) => {
          if (!node.isDisabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelectFolder(node.folder.id);
          }
        }}
        tabIndex={node.isDisabled ? -1 : 0}
        role="button"
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFolder(node.folder.id);
            }}
            tabIndex={-1}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        {isExpanded ? (
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate">{node.folder.name}</span>
        {node.isCurrentLocation && (
          <span className="shrink-0 rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Current
          </span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div role="group">
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.folder.id}
              node={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              expandedFolderIds={expandedFolderIds}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MoveItemDialog({
  open,
  onOpenChange,
  item,
  folders,
  onMove,
  isPending,
}: MoveItemDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => {
    if (!item.parent_id) return new Set();
    return new Set(getFolderAncestorIds(folders, item.parent_id));
  });
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const itemLabel = item.type === "folder" ? "folder" : "file";
  const isRoot = item.parent_id === null;
  const rootIsDisabled = isRoot;

  const folderTree = useMemo(() => buildFilteredFolderTree(folders, item), [folders, item]);
  const hasValidFolders = folderTree.length > 0;

  const isMoveValid = useMemo(() => {
    if (selectedFolderId === null && rootIsDisabled) return false;
    if (selectedFolderId !== null && selectedFolderId === item.parent_id) return false;
    return true;
  }, [selectedFolderId, rootIsDisabled, item.parent_id]);

  const currentLocationName = useMemo(() => {
    if (isRoot) return "Root";
    return folders.find((f) => f.id === item.parent_id)?.name ?? "";
  }, [folders, item.parent_id, isRoot]);

  const destinationLabel = useMemo(() => {
    if (selectedFolderId === null) return "root";
    return folders.find((f) => f.id === selectedFolderId)?.name ?? "";
  }, [folders, selectedFolderId]);

  useEffect(() => {
    if (!open || !treeContainerRef.current) return;
    const timer = setTimeout(() => {
      const selectedEl = treeContainerRef.current?.querySelector('[aria-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, folderTree]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleMove = useCallback(() => {
    if (!isMoveValid) return;
    onMove(selectedFolderId);
  }, [isMoveValid, onMove, selectedFolderId]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSelectedFolderId(null);
        setExpandedFolderIds(new Set());
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const hasMoveBlocked = !isMoveValid && (selectedFolderId !== null || rootIsDisabled);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        key={item.id}
        className="w-[calc(100%-1rem)] max-w-md gap-0 overflow-hidden p-0 sm:gap-0"
      >
        <DialogHeader className="border-b px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
          <DialogTitle className="pr-8 text-left">
            <span className="block truncate">Move &ldquo;{item.name}&rdquo;</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            Choose a destination folder to move this {itemLabel} to.
          </DialogDescription>
        </DialogHeader>

        {currentLocationName && (
          <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-2 text-xs text-muted-foreground sm:px-6">
            <Navigation className="size-3 shrink-0" />
            <span className="truncate">
              Currently in <strong>{currentLocationName}</strong>
            </span>
          </div>
        )}

        <div className="px-5 pb-1 pt-4 sm:px-6 sm:pt-5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
            Destination
          </Label>
        </div>
        <div
          ref={treeContainerRef}
          className="max-h-[min(280px,40svh)] overflow-y-auto px-5 pb-4 sm:px-6 sm:pb-5"
        >
          {folders.length === 0 ? (
            <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              No folders in your workspace yet.
              <br />
              Create one to organize your files.
            </div>
          ) : (
            <div
              className={cn(
                "space-y-0.5 rounded-lg border bg-background p-1.5",
                !hasValidFolders && "border-dashed",
              )}
              role="tree"
              aria-label="Destination folders"
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  rootIsDisabled
                    ? "cursor-default opacity-50"
                    : "cursor-pointer hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                  selectedFolderId === null &&
                    !rootIsDisabled &&
                    "bg-accent text-accent-foreground",
                )}
                onClick={() => {
                  if (!rootIsDisabled) {
                    setSelectedFolderId(null);
                  }
                }}
                disabled={rootIsDisabled}
              >
                <span className="size-5 shrink-0" />
                <Folder className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">Root</span>
                {rootIsDisabled && (
                  <span className="shrink-0 rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Current
                  </span>
                )}
              </button>
              {hasValidFolders ? (
                folderTree.map((node) => (
                  <FolderTreeItem
                    key={node.folder.id}
                    node={node}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={setSelectedFolderId}
                    expandedFolderIds={expandedFolderIds}
                    onToggleFolder={toggleFolder}
                  />
                ))
              ) : (
                <div className="flex min-h-12 items-center justify-center px-2 py-3 text-center text-xs text-muted-foreground">
                  No other folders available.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:gap-2 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            {!isMoveValid && !isPending && hasMoveBlocked && (
              <p className="text-center text-xs text-muted-foreground sm:text-right">
                Already in this location
              </p>
            )}
            <Button
              type="button"
              onClick={handleMove}
              disabled={!isMoveValid || isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                "Moving..."
              ) : (
                <>
                  <Move className="mr-2 size-4" />
                  Move to {destinationLabel}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
