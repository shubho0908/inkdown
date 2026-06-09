"use client";

import { type RefObject } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { type ViewMode } from "@/components/markdown-editor-header";
import { cn } from "@/lib/utils";

interface MarkdownEditorWorkspaceProps {
  viewMode: ViewMode;
  isMobile: boolean;
  isFileDropActive: boolean;
  content: string;
  previewContent: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onContentChange: (content: string) => void;
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function MarkdownEditorWorkspace({
  viewMode,
  isMobile,
  isFileDropActive,
  content,
  previewContent,
  textareaRef,
  onContentChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: MarkdownEditorWorkspaceProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 overflow-hidden",
        viewMode === "split" && isMobile ? "flex-col" : "flex-row",
      )}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
            onChange={(event) => onContentChange(event.target.value)}
            className="min-h-0 w-full flex-1 resize-none overflow-x-hidden bg-background p-4 font-mono text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere] focus:outline-none sm:p-6"
            placeholder="Start writing markdown..."
            aria-label="Markdown editor"
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
            <MarkdownPreview content={previewContent} />
          </div>
        </div>
      )}
    </div>
  );
}
