"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bold,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Heading1,
  Italic,
  List,
  Menu,
  PencilLine,
  Share2,
  X,
} from "lucide-react";
import { type ReactNode, useDeferredValue, useMemo, useReducer, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BrowserFrame } from "@/components/landing-page-browser-frame";
import { cn } from "@/lib/utils";

type WorkspaceFile = {
  id: string;
  name: string;
  content: string;
  folderId: string | null;
};

type WorkspaceFolder = {
  id: string;
  name: string;
  isOpen: boolean;
};

type WorkspaceState = {
  activeFileId: string;
  activeFolderId: string | null;
  files: WorkspaceFile[];
  folders: WorkspaceFolder[];
};

type WorkspaceAction =
  | { type: "select_file"; fileId: string }
  | { type: "select_folder"; folderId: string }
  | { type: "toggle_folder"; folderId: string }
  | { type: "update_content"; fileId: string; content: string }
  | { type: "create_file" }
  | { type: "create_folder" };

const initialWorkspace: WorkspaceState = {
  activeFileId: "welcome",
  activeFolderId: null,
  folders: [
    { id: "projects", name: "Projects", isOpen: true },
    { id: "reference", name: "Reference", isOpen: true },
  ],
  files: [
    {
      id: "welcome",
      name: "welcome.md",
      folderId: null,
      content: `# A calmer place to think

Write the first rough version. **Inkdown keeps the structure clear** while you work.

## A working rhythm

- Capture the thought
- Shape it with Markdown
- Share it when it is ready`,
    },
    {
      id: "roadmap",
      name: "roadmap.md",
      folderId: "projects",
      content: `# Product roadmap

## This week

- [x] Live Markdown preview
- [ ] Folder templates
- [ ] Publish a project brief`,
    },
    {
      id: "reading-list",
      name: "reading-list.md",
      folderId: "reference",
      content: `# Reading list

> Keep the useful material close to the work.

1. A short essay on clear writing
2. Research notes for the next project`,
    },
  ],
};

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "select_file": {
      const selectedFile = state.files.find((file) => file.id === action.fileId);

      if (!selectedFile) {
        return state;
      }

      return {
        ...state,
        activeFileId: selectedFile.id,
        activeFolderId: selectedFile.folderId,
      };
    }
    case "select_folder":
      return { ...state, activeFolderId: action.folderId };
    case "toggle_folder":
      return {
        ...state,
        activeFolderId: action.folderId,
        folders: state.folders.map((folder) =>
          folder.id === action.folderId ? { ...folder, isOpen: !folder.isOpen } : folder,
        ),
      };
    case "update_content":
      return {
        ...state,
        files: state.files.map((file) =>
          file.id === action.fileId ? { ...file, content: action.content } : file,
        ),
      };
    case "create_file": {
      const number = state.files.filter((file) => file.name.startsWith("untitled")).length + 1;
      const id = `untitled-${number}`;
      const name = number === 1 ? "untitled.md" : `untitled-${number}.md`;

      return {
        ...state,
        activeFileId: id,
        folders: state.folders.map((folder) =>
          folder.id === state.activeFolderId ? { ...folder, isOpen: true } : folder,
        ),
        files: [
          ...state.files,
          {
            id,
            name,
            folderId: state.activeFolderId,
            content: "# Untitled\n\nStart writing here.",
          },
        ],
      };
    }
    case "create_folder": {
      const number =
        state.folders.filter((folder) => folder.name.startsWith("New folder")).length + 1;
      const id = `folder-${number}`;
      const name = number === 1 ? "New folder" : `New folder ${number}`;

      return {
        ...state,
        activeFolderId: id,
        folders: [...state.folders, { id, name, isOpen: true }],
      };
    }
    default:
      return state;
  }
}

const toolbarActions: Array<{
  label: string;
  icon: LucideIcon;
  type: "wrap" | "line";
  before: string;
  after?: string;
}> = [
  { label: "Bold", icon: Bold, type: "wrap", before: "**", after: "**" },
  { label: "Italic", icon: Italic, type: "wrap", before: "_", after: "_" },
  { label: "Heading", icon: Heading1, type: "line", before: "# " },
  { label: "List", icon: List, type: "line", before: "- " },
];

interface EditorMockupProps {
  url?: string;
  className?: string;
}

export function LandingPageEditorMockup({ url, className }: EditorMockupProps) {
  const [workspace, dispatch] = useReducer(workspaceReducer, initialWorkspace);
  const [viewMode, setViewMode] = useState<"split" | "write" | "preview">("split");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeFile =
    workspace.files.find((file) => file.id === workspace.activeFileId) ?? workspace.files[0];
  const previewContent = useDeferredValue(activeFile.content);
  const previewElement = useMemo(
    () => <ReactMarkdown>{previewContent}</ReactMarkdown>,
    [previewContent],
  );
  const sourceLines = activeFile.content.split("\n");
  const shareUrl = `inkdown.shubhojeet.com/view/${activeFile.name.replace(/\.md$/u, "")}`;

  const focusEditor = () => {
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleCreateFile = () => {
    dispatch({ type: "create_file" });
    setIsSidebarOpen(false);
    focusEditor();
  };

  const applyMarkdown = (action: (typeof toolbarActions)[number]) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = activeFile.content;
    let nextContent = content;
    let cursorPosition = start;

    if (action.type === "line") {
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      nextContent = `${content.slice(0, lineStart)}${action.before}${content.slice(lineStart)}`;
      cursorPosition = start + action.before.length;
    } else {
      const selectedText = content.slice(start, end);
      const suffix = action.after ?? "";
      nextContent = `${content.slice(0, start)}${action.before}${selectedText}${suffix}${content.slice(end)}`;
      cursorPosition = start + action.before.length + selectedText.length;
    }

    dispatch({ type: "update_content", fileId: activeFile.id, content: nextContent });
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard?.writeText(`https://${shareUrl}`);
    } catch {
      // The interaction remains useful in browsers that deny clipboard access.
    }

    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1400);
  };

  return (
    <BrowserFrame url={url ?? "inkdown.shubhojeet.com"} className={className}>
      <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
        <WorkspaceSidebar
          workspace={workspace}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCreateFile={handleCreateFile}
          onCreateFolder={() => dispatch({ type: "create_folder" })}
          onSelectFile={(fileId) => {
            dispatch({ type: "select_file", fileId });
            setIsSidebarOpen(false);
          }}
          onSelectFolder={(folderId) => dispatch({ type: "select_folder", folderId })}
          onToggleFolder={(folderId) => dispatch({ type: "toggle_folder", folderId })}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          <header className="flex min-h-10 items-center gap-1.5 border-b px-2 sm:px-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
              aria-label="Open files"
            >
              <Menu className="size-3.5" />
            </button>
            <FileText className="hidden size-3.5 text-primary sm:block" />
            <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground sm:text-xs">
              {activeFile.name}
            </span>
            <div className="flex gap-1 rounded-md bg-muted/60 p-0.5" aria-label="View mode">
              <ViewModeButton
                active={viewMode === "write"}
                label="Write"
                onClick={() => setViewMode("write")}
              >
                <PencilLine className="size-3" />
              </ViewModeButton>
              <ViewModeButton
                active={viewMode === "split"}
                label="Split view"
                onClick={() => setViewMode("split")}
              >
                <span className="grid w-3 grid-cols-2 gap-px">
                  <span className="h-3 rounded-[1px] bg-current" />
                  <span className="h-3 rounded-[1px] bg-current" />
                </span>
              </ViewModeButton>
              <ViewModeButton
                active={viewMode === "preview"}
                label="Preview"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="size-3" />
              </ViewModeButton>
            </div>
            <button
              type="button"
              onClick={() => setIsShareOpen((open) => !open)}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Share file"
              aria-expanded={isShareOpen}
            >
              <Share2 className="size-3.5" />
            </button>
          </header>

          <div className={cn("flex min-h-0 flex-1", viewMode === "split" && "max-sm:flex-col")}>
            <section
              className={cn(
                "flex min-w-0 flex-1 flex-col bg-muted/[0.16]",
                viewMode === "preview" && "hidden",
              )}
              aria-label="Markdown editor"
            >
              <div className="flex h-8 items-center justify-between border-b px-2 sm:px-3">
                <span className="text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                  Write
                </span>
                <div className="flex items-center gap-0.5">
                  {toolbarActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => applyMarkdown(action)}
                        className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        title={action.label}
                        aria-label={action.label}
                      >
                        <Icon className="size-3 sm:size-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex min-h-0 flex-1 overflow-hidden py-2 sm:py-3">
                <ol
                  aria-hidden="true"
                  className="w-6 shrink-0 select-none overflow-hidden pr-1 text-right font-mono text-[9px] leading-5 text-muted-foreground/60 sm:w-8 sm:pr-2 sm:text-[10px] sm:leading-6"
                >
                  {sourceLines.map((_, index) => (
                    <li key={index}>{index + 1}</li>
                  ))}
                </ol>
                <textarea
                  ref={textareaRef}
                  value={activeFile.content}
                  onChange={(event) =>
                    dispatch({
                      type: "update_content",
                      fileId: activeFile.id,
                      content: event.target.value,
                    })
                  }
                  onFocus={() => setViewMode((mode) => (mode === "preview" ? "split" : mode))}
                  className="min-h-0 min-w-0 flex-1 resize-none overflow-auto bg-transparent pr-2 font-mono text-[9px] leading-5 text-foreground outline-none placeholder:text-muted-foreground sm:pr-3 sm:text-[10px] sm:leading-6"
                  spellCheck={false}
                  wrap="off"
                  aria-label={`Edit ${activeFile.name}`}
                />
              </div>
            </section>

            <section
              className={cn(
                "min-w-0 flex-1 border-l bg-background",
                viewMode === "write" && "hidden",
                viewMode === "split" && "max-sm:border-l-0 max-sm:border-t",
              )}
              aria-label="Live Markdown preview"
            >
              <div className="flex h-8 items-center justify-between border-b px-2 sm:px-3">
                <span className="text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                  Preview
                </span>
                <span className="text-[9px] font-medium text-primary sm:text-[10px]">Live</span>
              </div>
              <div className="h-[calc(100%-2rem)] overflow-auto p-2.5 text-[10px] leading-relaxed text-muted-foreground sm:p-3 sm:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-2 [&_blockquote]:italic [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_p]:mb-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 sm:[&_h1]:text-lg sm:[&_h2]:text-sm">
                {previewElement}
              </div>
            </section>
          </div>
        </main>

        {isShareOpen ? (
          <div className="absolute right-2 top-12 z-30 w-52 rounded-lg border bg-popover p-2.5 shadow-xl shadow-black/10 sm:right-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-foreground">Share this file</span>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close share menu"
              >
                <X className="size-3" />
              </button>
            </div>
            <p className="truncate rounded-md bg-muted px-2 py-1.5 font-mono text-[9px] text-muted-foreground">
              {shareUrl}
            </p>
            <button
              type="button"
              onClick={copyShareLink}
              className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {isCopied ? "Copied" : "Copy link"}
            </button>
          </div>
        ) : null}
      </div>
    </BrowserFrame>
  );
}

function WorkspaceSidebar({
  workspace,
  isOpen,
  onClose,
  onCreateFile,
  onCreateFolder,
  onSelectFile,
  onSelectFolder,
  onToggleFolder,
}: {
  workspace: WorkspaceState;
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onSelectFile: (fileId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
}) {
  const rootFiles = workspace.files.filter((file) => file.folderId === null);

  return (
    <aside
      className={cn(
        "absolute inset-y-0 left-0 z-20 flex w-44 -translate-x-full flex-col border-r bg-background/95 p-2.5 shadow-xl shadow-black/10 backdrop-blur transition-transform duration-200 ease-out sm:static sm:w-40 sm:translate-x-0 sm:bg-muted/30 sm:shadow-none sm:backdrop-blur-none",
        isOpen && "translate-x-0",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b pb-2 sm:border-none sm:pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded bg-primary text-primary-foreground">
            <FileText className="size-3" />
          </span>
          <span className="text-[10px] font-semibold text-foreground sm:text-xs">Inkdown</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
          aria-label="Close files"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={onCreateFile}
          className="inline-flex h-6 flex-1 items-center justify-center gap-1 rounded bg-primary px-1.5 text-[9px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:text-[10px]"
        >
          <FilePlus2 className="size-3" />
          File
        </button>
        <button
          type="button"
          onClick={onCreateFolder}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Create folder"
          title="Create folder"
        >
          <FolderPlus className="size-3.5" />
        </button>
      </div>

      <nav aria-label="Workspace files" className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-auto">
        {rootFiles.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            isActive={workspace.activeFileId === file.id}
            onClick={() => onSelectFile(file.id)}
          />
        ))}
        {workspace.folders.map((folder) => {
          const folderFiles = workspace.files.filter((file) => file.folderId === folder.id);
          const isSelected = workspace.activeFolderId === folder.id;

          return (
            <div key={folder.id} className="pt-1">
              <div className="flex min-w-0 items-center">
                <button
                  type="button"
                  onClick={() => onToggleFolder(folder.id)}
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isSelected && "text-primary",
                  )}
                  aria-label={`${folder.isOpen ? "Collapse" : "Expand"} ${folder.name}`}
                >
                  {folder.isOpen ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectFolder(folder.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[10px] transition-colors hover:bg-muted sm:text-xs",
                    isSelected && "bg-accent font-medium text-foreground",
                  )}
                >
                  {folder.isOpen ? (
                    <FolderOpen className="size-3.5 shrink-0 text-primary" />
                  ) : (
                    <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{folder.name}</span>
                </button>
              </div>
              {folder.isOpen ? (
                <div className="ml-5 border-l border-border/80 pl-1.5">
                  {folderFiles.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      isActive={workspace.activeFileId === file.id}
                      onClick={() => onSelectFile(file.id)}
                      nested
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function FileRow({
  file,
  isActive,
  nested = false,
  onClick,
}: {
  file: WorkspaceFile;
  isActive: boolean;
  nested?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-6 w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[10px] transition-colors hover:bg-muted sm:text-xs",
        nested && "px-1",
        isActive && "bg-accent font-medium text-foreground",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <FileText
        className={cn("size-3.5 shrink-0 text-muted-foreground", isActive && "text-primary")}
      />
      <span className="truncate">{file.name}</span>
    </button>
  );
}

function ViewModeButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground",
        active && "bg-background text-foreground shadow-sm",
      )}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
