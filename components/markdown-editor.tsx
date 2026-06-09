"use client";

import { useCallback, useDeferredValue, useEffect, useReducer, useRef } from "react";
import { ShareDialog } from "@/components/share-dialog";
import { MarkdownEditorHeader, type ViewMode } from "@/components/markdown-editor-header";
import { MarkdownEditorLoading } from "@/components/markdown-editor-loading";
import { MarkdownEditorToolbar } from "@/components/markdown-editor-toolbar";
import { MarkdownEditorWorkspace } from "@/components/markdown-editor-workspace";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarkdownEditorFileDrop } from "@/hooks/use-markdown-editor-file-drop";
import { useUpdateFileMutation } from "@/hooks/workspace/use-file-mutations";
import { useShareVisibilityActions } from "@/hooks/workspace/use-share-visibility-actions";
import { useFileQuery } from "@/hooks/workspace/use-workspace-queries";
import { downloadMarkdownFile } from "@/lib/file-export";
import { toast } from "sonner";

interface MarkdownEditorProps {
  fileId: string;
}

type EditorState = {
  content: string;
  isSaving: boolean;
  hasChanges: boolean;
  viewMode: ViewMode;
  shareOpen: boolean;
};

type EditorAction =
  | { type: "file_loaded"; content: string }
  | { type: "content_changed"; content: string }
  | { type: "saving_started" }
  | { type: "save_succeeded" }
  | { type: "save_failed" }
  | { type: "set_view_mode"; viewMode: ViewMode }
  | { type: "set_share_open"; shareOpen: boolean };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "file_loaded":
      return {
        ...state,
        content: action.content,
        hasChanges: false,
        isSaving: false,
      };
    case "content_changed":
      return {
        ...state,
        content: action.content,
        hasChanges: true,
      };
    case "saving_started":
      return { ...state, isSaving: true };
    case "save_succeeded":
      return { ...state, isSaving: false, hasChanges: false };
    case "save_failed":
      return { ...state, isSaving: false };
    case "set_view_mode":
      return { ...state, viewMode: action.viewMode };
    case "set_share_open":
      return { ...state, shareOpen: action.shareOpen };
    default:
      return state;
  }
}

export function MarkdownEditor({ fileId }: MarkdownEditorProps) {
  const isMobile = useIsMobile();
  const { data: file } = useFileQuery(fileId);

  const [{ content, isSaving, hasChanges, viewMode, shareOpen }, dispatch] = useReducer(
    editorReducer,
    {
      content: "",
      isSaving: false,
      hasChanges: false,
      viewMode: "split",
      shareOpen: false,
    },
  );
  const loadedFileIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deferredPreviewContent = useDeferredValue(content);
  const updateFileMutation = useUpdateFileMutation({
    onSuccess: () => {
      dispatch({ type: "save_succeeded" });
    },
  });
  const { toggle: toggleShareVisibility, isPendingFor: isShareTogglePendingFor } =
    useShareVisibilityActions();

  useEffect(() => {
    loadedFileIdRef.current = null;
  }, [fileId]);

  useEffect(() => {
    if (!file || file.content === undefined) {
      return;
    }

    if (loadedFileIdRef.current === file.id) {
      return;
    }

    loadedFileIdRef.current = file.id;
    dispatch({ type: "file_loaded", content: file.content });
  }, [file]);

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!fileId) return;
      dispatch({ type: "saving_started" });

      try {
        await updateFileMutation.mutateAsync({
          fileId,
          data: { content: newContent },
        });
      } catch {
        dispatch({ type: "save_failed" });
      }
    },
    [fileId, updateFileMutation],
  );

  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveContent(content);
  }, [content, saveContent]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      dispatch({ type: "content_changed", content: newContent });

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveContent(newContent);
      }, 1500);
    },
    [saveContent],
  );

  const {
    isFileDropActive,
    handleFileDragEnter,
    handleFileDragOver,
    handleFileDragLeave,
    handleFileDrop,
  } = useMarkdownEditorFileDrop({
    textareaRef,
    onContentChange: handleContentChange,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    const timeoutRef = saveTimeoutRef;
    return () => {
      const timeoutId = timeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const insertMarkdown = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) + before + selectedText + after + content.substring(end);

    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);

    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleShareToggle = (isPublic: boolean) => {
    if (!file) {
      return;
    }

    toggleShareVisibility({ type: "file", file, isPublic });
  };

  const handleDownloadMarkdown = useCallback(() => {
    if (!file) {
      toast.error("File not found");
      return;
    }

    try {
      downloadMarkdownFile(file.name, content);
      toast.success(`Downloaded "${file.name}"`);
    } catch {
      toast.error("Could not download the markdown file");
    }
  }, [content, file]);

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        File not found
      </div>
    );
  }

  if (file.content === undefined) {
    return <MarkdownEditorLoading />;
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-x-hidden">
      <MarkdownEditorHeader
        fileName={file.name}
        isSaving={isSaving}
        hasChanges={hasChanges}
        viewMode={viewMode}
        onViewModeChange={(nextViewMode) =>
          dispatch({ type: "set_view_mode", viewMode: nextViewMode })
        }
        onShare={() => dispatch({ type: "set_share_open", shareOpen: true })}
        onDownload={handleDownloadMarkdown}
        onSave={handleSave}
      />

      {viewMode !== "preview" && (
        <MarkdownEditorToolbar onWrap={insertMarkdown} onLinePrefix={insertAtLineStart} />
      )}

      <MarkdownEditorWorkspace
        viewMode={viewMode}
        isMobile={isMobile}
        isFileDropActive={isFileDropActive}
        content={content}
        previewContent={deferredPreviewContent}
        textareaRef={textareaRef}
        onContentChange={handleContentChange}
        onDragEnter={handleFileDragEnter}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      />

      <ShareDialog
        open={shareOpen}
        onOpenChange={(nextShareOpen) =>
          dispatch({ type: "set_share_open", shareOpen: nextShareOpen })
        }
        itemName={file.name}
        itemType="file"
        isPublic={file.is_public}
        slug={file.slug}
        isPending={isShareTogglePendingFor(file.id)}
        onTogglePublic={handleShareToggle}
      />
    </div>
  );
}
