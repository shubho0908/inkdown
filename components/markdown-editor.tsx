"use client";

import {
  type DragEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { ShareDialog } from "@/components/share-dialog";
import {
  MarkdownEditorHeader,
  type ViewMode,
} from "@/components/markdown-editor-header";
import { MarkdownEditorLoading } from "@/components/markdown-editor-loading";
import { MarkdownEditorToolbar } from "@/components/markdown-editor-toolbar";
import { MarkdownPreview } from "@/components/markdown-preview";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useToggleFilePublicMutation,
  useUpdateFileMutation,
} from "@/hooks/workspace/use-file-mutations";
import { useFileQuery } from "@/hooks/workspace/use-workspace-queries";
import { downloadMarkdownFile } from "@/lib/file-export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MarkdownEditorProps {
  fileId: string;
}

const hasDraggedFiles = (dataTransfer: DataTransfer) =>
  Array.from(dataTransfer.items).some((item) => item.kind === "file");

const getDroppedMarkdownFile = (files: FileList) => {
  if (files.length !== 1) {
    return { error: "Drop a single .md file into the editor." } as const;
  }

  const [file] = Array.from(files);
  if (!file.name.toLowerCase().endsWith(".md")) {
    return { error: "Only .md files can be dropped into the editor." } as const;
  }

  return { file } as const;
};

export function MarkdownEditor({ fileId }: MarkdownEditorProps) {
  const isMobile = useIsMobile();
  const { data: file, isLoading } = useFileQuery(fileId);

  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFileDropActive, setIsFileDropActive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [shareOpen, setShareOpen] = useState(false);
  const [prevFileId, setPrevFileId] = useState<string | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileDragDepthRef = useRef(0);
  const deferredPreviewContent = useDeferredValue(content);
  const updateFileMutation = useUpdateFileMutation({
    onSuccess: () => {
      setHasChanges(false);
      setIsSaving(false);
    },
  });
  const toggleFilePublicMutation = useToggleFilePublicMutation();

  // Sync editor content when the loaded file changes.
  // Using React's "storing information from previous renders" pattern instead of
  // useEffect so that state is updated in the same render pass rather than
  // causing a cascading second render via an effect.
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (file?.id !== prevFileId) {
    setPrevFileId(file?.id);
    if (file) {
      setContent(file.content);
      setHasChanges(false);
    }
  }

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!fileId) return;
      setIsSaving(true);

      try {
        await updateFileMutation.mutateAsync({
          fileId,
          data: { content: newContent },
        });
      } catch {
        setIsSaving(false);
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
      setContent(newContent);
      setHasChanges(true);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveContent(newContent);
      }, 1500);
    },
    [saveContent],
  );

  const resetFileDropState = useCallback(() => {
    fileDragDepthRef.current = 0;
    setIsFileDropActive(false);
  }, []);

  const handleFileDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    fileDragDepthRef.current += 1;
    setIsFileDropActive(true);
  }, []);

  const handleFileDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsFileDropActive(true);
  }, []);

  const handleFileDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      fileDragDepthRef.current = Math.max(fileDragDepthRef.current - 1, 0);
      if (fileDragDepthRef.current === 0) {
        setIsFileDropActive(false);
      }
    },
    [],
  );

  const handleFileDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      resetFileDropState();

      const result = getDroppedMarkdownFile(event.dataTransfer.files);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      try {
        const droppedContent = await result.file.text();
        handleContentChange(droppedContent);
        toast.success(`Loaded "${result.file.name}" into the editor`);

        requestAnimationFrame(() => {
          const textarea = textareaRef.current;
          if (!textarea) return;

          textarea.focus();
          const cursorPosition = droppedContent.length;
          textarea.setSelectionRange(cursorPosition, cursorPosition);
        });
      } catch {
        toast.error("Could not read the dropped markdown file");
      }
    },
    [handleContentChange, resetFileDropState],
  );

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
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
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
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

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
    const newContent =
      content.substring(0, lineStart) + prefix + content.substring(lineStart);

    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleShareToggle = async (isPublic: boolean) => {
    if (!file) return;
    await toggleFilePublicMutation.mutateAsync({ file, isPublic });
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

  if (isLoading) {
    return <MarkdownEditorLoading />;
  }

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        File not found
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-x-hidden">
      <MarkdownEditorHeader
        fileName={file.name}
        isSaving={isSaving}
        hasChanges={hasChanges}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onShare={() => setShareOpen(true)}
        onDownload={handleDownloadMarkdown}
        onSave={handleSave}
      />

      {viewMode !== "preview" && (
        <MarkdownEditorToolbar
          onWrap={insertMarkdown}
          onLinePrefix={insertAtLineStart}
        />
      )}

      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 overflow-hidden",
          viewMode === "split" && isMobile ? "flex-col" : "flex-row",
        )}
        onDragEnter={handleFileDragEnter}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      >
        {isFileDropActive && (
          <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-xl border border-dashed border-primary/40 bg-background/95 px-6 text-center text-sm font-medium text-foreground shadow-sm">
            Drop a single .md file to replace the current editor content
          </div>
        )}

        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background",
              viewMode === "split"
                ? cn("flex-1 basis-1/2", isMobile ? "border-b" : "border-r")
                : "w-full",
            )}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => handleContentChange(event.target.value)}
              className="min-h-0 w-full flex-1 resize-none overflow-x-hidden bg-background p-4 font-mono text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere] focus:outline-none sm:p-6"
              placeholder="Start writing markdown..."
              spellCheck={false}
              wrap="soft"
            />
          </div>
        )}

        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
              viewMode === "split" ? "flex-1 basis-1/2" : "w-full",
            )}
          >
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
              <MarkdownPreview content={deferredPreviewContent} />
            </div>
          </div>
        )}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        itemName={file.name}
        itemType="file"
        isPublic={file.is_public}
        slug={file.slug}
        onTogglePublic={handleShareToggle}
      />
    </div>
  );
}
