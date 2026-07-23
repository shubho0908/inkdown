import { ChevronRight, FileText, Folder, FolderOpen, Search } from "lucide-react";
import { BrowserFrame } from "@/components/landing-page-browser-frame";

interface SourceLine {
  num: number;
  parts: { text: string; color: string }[];
}

interface Sample {
  fileName: string;
  sourceLines: SourceLine[];
  preview: React.ReactNode;
}

const samples: Record<"welcome" | "roadmap", Sample> = {
  welcome: {
    fileName: "welcome.md",
    sourceLines: [
      { num: 1, parts: [{ text: "# Welcome", color: "text-indigo-600 dark:text-indigo-400" }] },
      { num: 2, parts: [] },
      {
        num: 3,
        parts: [
          { text: "Inkdown is a ", color: "text-foreground" },
          { text: "**self-hosted markdown workspace**", color: "text-foreground font-bold" },
          { text: ".", color: "text-foreground" },
        ],
      },
      { num: 4, parts: [] },
      {
        num: 5,
        parts: [{ text: "## Features", color: "text-indigo-600 dark:text-indigo-400" }],
      },
      { num: 6, parts: [] },
      {
        num: 7,
        parts: [
          { text: "- ", color: "text-foreground" },
          { text: "Live preview", color: "text-emerald-700 dark:text-emerald-300 font-semibold" },
        ],
      },
      {
        num: 8,
        parts: [
          { text: "- ", color: "text-foreground" },
          {
            text: "Folder organization",
            color: "text-emerald-700 dark:text-emerald-300 font-semibold",
          },
        ],
      },
      {
        num: 9,
        parts: [
          { text: "- ", color: "text-foreground" },
          { text: "Public links", color: "text-emerald-700 dark:text-emerald-300 font-semibold" },
        ],
      },
      { num: 10, parts: [] },
      {
        num: 11,
        parts: [
          { text: "```bash", color: "text-rose-600 dark:text-rose-400" },
          { text: "npm install inkdown", color: "text-foreground" },
          { text: "```", color: "text-rose-600 dark:text-rose-400" },
        ],
      },
    ],
    preview: (
      <>
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Welcome</h1>
        <p className="mt-2 text-muted-foreground">
          Inkdown is a <strong className="text-foreground">self-hosted markdown workspace</strong>.
        </p>
        <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">Features</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">Live preview</span>
          </li>
          <li>
            <span className="font-semibold text-foreground">Folder organization</span>
          </li>
          <li>
            <span className="font-semibold text-foreground">Public links</span>
          </li>
        </ul>
        <div className="mt-4 overflow-hidden rounded-md bg-muted/50 p-2.5 font-mono text-[10px] sm:text-xs">
          npm install inkdown
        </div>
      </>
    ),
  },
  roadmap: {
    fileName: "roadmap.md",
    sourceLines: [
      {
        num: 1,
        parts: [{ text: "# Product Roadmap", color: "text-indigo-600 dark:text-indigo-400" }],
      },
      { num: 2, parts: [] },
      {
        num: 3,
        parts: [
          {
            text: "A self-hosted markdown workspace for writing.",
            color: "text-foreground",
          },
        ],
      },
      { num: 4, parts: [] },
      {
        num: 5,
        parts: [{ text: "## Core features", color: "text-indigo-600 dark:text-indigo-400" }],
      },
      { num: 6, parts: [] },
      {
        num: 7,
        parts: [
          { text: "- ", color: "text-foreground" },
          {
            text: "Live split preview",
            color: "text-emerald-700 dark:text-emerald-300 font-semibold",
          },
        ],
      },
      {
        num: 8,
        parts: [
          { text: "- ", color: "text-foreground" },
          {
            text: "Folder organization",
            color: "text-emerald-700 dark:text-emerald-300 font-semibold",
          },
        ],
      },
      {
        num: 9,
        parts: [
          { text: "- ", color: "text-foreground" },
          {
            text: "One-click public links",
            color: "text-emerald-700 dark:text-emerald-300 font-semibold",
          },
        ],
      },
      { num: 10, parts: [] },
      {
        num: 11,
        parts: [
          { text: "```bash", color: "text-rose-600 dark:text-rose-400" },
          { text: "bun install && bun run dev", color: "text-foreground" },
          { text: "```", color: "text-rose-600 dark:text-rose-400" },
        ],
      },
    ],
    preview: (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Product Roadmap
        </h1>
        <p className="mt-4 text-muted-foreground">
          A self-hosted markdown workspace for focused writing, organizing, and sharing.
        </p>
        <h2 className="mt-6 text-lg font-semibold tracking-tight text-foreground">Core features</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">Live split preview</span> keeps source
            and output side by side.
          </li>
          <li>
            <span className="font-semibold text-foreground">Folder organization</span> scales from
            notes to wikis.
          </li>
          <li>
            <span className="font-semibold text-foreground">One-click public links</span> share
            documents instantly.
          </li>
        </ul>
        <div className="mt-6 overflow-hidden rounded-lg bg-muted/50 p-3 font-mono text-[10px] sm:text-xs">
          bun install && bun run dev
        </div>
      </>
    ),
  },
};

function Sidebar({ activeFile }: { activeFile: string }) {
  const file = (name: string) => (
    <div
      className={`flex items-center gap-2 ${activeFile === name ? "rounded-md bg-accent px-2 py-1.5" : "px-2 py-1.5"}`}
    >
      <FileText
        className={`size-3.5 ${activeFile === name ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`}
      />
      <span className={`truncate text-xs ${activeFile === name ? "font-medium" : ""}`}>{name}</span>
    </div>
  );

  return (
    <aside className="hidden w-40 flex-col border-r bg-muted/30 p-3 sm:flex">
      <div className="flex items-center gap-2 pb-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-indigo-600 text-white">
          <FileText className="size-3.5" />
        </div>
        <span className="text-xs font-semibold">Inkdown</span>
      </div>
      <div className="relative">
        <Search className="absolute left-2 top-1.5 size-3 text-muted-foreground" />
        <div className="h-6 rounded-md bg-background pl-7 text-xs leading-6 text-muted-foreground">
          Search notes...
        </div>
      </div>
      <div className="mt-4 space-y-1">
        {activeFile === "welcome.md" ? (
          file("welcome.md")
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <FileText className="size-3.5 text-muted-foreground" />
            <span className="truncate text-xs">welcome.md</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md bg-accent px-2 py-1.5">
          <FolderOpen className="size-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="truncate text-xs font-medium">Projects</span>
        </div>
        <div className="flex items-center gap-2 pl-6">
          {activeFile === "roadmap.md" ? (
            <>
              <FileText className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate text-xs font-medium">roadmap.md</span>
              <span className="ml-auto size-1.5 rounded-full bg-emerald-600 animate-pulse" />
            </>
          ) : (
            <>
              <FileText className="size-3.5 text-muted-foreground" />
              <span className="truncate text-xs">roadmap.md</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 pl-6">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="truncate text-xs">notes.md</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <ChevronRight className="size-3.5 text-muted-foreground" />
          <Folder className="size-3.5 text-muted-foreground" />
          <span className="truncate text-xs">Archive</span>
        </div>
      </div>
    </aside>
  );
}

interface EditorMockupProps {
  sample: "welcome" | "roadmap";
  url?: string;
  className?: string;
}

export function LandingPageEditorMockup({ sample, url, className }: EditorMockupProps) {
  const { fileName, sourceLines, preview } = samples[sample];
  const nextLine = sourceLines.length + 1;

  return (
    <BrowserFrame url={url ?? "inkdown.shubhojeet.com"} className={className}>
      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar activeFile={fileName} />
        <main className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col border-r bg-background">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">{fileName}</span>
              <span className="text-[10px] text-muted-foreground">Markdown</span>
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-4">
              <div className="font-mono text-[11px] leading-5 sm:text-xs sm:leading-6">
                {sourceLines.map(({ num, parts }) => (
                  <div key={num} className="grid grid-cols-[1.25rem_1fr]">
                    <span className="select-none text-right text-muted-foreground">{num}</span>
                    <span className="pl-2">
                      {parts.length === 0 ? (
                        <span>&nbsp;</span>
                      ) : (
                        parts.map((part, i) => (
                          <span key={i} className={part.color}>
                            {part.text}
                          </span>
                        ))
                      )}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1.25rem_1fr]">
                  <span className="select-none text-right text-muted-foreground">{nextLine}</span>
                  <span className="flex items-center gap-1 pl-2">
                    <span className="inline-block h-4 w-0.5 animate-pulse bg-indigo-600 dark:bg-indigo-400" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col bg-background">
            <div className="border-b px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-4 text-sm leading-relaxed">{preview}</div>
          </div>
        </main>
      </div>
    </BrowserFrame>
  );
}
