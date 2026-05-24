import Link from "next/link";
import { FileText, FolderOpen, Share2 } from "lucide-react";
import { PublicMarkdownPreview } from "@/components/public-markdown-preview";
import { SharedCopyButton } from "@/components/shared-copy-button";
import { StaticPublicFolderBrowser } from "@/components/static-public-folder-browser";
import type { PublicFolderFileRecord } from "@/lib/public-folders";
import type { TreeItem } from "@/lib/types";

interface SharedFolderViewerProps {
  shareSlug: string;
  folderName: string;
  filesCount: number;
  subfolderCount: number;
  treeItems: TreeItem[];
  initialFile: PublicFolderFileRecord | null;
  fallbackFileId: string | null;
  ownerId: string | null;
}

export function SharedFolderViewer({
  shareSlug,
  folderName,
  filesCount,
  subfolderCount,
  treeItems,
  initialFile,
  fallbackFileId,
  ownerId: _ownerId,
}: SharedFolderViewerProps) {
  const selectedFileId = initialFile?.id ?? fallbackFileId;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:gap-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start">
      <aside className="order-2 min-w-0 rounded-2xl border bg-card shadow-sm lg:order-none lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:self-start lg:overflow-hidden">
        <div className="border-b p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h1
                  className="min-w-0 truncate text-base font-semibold leading-tight"
                  title={folderName}
                >
                  {folderName}
                </h1>
                <Share2 aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums text-muted-foreground">
                <span>
                  {filesCount} {filesCount === 1 ? "file" : "files"}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {subfolderCount} {subfolderCount === 1 ? "subfolder" : "subfolders"}
                </span>
              </p>
            </div>
          </div>
          <SharedCopyButton
            shareSlug={shareSlug}
            itemName={folderName}
            itemType="folder"
            className="mt-3 h-9 w-full"
          />
        </div>

        <div className="min-w-0 p-3 lg:max-h-[calc(100svh-14rem)] lg:overflow-y-auto lg:overscroll-contain">
          <StaticPublicFolderBrowser
            shareSlug={shareSlug}
            items={treeItems}
            selectedFileId={selectedFileId}
          />
        </div>
      </aside>

      <section className="order-1 min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm lg:order-none">
        {initialFile ? (
          <>
            <div className="border-b p-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <FileText aria-hidden="true" className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    className="min-w-0 max-w-full text-xl font-semibold tracking-tight text-pretty [overflow-wrap:anywhere] sm:text-3xl"
                    title={initialFile.name}
                  >
                    {initialFile.name.replace(/\.md$/, "")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Shared from &quot;{folderName}&quot; on{" "}
                    <Link
                      href="/"
                      prefetch={false}
                      className="text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Inkdown
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 px-4 py-5 sm:p-6">
              <PublicMarkdownPreview content={initialFile.content} headingBaseLevel={3} />
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-12 text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileText aria-hidden="true" className="size-7" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No shared files in this folder</p>
              <p className="text-sm">
                This shared folder does not currently contain any nested markdown files.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
