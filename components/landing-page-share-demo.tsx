import { Check, FileText, LoaderCircle, Lock, Unlock } from "lucide-react";

export function LandingPageShareDemo() {
  return (
    <div
      aria-hidden="true"
      className="relative h-52 overflow-hidden rounded-xl border bg-background p-3 sm:h-56 sm:p-4 lg:h-44 lg:p-3"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold text-foreground sm:text-xs">
            the-sunday-letter.md
          </div>
          <div className="relative mt-0.5 h-3.5 text-[10px] text-muted-foreground">
            <span className="animate-share-status-private absolute inset-y-0 left-0 whitespace-nowrap">
              Private document
            </span>
            <span className="animate-share-status-public absolute inset-y-0 left-0 whitespace-nowrap text-indigo-600 dark:text-indigo-400">
              Public link
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-lg border bg-muted/35 p-2 sm:p-2.5">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-[9px] font-medium text-muted-foreground sm:text-[10px]">
            Share link
          </div>
          <div className="truncate font-mono text-[9px] text-foreground sm:text-[10px]">
            inkdown.shubhojeet.com/view/the-sunday-letter
          </div>
        </div>
        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-foreground shadow-sm">
          <Lock className="animate-share-lock absolute size-3.5" />
          <LoaderCircle className="animate-share-loader absolute size-3.5 text-indigo-600 dark:text-indigo-400" />
          <Unlock className="animate-share-unlock absolute size-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="animate-share-press absolute -inset-1 rounded-lg border border-indigo-600/70 dark:border-indigo-400/70" />
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="relative inline-flex size-3 shrink-0">
          <Lock className="animate-share-status-lock absolute inset-0 size-3" />
          <Check className="animate-share-status-check absolute inset-0 size-3 text-indigo-600 dark:text-indigo-400" />
        </span>
        <span className="relative h-3.5 flex-1">
          <span className="animate-share-status-private absolute inset-y-0 left-0 whitespace-nowrap">
            Only you can access this
          </span>
          <span className="animate-share-status-public absolute inset-y-0 left-0 whitespace-nowrap text-foreground">
            Anyone with the link can view
          </span>
        </span>
      </div>

      <svg
        viewBox="0 0 24 32"
        className="animate-share-cursor pointer-events-none absolute right-4 top-[5.4rem] z-10 h-7 w-5 drop-shadow-sm sm:right-5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.4 2.2 20.2 18.8l-7.3 1.9 4.6 8.4-4.4 2.3-4.5-8.3-5.9 5.3L2.4 2.2Z"
          fill="white"
          stroke="black"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>

      <div className="animate-share-toast pointer-events-none absolute inset-x-3 bottom-3 flex justify-center sm:inset-x-4 sm:bottom-4">
        <div className="flex items-center gap-1.5 rounded-lg bg-indigo-700 px-3 py-2 text-[10px] font-medium text-white shadow-lg shadow-indigo-950/20">
          <Check className="size-3" />
          <span>Share it publically.</span>
        </div>
      </div>
    </div>
  );
}
