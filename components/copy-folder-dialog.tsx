"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Folder, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFoldersQuery } from "@/hooks/workspace/use-workspace-queries";
import { useCopySharedItemMutation } from "@/hooks/workspace/use-copy-shared-item";
import type { Folder as FolderType } from "@/lib/validation/models";

interface CopyFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareSlug: string;
  itemName: string;
  itemType?: "file" | "folder";
}

interface FolderNode {
  folder: FolderType;
  level: number;
  children: FolderNode[];
}

function buildFolderTree(folders: FolderType[]): FolderNode[] {
  const folderMap = new Map<string, FolderNode>();
  const rootNodes: FolderNode[] = [];

  folders.forEach((folder) => {
    folderMap.set(folder.id, { folder, level: 0, children: [] });
  });

  folders.forEach((folder) => {
    const node = folderMap.get(folder.id);
    if (!node) return;

    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id)?.children.push(node);
      node.level = folderMap.get(folder.parent_id)!.level + 1;
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
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
          isSelected && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${node.level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-accent"
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
          <span className="size-5 shrink-0" />
        )}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none"
          onClick={() => onSelectFolder(node.folder.id)}
        >
          {isExpanded ? (
            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1 truncate">{node.folder.name}</span>
        </button>
      </div>
      {isExpanded && hasChildren && (
        <div>
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

export function CopyFolderDialog({
  open,
  onOpenChange,
  shareSlug,
  itemName,
  itemType = "folder",
}: CopyFolderDialogProps) {
  const { push } = useRouter();
  const { data: folders, isLoading } = useFoldersQuery();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  const copyMutation = useCopySharedItemMutation();

  const folderTree = folders ? buildFolderTree(folders) : [];

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

  const handleCopy = () => {
    copyMutation.mutate(
      {
        shareSlug,
        itemType,
        itemName,
        destinationParentId: selectedFolderId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedFolderId(null);
          push("/workspace");
        },
      },
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFolderId(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-lg gap-0 overflow-hidden p-0 sm:gap-0">
        <DialogHeader className="min-w-0 overflow-hidden border-b px-5 pb-4 pt-5 sm:px-6 sm:pb-4 sm:pt-6">
          <DialogTitle className="min-w-0 overflow-hidden pr-8 text-left">
            <span className="block truncate" title={itemName}>
              Copy &quot;{itemName}&quot;
            </span>
          </DialogTitle>
          <DialogDescription className="text-left">
            Choose a destination folder in your workspace to copy this shared {itemType}.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-1 pt-4 sm:px-6 sm:pt-5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
            Destination
          </Label>
        </div>
        <div className="max-h-[min(280px,40svh)] overflow-y-auto px-5 pb-4 sm:px-6 sm:pb-5">
          {isLoading ? (
            <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              Loading folders…
            </div>
          ) : folders && folders.length > 0 ? (
            <div
              className="space-y-0.5 rounded-lg border bg-background p-1.5"
              role="tree"
              aria-label="Destination folders"
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                  selectedFolderId === null && "bg-accent text-accent-foreground",
                )}
                onClick={() => setSelectedFolderId(null)}
              >
                <span className="size-5 shrink-0" />
                <Folder className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">Root</span>
              </button>
              {folderTree.map((node) => (
                <FolderTreeItem
                  key={node.folder.id}
                  node={node}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  expandedFolderIds={expandedFolderIds}
                  onToggleFolder={toggleFolder}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              No folders in workspace. The {itemType} will be copied to root.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:items-end sm:gap-2 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={copyMutation.isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={copyMutation.isPending}
            className="w-full sm:w-auto"
          >
            {copyMutation.isPending
              ? "Copying..."
              : `Copy ${itemType === "folder" ? "Folder" : "Document"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
