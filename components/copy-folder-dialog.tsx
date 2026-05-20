"use client";

import { useState } from "react";
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
import { fetchJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useFoldersQuery } from "@/hooks/workspace/use-workspace-queries";
import type { Folder as FolderType } from "@/lib/types";
import { toast } from "sonner";

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
          onClick={() => onSelectFolder(node.folder.id)}
        >
          {isExpanded ? (
            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 truncate">{node.folder.name}</span>
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

export function CopyFolderDialog({
  open,
  onOpenChange,
  shareSlug,
  itemName,
  itemType = "folder",
}: CopyFolderDialogProps) {
  const { data: folders, isLoading } = useFoldersQuery();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [isCopying, setIsCopying] = useState(false);

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

  const handleCopy = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      toast.error(
        `You must be signed in to copy ${itemType === "folder" ? "folders" : "documents"}`,
      );
      return;
    }

    setIsCopying(true);
    try {
      await fetchJson(
        `/api/public/${itemType === "folder" ? "folders" : "files"}/${shareSlug}/copy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination_parent_id: selectedFolderId }),
        },
      );
      toast.success(`"${itemName}" copied to your workspace`);
      onOpenChange(false);
      setSelectedFolderId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to copy ${itemType}`);
    } finally {
      setIsCopying(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFolderId(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md gap-5 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="pr-8 text-left break-words">
            Copy &quot;{itemName}&quot;
          </DialogTitle>
          <DialogDescription className="text-left">
            Choose a destination folder in your workspace to copy this shared {itemType}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Destination Folder</Label>
            <div className="max-h-[min(320px,45svh)] overflow-y-auto rounded-lg border bg-background p-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Loading folders…
                </div>
              ) : folders && folders.length > 0 ? (
                <div className="space-y-1" role="tree" aria-label="Destination folders">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                      selectedFolderId === null && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => setSelectedFolderId(null)}
                  >
                    <span className="size-5" />
                    <Folder className="size-4 text-muted-foreground" />
                    <span className="flex-1 truncate">Root</span>
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
                <div className="text-sm text-muted-foreground text-center py-4">
                  No folders in workspace. The {itemType} will be copied to root.
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
            disabled={isCopying}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={isCopying}
            className="w-full sm:w-auto"
          >
            {isCopying ? "Copying..." : `Copy ${itemType === "folder" ? "Folder" : "Document"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
