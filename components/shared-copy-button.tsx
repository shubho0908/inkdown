"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/query-provider";
import { authClient } from "@/lib/auth/client";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";

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
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loginHref = `/auth/login?next=${encodeURIComponent(getSafeNextPath(pathname))}`;

  const handleCopyToWorkspace = async () => {
    setMessage(null);
    setNeedsSignIn(false);
    setIsCheckingAuth(true);

    try {
      const session = await authClient.getSession();

      if (!session.data?.user) {
        setNeedsSignIn(true);
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
        onClick={() => void handleCopyToWorkspace()}
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
      {needsSignIn ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          <Link
            href={loginHref}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </Link>{" "}
          to copy this {itemType} to your workspace.
        </p>
      ) : null}
      {message ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      {copyDialogOpen ? (
        <QueryProvider>
          <CopyFolderDialog
            open={copyDialogOpen}
            onOpenChange={setCopyDialogOpen}
            shareSlug={shareSlug}
            itemName={itemName}
            itemType={itemType}
          />
        </QueryProvider>
      ) : null}
    </>
  );
}
