"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const CopyFolderDialog = dynamic(
  () => import("@/components/copy-folder-dialog").then((mod) => mod.CopyFolderDialog),
  { ssr: false },
);

interface SharedCopyButtonProps {
  shareSlug: string;
  itemName: string;
  itemType: "file" | "folder";
  label?: "full" | "short";
  className?: string;
}

export function SharedCopyButton({
  shareSlug,
  itemName,
  itemType,
  label = "full",
  className,
}: SharedCopyButtonProps) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCopyToWorkspace = async () => {
    setMessage(null);
    setIsCheckingAuth(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setMessage(`Sign in to copy this ${itemType} to your workspace.`);
        return;
      }

      setCopyDialogOpen(true);
    } catch {
      setMessage(`Unable to copy this ${itemType} right now.`);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopyToWorkspace}
        disabled={isCheckingAuth}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border bg-background px-3 text-sm font-medium shadow-xs outline-none transition-all hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
          className,
        )}
        title={`Copy ${itemType} to workspace`}
      >
        <Copy className="size-4" />
        <span>
          {isCheckingAuth ? "Checking..." : label === "full" ? "Copy to Workspace" : "Copy"}
        </span>
      </button>
      {message ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      {copyDialogOpen ? (
        <CopyFolderDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          shareSlug={shareSlug}
          itemName={itemName}
          itemType={itemType}
        />
      ) : null}
    </>
  );
}
