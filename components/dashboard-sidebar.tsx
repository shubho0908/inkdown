"use client";

import { useMemo, useReducer } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DashboardMobileHeader } from "@/components/dashboard-mobile-header";
import { DashboardSidebarContent } from "@/components/dashboard-sidebar-content";
import { DashboardSidebarDialogs } from "@/components/dashboard-sidebar-dialogs";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useCreateFileMutation,
  useImportMarkdownFilesMutation,
} from "@/hooks/workspace/use-file-mutations";
import type { DroppedImportSelection } from "@/lib/folder-import";
import { useCreateFolderMutation } from "@/hooks/workspace/use-folder-mutations";
import { useShareVisibilityActions } from "@/hooks/workspace/use-share-visibility-actions";
import {
  useDeleteTreeItemMutation,
  useMoveTreeItemMutation,
  useRenameTreeItemMutation,
} from "@/hooks/workspace/use-tree-item-mutations";
import {
  fetchCachedFileContent,
  usePrefetchFileContent,
} from "@/hooks/workspace/prefetch-file-content";
import { useFilesQuery, useFoldersQuery } from "@/hooks/workspace/use-workspace-queries";
import { workspaceKeys } from "@/lib/query-keys";
import type { File } from "@/lib/validation/models";
import { downloadMarkdownFile } from "@/lib/file-export";
import { useZipExport } from "@/hooks/use-zip-export";
import { authClient } from "@/lib/auth/client";

import type { TreeItem } from "@/lib/validation/models";
import { buildTree } from "@/lib/workspace-tree";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardSidebarProps {
  selectedFileId: string | null;
  onFileSelect: (fileId: string | null) => void;
}

type SidebarState = {
  renameItem: TreeItem | null;
  deleteItem: TreeItem | null;
  moveItem: TreeItem | null;
  shareItem: TreeItem | null;
  mobileOpen: boolean;
};

type SidebarAction =
  | { type: "set_rename_item"; item: TreeItem | null }
  | { type: "set_delete_item"; item: TreeItem | null }
  | { type: "set_move_item"; item: TreeItem | null }
  | { type: "set_share_item"; item: TreeItem | null }
  | { type: "set_mobile_open"; open: boolean }
  | { type: "close_mobile" };

function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case "set_rename_item":
      return { ...state, renameItem: action.item };
    case "set_delete_item":
      return { ...state, deleteItem: action.item };
    case "set_move_item":
      return { ...state, moveItem: action.item };
    case "set_share_item":
      return { ...state, shareItem: action.item };
    case "set_mobile_open":
      return { ...state, mobileOpen: action.open };
    case "close_mobile":
      return { ...state, mobileOpen: false };
    default:
      return state;
  }
}

export function DashboardSidebar({ selectedFileId, onFileSelect }: DashboardSidebarProps) {
  const { push } = useRouter();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const prefetchFileContent = usePrefetchFileContent();
  const { data: folders = [], isLoading: foldersLoading } = useFoldersQuery();
  const { data: files = [], isLoading: filesLoading } = useFilesQuery();

  const [sidebarState, dispatch] = useReducer(sidebarReducer, {
    renameItem: null,
    deleteItem: null,
    moveItem: null,
    shareItem: null,
    mobileOpen: false,
  });
  const { exportFolder } = useZipExport();

  const { renameItem, deleteItem, moveItem, shareItem, mobileOpen } = sidebarState;

  const createFileMutation = useCreateFileMutation({
    onSuccess: (file) => {
      onFileSelect(file.id);
      if (isMobile) {
        dispatch({ type: "close_mobile" });
      }
    },
  });
  const createFolderMutation = useCreateFolderMutation();
  const importMarkdownFilesMutation = useImportMarkdownFilesMutation({
    onSuccess: (importedFiles) => {
      if (importedFiles.length !== 1) {
        return;
      }

      onFileSelect(importedFiles[0].id);
      if (isMobile) {
        dispatch({ type: "close_mobile" });
      }
    },
  });
  const moveTreeItemMutation = useMoveTreeItemMutation();
  const renameTreeItemMutation = useRenameTreeItemMutation();
  const deleteTreeItemMutation = useDeleteTreeItemMutation({
    onSuccess: ({ item }) => {
      if (item.type === "file" && selectedFileId === item.id) {
        onFileSelect(null);
        return;
      }

      if (selectedFileId) {
        const currentFiles = queryClient.getQueryData<File[]>(workspaceKeys.files()) ?? [];
        if (!currentFiles.some((file) => file.id === selectedFileId)) {
          onFileSelect(null);
        }
      }
    },
  });
  const { toggle: toggleShareVisibility, isPendingFor: isShareTogglePendingFor } =
    useShareVisibilityActions();

  const isLoading = foldersLoading || filesLoading;
  const treeItems = useMemo(() => buildTree(folders, files), [folders, files]);
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? null;
  const shareFile =
    shareItem?.type === "file" ? (files.find((file) => file.id === shareItem.id) ?? null) : null;
  const shareFolder =
    shareItem?.type === "folder"
      ? (folders.find((folder) => folder.id === shareItem.id) ?? null)
      : null;

  const getFileFromTreeItem = (item: TreeItem) => {
    if (item.type !== "file") {
      return null;
    }

    return files.find((candidate) => candidate.id === item.id) ?? null;
  };

  const handleCreateFile = (folderId: string | null) => {
    createFileMutation.mutate({ folderId });
  };

  const handleCreateFolder = (parentId: string | null) => {
    createFolderMutation.mutate({ parentId });
  };

  const handleImportMarkdownFiles = (
    selection: DroppedImportSelection,
    folderId: string | null,
  ) => {
    if (importMarkdownFilesMutation.isPending) {
      toast.error("Markdown import already in progress");
      return;
    }

    importMarkdownFilesMutation.mutate({ selection, folderId });
  };

  const handleRename = (newName: string) => {
    if (!renameItem) return;
    renameTreeItemMutation.mutate({ item: renameItem, newName });
    dispatch({ type: "set_rename_item", item: null });
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteTreeItemMutation.mutate({ item: deleteItem });
    dispatch({ type: "set_delete_item", item: null });
  };

  const handleTogglePublic = (item: TreeItem) => {
    dispatch({ type: "set_share_item", item });
  };

  const handleDownloadFile = (item: TreeItem) => {
    const file = getFileFromTreeItem(item);
    if (!file) {
      toast.error("File not found");
      return;
    }

    void (async () => {
      try {
        const fullFile = await fetchCachedFileContent(queryClient, file.id);
        downloadMarkdownFile(fullFile.name, fullFile.content ?? "");
        toast.success(`Downloaded "${fullFile.name}"`);
      } catch {
        toast.error("Could not download the markdown file");
      }
    })();
  };

  const handleMoveClick = (item: TreeItem) => {
    dispatch({ type: "set_move_item", item });
  };

  const handleMove = (item: TreeItem, targetFolderId: string | null) => {
    moveTreeItemMutation.mutate(
      { item, targetFolderId },
      {
        onSuccess: () => {
          dispatch({ type: "set_move_item", item: null });
        },
      },
    );
  };

  const handleShareToggle = (isPublic: boolean) => {
    if (shareFile) {
      toggleShareVisibility({ type: "file", file: shareFile, isPublic });
      return;
    }

    if (shareFolder) {
      toggleShareVisibility({ type: "folder", folder: shareFolder, isPublic });
    }
  };

  const handleSelect = (item: TreeItem) => {
    if (item.type !== "file") {
      return;
    }

    onFileSelect(item.id);
    if (isMobile) {
      dispatch({ type: "close_mobile" });
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      push("/auth/login");
    } catch {
      // Even if signOut fails, redirect to login
      push("/auth/login");
    }
  };

  return (
    <>
      <DashboardMobileHeader
        selectedFileName={selectedFile?.name}
        onOpenWorkspace={() => dispatch({ type: "set_mobile_open", open: true })}
        onCreateFile={() => handleCreateFile(null)}
      />

      <Sheet open={mobileOpen} onOpenChange={(open) => dispatch({ type: "set_mobile_open", open })}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="inset-y-0 left-0 right-0 h-full w-auto max-w-none border-r border-sidebar-border/80 p-0 md:hidden"
        >
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse folders and files, then select an item to edit.
          </SheetDescription>
          <DashboardSidebarContent
            isLoading={isLoading}
            treeItems={treeItems}
            selectedFileId={selectedFileId}
            filesCount={files.length}
            showCloseAction
            onClose={() => dispatch({ type: "close_mobile" })}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onImportFiles={handleImportMarkdownFiles}
            isImportingFiles={importMarkdownFilesMutation.isPending}
            onSelect={handleSelect}
            onMove={handleMove}
            onRename={(item) => dispatch({ type: "set_rename_item", item })}
            onDelete={(item) => dispatch({ type: "set_delete_item", item })}
            onMoveClick={handleMoveClick}
            onTogglePublic={handleTogglePublic}
            onDownloadFile={handleDownloadFile}
            onExportFolder={exportFolder}
            onPrefetchFile={prefetchFileContent}
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>

      <aside className="hidden h-full min-h-0 w-[var(--workspace-sidebar-width)] min-w-[var(--workspace-sidebar-width)] overflow-hidden border-r border-sidebar-border/80 bg-sidebar shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] md:flex">
        <DashboardSidebarContent
          isLoading={isLoading}
          treeItems={treeItems}
          selectedFileId={selectedFileId}
          filesCount={files.length}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onImportFiles={handleImportMarkdownFiles}
          isImportingFiles={importMarkdownFilesMutation.isPending}
          onSelect={handleSelect}
          onMove={handleMove}
          onRename={(item) => dispatch({ type: "set_rename_item", item })}
          onDelete={(item) => dispatch({ type: "set_delete_item", item })}
          onMoveClick={handleMoveClick}
          onTogglePublic={handleTogglePublic}
          onDownloadFile={handleDownloadFile}
          onExportFolder={exportFolder}
          onPrefetchFile={prefetchFileContent}
          onSignOut={handleSignOut}
        />
      </aside>

      <DashboardSidebarDialogs
        renameItem={renameItem}
        deleteItem={deleteItem}
        moveItem={moveItem}
        moveFolders={folders}
        isMoving={moveTreeItemMutation.isPending}
        shareItem={shareItem}
        shareFile={shareFile}
        shareFolder={shareFolder}
        isShareTogglePending={shareItem ? isShareTogglePendingFor(shareItem.id) : false}
        onRenameItemChange={(item) => dispatch({ type: "set_rename_item", item })}
        onDeleteItemChange={(item) => dispatch({ type: "set_delete_item", item })}
        onMoveItemChange={(item) => dispatch({ type: "set_move_item", item })}
        onShareItemChange={(item) => dispatch({ type: "set_share_item", item })}
        onRename={handleRename}
        onDelete={handleDelete}
        onMove={(targetFolderId) => handleMove(moveItem!, targetFolderId)}
        onTogglePublic={handleShareToggle}
      />
    </>
  );
}
