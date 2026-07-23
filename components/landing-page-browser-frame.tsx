import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  children: React.ReactNode;
  url?: string;
  className?: string;
}

export function BrowserFrame({
  children,
  url = "inkdown.shubhojeet.com",
  className,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/5 dark:shadow-black/20",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 border-b bg-muted/50 px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="size-3 rounded-full bg-red-400/90" />
          <span className="size-3 rounded-full bg-amber-400/90" />
          <span className="size-3 rounded-full bg-emerald-400/90" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 text-[10px] sm:gap-2 sm:px-3 sm:text-xs">
          <Lock className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="shrink-0 text-muted-foreground">https://</span>
          <span className="truncate font-medium text-foreground">{url}</span>
        </div>
      </div>
      <div className="relative flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
