"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Copy, ExternalLink, Loader } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: "file" | "folder";
  isPublic: boolean;
  slug: string | null;
  isPending?: boolean;
  onTogglePublic: (isPublic: boolean) => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  isPublic,
  slug,
  isPending = false,
  onTogglePublic,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const sharePath = itemType === "folder" ? `/view/folder/${slug}` : `/view/${slug}`;

  const shareUrl = slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${sharePath}`
    : "";

  const handleCopy = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Share link copied");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Could not copy share link");
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCopied(false);
    }

    onOpenChange(nextOpen);
  };

  const accessDescription =
    itemType === "folder"
      ? "Anyone with the link can browse this folder and all nested files and folders"
      : "Anyone with the link can view this file";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6">
        <DialogHeader className="min-w-0">
          <DialogTitle className="pr-8 text-left break-words">
            Share &quot;<span className="break-all">{itemName}</span>&quot;
          </DialogTitle>
          <DialogDescription className="text-left">
            {itemType === "folder"
              ? "Make this folder public to share its full nested workspace."
              : "Make this file public to share it with others."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          <div
            className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
            aria-busy={isPending}
          >
            <div className="min-w-0 space-y-1 pr-2">
              <Label htmlFor={isPending ? undefined : "public"} className="text-sm font-medium">
                Public access
              </Label>
              <p className="break-words text-sm text-muted-foreground">
                {isPending ? "Updating access…" : accessDescription}
              </p>
            </div>
            <div
              className="flex size-8 shrink-0 items-center justify-center self-start sm:self-center"
              aria-hidden={isPending}
            >
              {isPending ? (
                <Loader
                  className="size-4 animate-spin text-muted-foreground"
                  aria-label="Updating access"
                />
              ) : (
                <Switch id="public" checked={isPublic} onCheckedChange={onTogglePublic} />
              )}
            </div>
          </div>

          {isPublic && (slug || isPending) ? (
            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Share link</Label>
                <p className="text-sm text-muted-foreground">
                  {isPending && !slug
                    ? "Generating a public link for this item…"
                    : itemType === "folder"
                      ? "Copy or open the public URL for this shared folder."
                      : "Copy or open the public URL for this file."}
                </p>
              </div>

              {slug ? (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Input value={shareUrl} readOnly className="min-w-0 font-mono text-sm" />

                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopy}
                      aria-label={copied ? "Copied" : "Copy link"}
                      className="w-full sm:w-9"
                      disabled={isPending}
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="sm:hidden">{copied ? "Copied" : "Copy"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      aria-label="Open in new tab"
                      className="w-full sm:w-9"
                      disabled={isPending}
                    >
                      <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                        <span className="sm:hidden">Open</span>
                        <span className="sr-only">Open in new tab</span>
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed bg-background/60 px-3 py-4 text-sm text-muted-foreground">
                  <Loader className="size-4 shrink-0 animate-spin" aria-hidden />
                  <span>Preparing share link…</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
