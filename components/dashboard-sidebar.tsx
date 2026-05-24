"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DashboardMobileHeader } from "@/components/dashboard-mobile-header";
import { DashboardSidebarContent } from "@/components/dashboard-sidebar-content";
import { DashboardSidebarDialogs } from "@/components/dashboard-sidebar-dialogs";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useCreateFileMutation,
  useImportMarkdownFilesMutation,
  useToggleFilePublicMutation,
} from "@/hooks/workspace/use-file-mutations";
import {
  useCreateFolderMutation,
  useToggleFolderPublicMutation,
} from "@/hooks/workspace/use-folder-mutations";
import {
  useDeleteTreeItemMutation,
  useMoveTreeItemMutation,
  useRenameTreeItemMutation,
} from "@/hooks/workspace/use-tree-item-mutations";
import { useFilesQuery, useFoldersQuery } from "@/hooks/workspace/use-workspace-queries";
import { downloadMarkdownFile } from "@/lib/file-export";
import { useZipExport } from "@/hooks/use-zip-export";
import { createClient } from "@/lib/supabase/client";
import type { File, Folder, TreeItem } from "@/lib/types";
import { buildTree } from "@/lib/workspace-tree";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardSidebarProps {
  selectedFileId: string | null;
  onFileSelect: (fileId: string | null) => void;
}

export function DashboardSidebar({ selectedFileId, onFileSelect }: DashboardSidebarProps) {
  const { push } = useRouter();
  const isMobile = useIsMobile();
  const { data: folders = [], isLoading: foldersLoading } = useFoldersQuery();
  const { data: files = [], isLoading: filesLoading } = useFilesQuery();

  const [renameItem, setRenameItem] = useState<TreeItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<TreeItem | null>(null);
  const [moveItem, setMoveItem] = useState<TreeItem | null>(null);
  const [shareItem, setShareItem] = useState<TreeItem | null>(null);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [shareFolder, setShareFolder] = useState<Folder | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { exportFolder } = useZipExport();

  const createFileMutation = useCreateFileMutation({
    onSuccess: (file) => {
      onFileSelect(file.id);
      if (isMobile) {
        setMobileOpen(false);
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
        setMobileOpen(false);
      }
    },
  });
  const moveTreeItemMutation = useMoveTreeItemMutation();
  const renameTreeItemMutation = useRenameTreeItemMutation();
  const deleteTreeItemMutation = useDeleteTreeItemMutation({
    onSuccess: ({ item }) => {
      if (item.type === "file" && selectedFileId === item.id) {
        onFileSelect(null);
      }
    },
  });
  const toggleFilePublicMutation = useToggleFilePublicMutation();
  const toggleFolderPublicMutation = useToggleFolderPublicMutation();

  const isLoading = foldersLoading || filesLoading;
  const treeItems = useMemo(() => buildTree(folders, files), [folders, files]);
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? null;

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
    importedFiles: globalThis.File[],
    folderId: string | null,
    items?: DataTransferItemList,
  ) => {
    if (importMarkdownFilesMutation.isPending) {
      toast.error("Markdown import already in progress");
      return;
    }

    importMarkdownFilesMutation.mutate({ files: importedFiles, folderId, items });
  };

  const handleRename = (newName: string) => {
    if (!renameItem) return;
    renameTreeItemMutation.mutate({ item: renameItem, newName });
    setRenameItem(null);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteTreeItemMutation.mutate({ item: deleteItem });
    setDeleteItem(null);
  };

  const handleTogglePublic = (item: TreeItem) => {
    setShareItem(item);

    if (item.type === "file") {
      const file = getFileFromTreeItem(item);
      if (!file) {
        setShareItem(null);
        return;
      }

      setShareFile(file);
      setShareFolder(null);
      return;
    }

    const folder = folders.find((candidate) => candidate.id === item.id);
    if (!folder) {
      setShareItem(null);
      return;
    }

    setShareFile(null);
    setShareFolder(folder);
  };

  const handleDownloadFile = (item: TreeItem) => {
    const file = getFileFromTreeItem(item);
    if (!file) {
      toast.error("File not found");
      return;
    }

    try {
      downloadMarkdownFile(file.name, file.content);
      toast.success(`Downloaded "${file.name}"`);
    } catch {
      toast.error("Could not download the markdown file");
    }
  };

  const handleMoveClick = (item: TreeItem) => {
    setMoveItem(item);
  };

  const handleMove = (item: TreeItem, targetFolderId: string | null) => {
    moveTreeItemMutation.mutate(
      { item, targetFolderId },
      {
        onSuccess: () => {
          setMoveItem(null);
        },
      },
    );
  };

  const handleShareToggle = (isPublic: boolean) => {
    if (shareFile) {
      toggleFilePublicMutation.mutate(
        { file: shareFile, isPublic },
        {
          onSuccess: (updated) => {
            setShareFile(updated);
          },
        },
      );
      return;
    }

    if (!shareFolder) return;

    toggleFolderPublicMutation.mutate(
      { folder: shareFolder, isPublic },
      {
        onSuccess: (updated) => {
          setShareFolder(updated);
        },
      },
    );
  };

  const handleSelect = (item: TreeItem) => {
    if (item.type !== "file") {
      return;
    }

    onFileSelect(item.id);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
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
        onOpenWorkspace={() => setMobileOpen(true)}
        onCreateFile={() => handleCreateFile(null)}
      />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
            onClose={() => setMobileOpen(false)}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onImportFiles={handleImportMarkdownFiles}
            isImportingFiles={importMarkdownFilesMutation.isPending}
            onSelect={handleSelect}
            onMove={handleMove}
            onRename={setRenameItem}
            onDelete={setDeleteItem}
            onMoveClick={handleMoveClick}
            onTogglePublic={handleTogglePublic}
            onDownloadFile={handleDownloadFile}
            onExportFolder={exportFolder}
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
          onRename={setRenameItem}
          onDelete={setDeleteItem}
          onMoveClick={handleMoveClick}
          onTogglePublic={handleTogglePublic}
          onDownloadFile={handleDownloadFile}
          onExportFolder={exportFolder}
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
        onRenameItemChange={setRenameItem}
        onDeleteItemChange={setDeleteItem}
        onMoveItemChange={setMoveItem}
        onShareStateChange={(item, file, folder) => {
          setShareItem(item);
          setShareFile(file);
          setShareFolder(folder);
        }}
        onRename={handleRename}
        onDelete={handleDelete}
        onMove={(targetFolderId) => handleMove(moveItem!, targetFolderId)}
        onTogglePublic={handleShareToggle}
      />
    </>
  );
}
