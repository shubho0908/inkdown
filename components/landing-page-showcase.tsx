import { Edit3, FileText, Folder, FolderTree, Lock, Share2 } from "lucide-react";

const scenarios = [
  {
    icon: Edit3,
    title: "Precision Editing",
    description:
      "A deeply refined writing environment with side-by-side live rendering and instant GFM support.",
  },
  {
    icon: FolderTree,
    title: "Workspace Clarity",
    description:
      "Unclutter your mind with fluid folder nesting and lightning-fast full text search.",
  },
  {
    icon: Share2,
    title: "Instant Publishing",
    description:
      "Publish flawlessly. One click transforms your markdown into a perfectly typeset web page.",
  },
];

function EditorPreview() {
  return (
    <div className="flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-lg border border-border bg-background/80 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <div className="hidden gap-1.5 sm:flex">
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
        </div>
        <div className="text-xs font-medium text-muted-foreground sm:ml-4">brand_guidelines.md</div>
      </div>

      <div className="grid flex-1 grid-rows-2 overflow-hidden sm:grid-cols-2 sm:grid-rows-1">
        <div className="border-b border-border bg-muted/10 p-4 font-mono text-[12px] text-muted-foreground sm:border-r sm:border-b-0 sm:p-6 sm:text-[13px]">
          <div className="whitespace-pre-wrap">
            <span className="text-primary/70">#</span> Brand Guidelines
          </div>
          <div className="mt-4 leading-relaxed whitespace-pre-wrap text-foreground/80">
            Overview of our core aesthetic.
          </div>
          <div className="mt-4 border-l-2 border-muted-foreground/30 pl-3 leading-relaxed whitespace-pre-wrap text-foreground/60 italic">
            &quot;Design is how it works.&quot;
          </div>
          <div className="mt-4 leading-relaxed whitespace-pre-wrap text-foreground/80">
            <span className="text-primary/70">##</span> Typography Primary
          </div>
          <div className="mt-2 leading-relaxed whitespace-pre-wrap text-foreground/50">
            - <strong>Heading:</strong> System sans
            <br />- <strong>Body:</strong> Focused and readable
          </div>
        </div>

        <div className="bg-background/40 p-4 text-xs text-foreground sm:p-6 sm:text-sm">
          <div className="truncate text-lg font-semibold tracking-tight sm:text-2xl">
            Brand Guidelines
          </div>
          <p className="mt-3 leading-relaxed text-foreground/80 sm:mt-4">
            Overview of our core aesthetic.
          </p>
          <p className="mt-4 border-l-2 border-muted/30 py-1 pl-4 tracking-wide text-muted-foreground italic">
            &quot;Design is how it works.&quot;
          </p>
          <div className="mt-6 truncate border-b border-border/50 pb-1 text-sm font-medium tracking-tight sm:text-lg">
            Typography Primary
          </div>
          <ul className="mt-3 ml-1 list-inside list-disc space-y-1.5 text-foreground/80">
            <li>
              <strong>Heading:</strong> System sans
            </li>
            <li>
              <strong>Body:</strong> Focused and readable
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function WorkspacePreview() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Folder className="size-4 text-emerald-500" />
          <span className="text-sm font-medium text-foreground">Marketing Strategy</span>
        </div>
      </div>
      <div className="ml-3 grid gap-1 border-l border-border/50 py-1 pl-6">
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground/70">Q3 Launch Plan</span>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-border bg-background px-2 py-1.5 shadow-sm">
          <FileText className="size-3.5 text-foreground" />
          <span className="text-sm font-medium text-foreground">Brand Guidelines</span>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between rounded-lg border border-transparent px-3 py-2">
        <div className="flex items-center gap-3">
          <Lock className="size-3.5 text-muted-foreground/80" />
          <span className="text-sm font-medium text-foreground/80">Personal Drafts</span>
        </div>
      </div>
    </div>
  );
}

export function LandingPageShowcase() {
  return (
    <div className="relative z-20 mx-auto mt-16 max-w-[1050px] px-4 sm:mt-24 sm:px-6">
      <h2 className="sr-only">Inkdown writing workflow</h2>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="grid content-center gap-3 sm:gap-4 lg:col-span-5">
          {scenarios.map((scenario, idx) => {
            const Icon = scenario.icon;

            return (
              <article
                key={scenario.title}
                className={`group flex flex-col items-start gap-3 rounded-lg border p-5 text-left shadow-sm transition-colors sm:p-6 ${
                  idx === 0
                    ? "border-border/50 bg-muted/40"
                    : "border-transparent bg-transparent hover:border-border/30 hover:bg-muted/20"
                }`}
              >
                <div className="flex w-full items-center gap-4">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg border sm:size-12 ${
                      idx === 0
                        ? "border-transparent bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground group-hover:border-foreground/20 group-hover:text-foreground/80"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3
                    className={`text-lg font-medium tracking-tight transition-colors sm:text-xl ${
                      idx === 0
                        ? "text-foreground"
                        : "text-foreground/60 group-hover:text-foreground/80"
                    }`}
                  >
                    {scenario.title}
                  </h3>
                </div>
                <p className="pl-[60px] text-sm leading-relaxed text-muted-foreground sm:pl-[64px]">
                  {scenario.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="grid gap-4 lg:col-span-7">
          <EditorPreview />
          <div className="grid gap-4 rounded-lg border border-border bg-background/70 p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:p-5 lg:hidden">
            <WorkspacePreview />
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <Share2 className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Shared Successfully</div>
                <p className="text-xs text-muted-foreground">Live securely on the internet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
