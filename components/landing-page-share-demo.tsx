import { FileText, Lock, MousePointer2, Unlock } from "lucide-react";

export function LandingPageShareDemo() {
  return (
    <div className="relative h-32 overflow-hidden rounded-xl border bg-background p-4">
      <div className="flex items-center gap-3">
        <FileText className="size-8 text-indigo-600 dark:text-indigo-400" />
        <div>
          <div className="text-xs font-semibold text-foreground">roadmap.md</div>
          <div className="text-[10px] text-muted-foreground">Private document</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-2 py-1.5 text-[10px]">
        <span className="relative inline-flex size-4 items-center justify-center">
          <Lock className="absolute inset-0 size-4 text-foreground animate-share-lock" />
          <Unlock className="absolute inset-0 size-4 text-indigo-600 dark:text-indigo-400 animate-share-unlock" />
          <MousePointer2 className="absolute left-1/2 top-1/2 size-5 text-foreground animate-share-cursor" />
          <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-indigo-600 animate-share-ring" />
        </span>
        <span className="truncate text-muted-foreground">https://</span>
        <span className="truncate text-foreground">inkdown.shubhojeet.com/v/roadmap</span>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex justify-center animate-share-toast">
        <div className="rounded-md bg-indigo-700 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm">
          Share it publicly
        </div>
      </div>
    </div>
  );
}
