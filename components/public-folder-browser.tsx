import Link from 'next/link'
import { FileText, Folder, FolderOpen, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeItem } from '@/lib/types'

interface PublicFolderBrowserProps {
  shareSlug: string
  items: TreeItem[]
  selectedFileId: string | null
}

function TreeBranch({
  items,
  shareSlug,
  selectedFileId,
  level = 0,
}: {
  items: TreeItem[]
  shareSlug: string
  selectedFileId: string | null
  level?: number
}) {
  return (
    <div className="min-w-0 space-y-1">
      {items.map((item) => {
        const paddingLeft = `${level * 12 + 8}px`

        if (item.type === 'folder') {
          return (
            <div key={item.id} className="min-w-0 space-y-1">
              <div
                className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-foreground"
                style={{ paddingLeft }}
              >
                {item.children?.length ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {item.is_public && (
                  <Share2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </div>

              {item.children?.length ? (
                <TreeBranch
                  items={item.children}
                  shareSlug={shareSlug}
                  selectedFileId={selectedFileId}
                  level={level + 1}
                />
              ) : (
                <p
                  className="px-2 text-xs text-muted-foreground"
                  style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
                >
                  Empty folder
                </p>
              )}
            </div>
          )
        }

        return (
          <Link
            key={item.id}
            href={`/view/folder/${shareSlug}?file=${item.id}`}
            scroll={false}
            className={cn(
              'flex min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground',
              selectedFileId === item.id && 'bg-accent text-foreground shadow-xs',
            )}
            style={{ paddingLeft }}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {item.is_public && <Share2 className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </Link>
        )
      })}
    </div>
  )
}

export function PublicFolderBrowser({
  shareSlug,
  items,
  selectedFileId,
}: PublicFolderBrowserProps) {
  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      <div className="px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Shared Workspace
        </p>
      </div>
      <TreeBranch items={items} shareSlug={shareSlug} selectedFileId={selectedFileId} />
    </div>
  )
}
