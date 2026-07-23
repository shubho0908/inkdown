import { ChevronDown, FileText, FolderOpen } from "lucide-react";

const folders = [
  {
    name: "Projects",
    file: "quiet-plan.md",
    folderPosition: "top-0",
    filePosition: "top-5",
    folderClass: "animate-organize-folder-plan",
    resultClass: "animate-organize-result-plan",
  },
  {
    name: "Research",
    file: "reading-list.md",
    folderPosition: "top-10",
    filePosition: "top-[3.75rem]",
    folderClass: "animate-organize-folder-reading",
    resultClass: "animate-organize-result-reading",
  },
  {
    name: "Personal",
    file: "morning-pages.md",
    folderPosition: "top-20",
    filePosition: "top-[6.25rem]",
    folderClass: "animate-organize-folder-pages",
    resultClass: "animate-organize-result-pages",
  },
] as const;

export function LandingPageOrganizeDemo() {
  return (
    <div
      aria-hidden="true"
      className="landing-organize-scene relative h-52 overflow-hidden rounded-xl border bg-background p-3 sm:h-56 sm:p-4 lg:h-52 lg:p-3"
    >
      <div className="flex items-center justify-between border-b pb-2 text-[10px] sm:text-[11px]">
        <span className="font-semibold text-foreground">All files</span>
        <span className="text-muted-foreground">Sort into folders</span>
      </div>

      <div className="absolute left-3 top-11 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground sm:left-4 sm:text-[11px]">
        <FileText className="size-3" />
        <span>Unsorted</span>
        <span className="text-muted-foreground/60">3</span>
      </div>

      <div className="animate-organize-source-plan absolute left-3 top-[4.25rem] w-24 sm:left-4 sm:w-28">
        <FileCard name="quiet-plan.md" />
      </div>
      <div className="animate-organize-source-reading absolute left-3 top-24 w-24 sm:left-4 sm:w-28">
        <FileCard name="reading-list.md" />
      </div>
      <div className="animate-organize-source-pages absolute left-3 top-[7.75rem] w-24 sm:left-4 sm:w-28">
        <FileCard name="morning-pages.md" />
      </div>

      <div className="absolute bottom-3 left-[45%] right-3 top-11 min-w-0 sm:bottom-4 sm:right-4">
        <div className="flex h-4 items-center gap-1.5 text-[10px] font-semibold text-foreground sm:text-[11px]">
          <ChevronDown className="size-3 text-muted-foreground" />
          <FolderOpen className="size-3.5 text-primary" />
          <span className="truncate">Workspace</span>
        </div>
        <div className="relative ml-2.5 mt-1.5 h-28 border-l border-border/80 pl-2 sm:ml-3 sm:pl-2.5">
          {folders.map(({ name, file, folderPosition, filePosition, folderClass, resultClass }) => (
            <div key={name}>
              <div
                className={`${folderClass} ${folderPosition} absolute left-2 right-0 flex h-4 items-center gap-1.5 rounded-sm text-[10px] text-foreground sm:left-2.5 sm:text-[11px]`}
              >
                <ChevronDown className="size-3 text-muted-foreground" />
                <FolderOpen className="size-3.5 text-primary" />
                <span className="truncate">{name}</span>
              </div>
              <div
                className={`${resultClass} ${filePosition} absolute left-6 right-0 flex h-3 items-center gap-1.5 text-[9px] text-muted-foreground sm:left-7 sm:text-[10px]`}
              >
                <FileText className="size-3 shrink-0 text-primary" />
                <span className="truncate">{file}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FileCard({ name }: { name: string }) {
  return (
    <div className="flex h-6 items-center gap-1.5 rounded-md border bg-background px-1.5 shadow-sm sm:px-2">
      <FileText className="size-3 shrink-0 text-primary" />
      <span className="truncate text-[9px] font-medium text-foreground sm:text-[10px]">{name}</span>
    </div>
  );
}
