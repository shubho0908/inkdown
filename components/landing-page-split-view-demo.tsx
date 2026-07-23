import type { CSSProperties, ReactNode } from "react";
import { BrowserFrame } from "@/components/landing-page-browser-frame";

type StreamStyle = CSSProperties & {
  "--stream-delay": string;
  "--stream-height"?: string;
};

type SourceLine = {
  number: number;
  text: string;
  tone: string;
  delay?: string;
  desktopOnly?: boolean;
};

type PreviewLine = {
  delay: string;
  desktopOnly?: boolean;
  content: ReactNode;
};

const sourceLines: readonly SourceLine[] = [
  {
    number: 1,
    text: "# The quiet plan",
    tone: "text-primary",
    delay: "0ms",
  },
  { number: 2, text: "Write ideas as they arrive.", tone: "text-foreground", delay: "420ms" },
  { number: 3, text: "", tone: "text-foreground" },
  {
    number: 4,
    text: "> No tab switching.",
    tone: "text-muted-foreground",
    delay: "840ms",
  },
  {
    number: 5,
    text: "## Keep the signal",
    tone: "text-primary",
    delay: "1260ms",
  },
  {
    number: 6,
    text: "- Capture the rough idea",
    tone: "text-foreground",
    delay: "1680ms",
  },
  {
    number: 7,
    text: "- Make the structure obvious",
    tone: "text-foreground",
    delay: "2100ms",
    desktopOnly: true,
  },
  {
    number: 8,
    text: "- Share it when it is ready",
    tone: "text-foreground",
    delay: "2520ms",
    desktopOnly: true,
  },
  { number: 9, text: "", tone: "text-foreground", desktopOnly: true },
  {
    number: 10,
    text: "## Notes",
    tone: "text-primary",
    delay: "2940ms",
    desktopOnly: true,
  },
  { number: 11, text: "", tone: "text-foreground", desktopOnly: true },
  {
    number: 12,
    text: "**Markdown** stays readable.",
    tone: "text-foreground",
    delay: "3360ms",
    desktopOnly: true,
  },
  { number: 13, text: "", tone: "text-foreground", desktopOnly: true },
  {
    number: 14,
    text: "- _The preview follows._",
    tone: "text-foreground",
    delay: "3780ms",
    desktopOnly: true,
  },
  {
    number: 15,
    text: "- [x] Keep the work moving",
    tone: "text-foreground",
    delay: "4200ms",
    desktopOnly: true,
  },
  { number: 16, text: "", tone: "text-foreground", desktopOnly: true },
  {
    number: 17,
    text: "> A small plan makes space to think.",
    tone: "text-muted-foreground",
    delay: "4620ms",
    desktopOnly: true,
  },
  { number: 18, text: "", tone: "text-foreground", desktopOnly: true },
] as const;

const previewLines: readonly PreviewLine[] = [
  {
    delay: "0ms",
    content: (
      <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-xl">
        The quiet plan
      </h1>
    ),
  },
  {
    delay: "420ms",
    content: <p className="text-muted-foreground">Write ideas as they arrive.</p>,
  },
  {
    delay: "840ms",
    content: (
      <blockquote className="border-l-2 border-primary/50 pl-2 text-muted-foreground dark:border-primary/50">
        No tab switching.
      </blockquote>
    ),
  },
  {
    delay: "1260ms",
    content: <h2 className="font-semibold tracking-tight text-foreground">Keep the signal</h2>,
  },
  {
    delay: "1680ms",
    content: <PreviewListItem>Capture the rough idea</PreviewListItem>,
  },
  {
    delay: "2100ms",
    desktopOnly: true,
    content: <PreviewListItem>Make the structure obvious</PreviewListItem>,
  },
  {
    delay: "2520ms",
    desktopOnly: true,
    content: <PreviewListItem>Share it when it is ready</PreviewListItem>,
  },
  {
    delay: "2940ms",
    desktopOnly: true,
    content: <h2 className="font-semibold tracking-tight text-foreground">Notes</h2>,
  },
  {
    delay: "3360ms",
    desktopOnly: true,
    content: (
      <p className="text-muted-foreground">
        <strong className="font-semibold text-foreground">Markdown</strong> stays readable.
      </p>
    ),
  },
  {
    delay: "3780ms",
    desktopOnly: true,
    content: <PreviewListItem emphasis>The preview follows.</PreviewListItem>,
  },
  {
    delay: "4200ms",
    desktopOnly: true,
    content: (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="flex size-3 items-center justify-center rounded-sm border border-primary bg-primary text-[8px] font-bold text-primary-foreground">
          ✓
        </span>
        Keep the work moving
      </div>
    ),
  },
  {
    delay: "4620ms",
    desktopOnly: true,
    content: (
      <blockquote className="border-l-2 border-primary/50 pl-2 italic text-muted-foreground dark:border-primary/50">
        A small plan makes space to think.
      </blockquote>
    ),
  },
] as const;

function streamSourceStyle(delay: string): StreamStyle {
  return { "--stream-delay": delay };
}

function streamPreviewStyle(delay: string): StreamStyle {
  return { "--stream-delay": delay, "--stream-height": "4rem" };
}

function PreviewListItem({ children, emphasis = false }: { children: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-1 shrink-0 rounded-full bg-primary" />
      {emphasis ? <em className="text-foreground">{children}</em> : children}
    </div>
  );
}

export function LandingPageSplitViewDemo() {
  return (
    <BrowserFrame
      url="inkdown.shubhojeet.com/workspace"
      className="w-full min-w-0 max-w-full min-h-[22rem] sm:aspect-[8/5] sm:min-h-[21rem] lg:min-h-0 lg:flex-1 lg:aspect-auto"
    >
      <div
        aria-hidden="true"
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden sm:flex-row"
      >
        <section className="flex min-w-0 flex-1 flex-col bg-muted/[0.18]">
          <header className="flex h-10 items-center justify-between border-b px-3 sm:px-4">
            <span className="text-[11px] font-semibold text-foreground sm:text-xs">Write</span>
            <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
              quiet-plan.md
            </span>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden px-2.5 py-3 font-mono text-[10px] leading-5 sm:px-4 sm:py-4 sm:text-xs sm:leading-6 lg:text-[11px] lg:leading-5">
            {sourceLines.map(({ number, text, tone, delay, desktopOnly }) => (
              <div
                key={number}
                className={`grid min-w-0 grid-cols-[1.1rem_minmax(0,1fr)] gap-1 sm:grid-cols-[1.35rem_minmax(0,1fr)] sm:gap-2 ${desktopOnly ? "hidden lg:grid" : ""}`}
              >
                <span className="select-none text-right text-muted-foreground">{number}</span>
                {text ? (
                  <span className="min-w-0 overflow-hidden">
                    <span
                      className={`animate-split-stream-source block whitespace-nowrap ${tone}`}
                      style={streamSourceStyle(delay ?? "0ms")}
                    >
                      {text}
                    </span>
                  </span>
                ) : (
                  <span aria-hidden="true">&nbsp;</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col border-t bg-background sm:border-l sm:border-t-0">
          <header className="flex h-10 items-center justify-between border-b px-3 sm:px-4">
            <span className="text-[11px] font-semibold text-foreground sm:text-xs">View</span>
            <span className="text-[10px] font-medium text-primary">Live</span>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden p-3 text-[11px] leading-relaxed sm:p-4 sm:text-sm">
            {previewLines.map(({ delay, desktopOnly, content }) => (
              <div
                key={delay}
                className={`animate-split-stream-preview overflow-hidden ${desktopOnly ? "hidden lg:block" : ""}`}
                style={streamPreviewStyle(delay)}
              >
                <div className="pb-2">{content}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <p className="sr-only">
        A Markdown document is typed line by line in the left editor, and each formatted block is
        rendered at the same point in the right preview.
      </p>
    </BrowserFrame>
  );
}
