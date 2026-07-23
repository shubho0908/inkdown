import { FileText, FolderOpen } from "lucide-react";

export function LandingPageOrganizeDemo() {
  return (
    <div className="relative h-32 overflow-hidden rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-semibold">Projects</span>
      </div>
      <div className="mt-2 overflow-hidden animate-organize-folder">
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3" />
            <span>notes.md</span>
          </div>
          <div className="animate-organize-file flex items-center gap-2 text-xs text-foreground font-medium">
            <FileText className="size-3 text-indigo-600 dark:text-indigo-400" />
            <span>draft.md</span>
          </div>
        </div>
      </div>
    </div>
  );
}
