"use client";

import { type DragEvent, useCallback, useRef, useState } from "react";
import { toast } from "sonner";

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

interface UseMarkdownEditorFileDropOptions {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (content: string) => void;
}

export function useMarkdownEditorFileDrop({
  textareaRef,
  onContentChange,
}: UseMarkdownEditorFileDropOptions) {
  const [isFileDropActive, setIsFileDropActive] = useState(false);
  const fileDragDepthRef = useRef(0);

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

  const handleFileDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    fileDragDepthRef.current = Math.max(fileDragDepthRef.current - 1, 0);
    if (fileDragDepthRef.current === 0) {
      setIsFileDropActive(false);
    }
  }, []);

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
        onContentChange(droppedContent);
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
    [onContentChange, resetFileDropState, textareaRef],
  );

  return {
    isFileDropActive,
    handleFileDragEnter,
    handleFileDragOver,
    handleFileDragLeave,
    handleFileDrop,
  };
}
