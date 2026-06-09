import { FileText, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeItem } from "@/lib/validation/models";

interface StaticPublicFolderBrowserProps {
  shareSlug: string;
  items: TreeItem[];
  selectedFileId: string | null;
}

function StaticTreeBranch({
  items,
  level = 0,
  selectedFileId,
  shareSlug,
}: StaticPublicFolderBrowserProps & {
  level?: number;
}) {
  return (
    <div className="min-w-0 space-y-1">
      {items.map((item) => {
        const isFolder = item.type === "folder";
        const isSelected = selectedFileId === item.id;
        const paddingLeft = `${level * 14 + 8}px`;
        const rowClassName = cn(
          "flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl p-2 text-left text-sm transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
          isFolder ? "font-medium text-foreground" : "text-muted-foreground",
          isSelected && "bg-accent text-foreground shadow-xs",
        );

        return (
          <div key={item.id} className="min-w-0">
            {isFolder ? (
              <div className={rowClassName} style={{ paddingLeft }} title={item.name}>
                {item.children?.length ? (
                  <FolderOpen
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                ) : (
                  <Folder aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
              </div>
            ) : (
              <a
                href={`/view/folder/${shareSlug}/file/${item.id}`}
                className={rowClassName}
                style={{ paddingLeft }}
                aria-current={isSelected ? "page" : undefined}
                title={item.name}
              >
                <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    isSelected && "font-medium text-foreground",
                  )}
                >
                  {item.name}
                </span>
              </a>
            )}

            {isFolder ? (
              item.children?.length ? (
                <div className="min-w-0 pt-1">
                  <StaticTreeBranch
                    shareSlug={shareSlug}
                    items={item.children}
                    selectedFileId={selectedFileId}
                    level={level + 1}
                  />
                </div>
              ) : (
                <p
                  className="px-2 py-1 text-xs text-muted-foreground"
                  style={{ paddingLeft: `${(level + 1) * 14 + 41}px` }}
                >
                  Empty folder
                </p>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function StaticPublicFolderBrowser({
  shareSlug,
  items,
  selectedFileId,
}: StaticPublicFolderBrowserProps) {
  return (
    <nav className="min-w-0 space-y-3 overflow-x-hidden" aria-label="Shared workspace files">
      <div className="space-y-1 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Shared Workspace
        </p>
      </div>

      <div className="min-w-0 rounded-2xl">
        <StaticTreeBranch shareSlug={shareSlug} items={items} selectedFileId={selectedFileId} />
      </div>
    </nav>
  );
}
