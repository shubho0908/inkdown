"use client";

import { useMemo, useState } from "react";
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
import { Folder, FolderOpen, ChevronDown, ChevronRight, Move } from "lucide-react";
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
            "hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
        )}
        style={{ paddingLeft: `${node.level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFolder(node.folder.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        ) : (
          <span className="size-5" />
        )}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none"
          onClick={() => {
            if (!node.isDisabled) {
              onSelectFolder(node.folder.id);
            }
          }}
          disabled={node.isDisabled}
        >
          {isExpanded ? (
            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 truncate">{node.folder.name}</span>
          {node.isCurrentLocation && (
            <span className="mr-1 shrink-0 text-xs text-muted-foreground">(current)</span>
          )}
        </button>
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
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  const isRoot = item.parent_id === null;
  const rootIsDisabled = isRoot;

  const folderTree = useMemo(() => buildFilteredFolderTree(folders, item), [folders, item]);

  const hasValidFolders = folderTree.length > 0;

  const isMoveValid = useMemo(() => {
    if (selectedFolderId === null && rootIsDisabled) return false;
    if (selectedFolderId !== null && selectedFolderId === item.parent_id) return false;
    return true;
  }, [selectedFolderId, rootIsDisabled, item.parent_id]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleMove = () => {
    if (!isMoveValid) return;
    onMove(selectedFolderId);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFolderId(null);
    }
    onOpenChange(nextOpen);
  };

  const itemLabel = item.type === "folder" ? "folder" : "file";
  const destinationLabel =
    selectedFolderId === null
      ? "root"
      : (folders.find((f) => f.id === selectedFolderId)?.name ?? "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md gap-5 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="pr-8 text-left break-words">
            Move &ldquo;{item.name}&rdquo;
          </DialogTitle>
          <DialogDescription className="text-left">
            Choose a destination folder to move this {itemLabel} to.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Destination</Label>
            <div className="max-h-[min(320px,45svh)] overflow-y-auto rounded-lg border bg-background p-2">
              {folders.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No folders in workspace. The {itemLabel} will be moved to root.
                </div>
              ) : (
                <div className="space-y-1" role="tree" aria-label="Destination folders">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                      rootIsDisabled ? "cursor-default opacity-50" : "hover:bg-accent/60",
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
                    <span className="size-5" />
                    <Folder className="size-4 text-muted-foreground" />
                    <span className="flex-1 truncate">Root</span>
                    {rootIsDisabled && (
                      <span className="mr-1 shrink-0 text-xs text-muted-foreground">(current)</span>
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
                    <div className="py-2 text-center text-xs text-muted-foreground">
                      No other folders available.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
