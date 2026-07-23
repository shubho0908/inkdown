import { ChevronRight, FileText, Folder, FolderOpen, Search } from "lucide-react";
import { BrowserFrame } from "@/components/landing-page-browser-frame";

const sourceLines = [
  { num: 1, text: "# Welcome", color: "text-indigo-600 dark:text-indigo-400" },
  {
    num: 2,
    text: "Inkdown is a **self-hosted markdown workspace**.",
    color: "text-foreground",
  },
  { num: 3, text: "## Features", color: "text-indigo-600 dark:text-indigo-400" },
  { num: 4, text: "- Live preview", color: "text-foreground" },
  { num: 5, text: "- Folder organization", color: "text-foreground" },
  { num: 6, text: "- Public links", color: "text-foreground" },
];

const listItems = ["Live preview", "Folder organization", "Public links"];

function Sidebar() {
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
        <div className="flex items-center gap-2 rounded-md bg-accent px-2 py-1.5">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="truncate text-xs font-medium">welcome.md</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <FolderOpen className="size-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="truncate text-xs">Projects</span>
        </div>
        <div className="flex items-center gap-2 pl-6">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="truncate text-xs">roadmap.md</span>
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

export function LandingPageSplitViewDemo() {
  return (
    <BrowserFrame
      url="inkdown.shubhojeet.com"
      className="w-full aspect-square min-h-[20rem] sm:min-h-[24rem]"
    >
      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col border-r bg-background">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">welcome.md</span>
              <span className="text-[10px] text-muted-foreground">Markdown</span>
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-4">
              <div className="animate-source-wipe font-mono text-[11px] leading-5 sm:text-xs sm:leading-6">
                {sourceLines.map(({ num, text, color }) => (
                  <div key={num} className="grid grid-cols-[1.25rem_1fr]">
                    <span className="select-none text-right text-muted-foreground">{num}</span>
                    <span className={`pl-2 ${color}`}>{text}</span>
                  </div>
                ))}
                <div className="grid grid-cols-[1.25rem_1fr]">
                  <span className="select-none text-right text-muted-foreground">
                    {sourceLines.length + 1}
                  </span>
                  <span className="flex items-center gap-1 pl-2">
                    <span className="inline-block h-4 w-0.5 animate-caret-blink bg-indigo-600 dark:bg-indigo-400" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col bg-background">
            <div className="border-b px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-4 text-sm leading-relaxed">
              <div className="animate-preview-wipe">
                <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  Welcome
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Inkdown is a{" "}
                  <strong className="text-foreground">self-hosted markdown workspace</strong>.
                </p>
                <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  Features
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                  {listItems.map((item) => (
                    <li key={item}>
                      <span className="font-semibold text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </BrowserFrame>
  );
}
