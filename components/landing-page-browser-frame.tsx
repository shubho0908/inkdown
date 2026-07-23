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
        "flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/5 dark:shadow-black/20",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b bg-muted/50 px-3 py-2.5">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="size-3 rounded-full bg-red-400/90" />
          <span className="size-3 rounded-full bg-amber-400/90" />
          <span className="size-3 rounded-full bg-emerald-400/90" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-1.5 text-xs">
          <Lock className="size-3 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">https://</span>
          <span className="font-medium text-foreground">{url}</span>
        </div>
      </div>
      <div className="relative flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
