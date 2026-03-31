'use client'

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreeItem } from '@/lib/types'

interface PublicFolderBrowserProps {
  shareSlug: string
  items: TreeItem[]
  selectedFileId: string | null
  onSelectFile?: (fileId: string) => void
}

interface VisibleTreeNode {
  item: TreeItem
  level: number
  parentFolderId: string | null
}

function findAncestorFolderIds(
  items: TreeItem[],
  targetId: string | null,
  path: string[] = [],
): string[] {
  if (!targetId) {
    return []
  }

  for (const item of items) {
    if (item.id === targetId) {
      return path
    }

    if (item.type !== 'folder' || !item.children?.length) {
      continue
    }

    const ancestorIds = findAncestorFolderIds(
      item.children,
      targetId,
      [...path, item.id],
    )

    if (ancestorIds.length > 0) {
      return ancestorIds
    }
  }

  return []
}

function flattenVisibleTree(
  items: TreeItem[],
  expandedFolderIds: Set<string>,
  level = 0,
  parentFolderId: string | null = null,
): VisibleTreeNode[] {
  return items.flatMap((item) => {
    const node: VisibleTreeNode = { item, level, parentFolderId }

    if (item.type !== 'folder' || !item.children?.length || !expandedFolderIds.has(item.id)) {
      return [node]
    }

    return [
      node,
      ...flattenVisibleTree(item.children, expandedFolderIds, level + 1, item.id),
    ]
  })
}

function findFirstTreeItemId(items: TreeItem[]): string | null {
  return items[0]?.id ?? null
}

function TreeBranch({
  items,
  shareSlug,
  selectedFileId,
  expandedFolderIds,
  activeItemId,
  itemMetadata,
  onToggleFolder,
  onSelectFile,
  onMoveFocus,
  onTreeKeyDown,
  registerItemRef,
}: {
  items: TreeItem[]
  shareSlug: string
  selectedFileId: string | null
  expandedFolderIds: Set<string>
  activeItemId: string | null
  itemMetadata: Map<string, VisibleTreeNode>
  onToggleFolder: (folderId: string) => void
  onSelectFile?: (fileId: string) => void
  onMoveFocus: (itemId: string) => void
  onTreeKeyDown: (event: KeyboardEvent<HTMLElement>, itemId: string) => void
  registerItemRef: (itemId: string, node: HTMLElement | null) => void
}) {
  return (
    <div role="group" className="min-w-0 space-y-1">
      {items.map((item) => {
        const metadata = itemMetadata.get(item.id)

        if (!metadata) {
          return null
        }

        const isFolder = item.type === 'folder'
        const isExpanded = isFolder && expandedFolderIds.has(item.id)
        const hasChildren = Boolean(item.children?.length)
        const isSelected = selectedFileId === item.id
        const isActive = activeItemId === item.id
        const paddingLeft = `${metadata.level * 14 + 8}px`
        const rowClassName = cn(
          'group flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
          isFolder ? 'font-medium text-foreground' : 'text-muted-foreground',
          isSelected && 'bg-accent text-foreground shadow-xs',
        )
        const rowContent = (
          <>
            {isFolder ? (
              isExpanded ? (
                <FolderOpen
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
              ) : (
                <Folder
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                />
              )
            ) : (
              <FileText
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-muted-foreground"
              />
            )}
            <span
              className={cn(
                'min-w-0 flex-1 truncate',
                isSelected && 'font-medium text-foreground',
              )}
              title={item.name}
            >
              {item.name}
            </span>
          </>
        )

        return (
          <div key={item.id} className="min-w-0">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
                    !isFolder && 'invisible',
                  )}
                  style={{ marginLeft: paddingLeft }}
                  aria-label={
                    isFolder
                      ? `${isExpanded ? 'Collapse' : 'Expand'} ${item.name}`
                      : undefined
                  }
                  aria-hidden={!isFolder}
                  tabIndex={-1}
                  onClick={() => {
                    if (isFolder) {
                      onToggleFolder(item.id)
                      onMoveFocus(item.id)
                    }
                  }}
                >
                  {isFolder ? (
                    isExpanded ? (
                      <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                    )
                  ) : null}
                </button>

                {isFolder ? (
                  <button
                    ref={(node) => registerItemRef(item.id, node)}
                    type="button"
                    className={rowClassName}
                    role="treeitem"
                    aria-level={metadata.level + 1}
                    aria-expanded={isExpanded}
                    aria-selected={isSelected || undefined}
                    tabIndex={isActive ? 0 : -1}
                    onFocus={() => onMoveFocus(item.id)}
                    onKeyDown={(event) => onTreeKeyDown(event, item.id)}
                    onClick={() => onToggleFolder(item.id)}
                    title={item.name}
                  >
                    {rowContent}
                  </button>
                ) : onSelectFile ? (
                  <button
                    ref={(node) => registerItemRef(item.id, node)}
                    type="button"
                    className={rowClassName}
                    role="treeitem"
                    aria-level={metadata.level + 1}
                    aria-selected={isSelected || undefined}
                    tabIndex={isActive ? 0 : -1}
                    onFocus={() => onMoveFocus(item.id)}
                    onKeyDown={(event) => onTreeKeyDown(event, item.id)}
                    onClick={() => onSelectFile(item.id)}
                    title={item.name}
                  >
                    {rowContent}
                  </button>
                ) : (
                  <Link
                    ref={(node) => registerItemRef(item.id, node)}
                    href={`/view/folder/${shareSlug}?file=${item.id}`}
                    scroll={false}
                    className={rowClassName}
                    role="treeitem"
                    aria-level={metadata.level + 1}
                    aria-selected={isSelected || undefined}
                    tabIndex={isActive ? 0 : -1}
                    onFocus={() => onMoveFocus(item.id)}
                    onKeyDown={(event) => onTreeKeyDown(event, item.id)}
                    title={item.name}
                  >
                    {rowContent}
                  </Link>
                )}
              </div>

              {isFolder && isExpanded ? (
                hasChildren ? (
                  <div className="min-w-0 pt-1">
                    <TreeBranch
                      items={item.children ?? []}
                      shareSlug={shareSlug}
                      selectedFileId={selectedFileId}
                      expandedFolderIds={expandedFolderIds}
                      activeItemId={activeItemId}
                      itemMetadata={itemMetadata}
                      onToggleFolder={onToggleFolder}
                      onSelectFile={onSelectFile}
                      onMoveFocus={onMoveFocus}
                      onTreeKeyDown={onTreeKeyDown}
                      registerItemRef={registerItemRef}
                    />
                  </div>
                ) : (
                  <p
                    className="px-2 py-1 text-xs text-muted-foreground"
                    style={{ paddingLeft: `${(metadata.level + 1) * 14 + 41}px` }}
                  >
                    Empty folder
                  </p>
                )
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PublicFolderBrowser({
  shareSlug,
  items,
  selectedFileId,
  onSelectFile,
}: PublicFolderBrowserProps) {
  const selectedAncestorIds = useMemo(
    () => findAncestorFolderIds(items, selectedFileId),
    [items, selectedFileId],
  )
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(selectedAncestorIds),
  )
  const [activeItemId, setActiveItemId] = useState<string | null>(
    selectedFileId ?? findFirstTreeItemId(items),
  )
  const [prevSelectedAncestorKey, setPrevSelectedAncestorKey] = useState(
    selectedAncestorIds.join('::'),
  )
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const selectedAncestorKey = selectedAncestorIds.join('::')

  if (selectedAncestorKey !== prevSelectedAncestorKey) {
    setPrevSelectedAncestorKey(selectedAncestorKey)
    setExpandedFolderIds((current) => {
      const next = new Set(current)
      let changed = false

      selectedAncestorIds.forEach((folderId) => {
        if (!next.has(folderId)) {
          next.add(folderId)
          changed = true
        }
      })

      return changed ? next : current
    })
  }

  const visibleNodes = useMemo(
    () => flattenVisibleTree(items, expandedFolderIds),
    [items, expandedFolderIds],
  )

  const visibleNodeIndex = useMemo(() => {
    return new Map(
      visibleNodes.map((node, index) => [node.item.id, { node, index }] as const),
    )
  }, [visibleNodes])

  const itemMetadata = useMemo(
    () => new Map(visibleNodes.map((node) => [node.item.id, node] as const)),
    [visibleNodes],
  )
  const resolvedActiveItemId =
    activeItemId && visibleNodeIndex.has(activeItemId)
      ? activeItemId
      : selectedFileId ?? visibleNodes[0]?.item.id ?? null

  const moveFocusToItem = (itemId: string | null) => {
    if (!itemId) {
      return
    }

    setActiveItemId(itemId)
    requestAnimationFrame(() => {
      itemRefs.current.get(itemId)?.focus()
    })
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current)

      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }

      return next
    })
  }

  const handleTreeKeyDown = (event: KeyboardEvent<HTMLElement>, itemId: string) => {
    const indexEntry = visibleNodeIndex.get(itemId)

    if (!indexEntry || event.altKey || event.metaKey || event.ctrlKey) {
      return
    }

    const { node, index } = indexEntry
    const currentItem = node.item

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveFocusToItem(visibleNodes[index + 1]?.item.id ?? null)
        return
      case 'ArrowUp':
        event.preventDefault()
        moveFocusToItem(visibleNodes[index - 1]?.item.id ?? null)
        return
      case 'Home':
        event.preventDefault()
        moveFocusToItem(visibleNodes[0]?.item.id ?? null)
        return
      case 'End':
        event.preventDefault()
        moveFocusToItem(visibleNodes.at(-1)?.item.id ?? null)
        return
      case 'ArrowRight':
        if (currentItem.type !== 'folder' || !currentItem.children?.length) {
          return
        }

        event.preventDefault()

        if (!expandedFolderIds.has(currentItem.id)) {
          toggleFolder(currentItem.id)
          return
        }

        moveFocusToItem(currentItem.children[0]?.id ?? null)
        return
      case 'ArrowLeft':
        if (currentItem.type === 'folder' && expandedFolderIds.has(currentItem.id)) {
          event.preventDefault()
          toggleFolder(currentItem.id)
          return
        }

        if (node.parentFolderId) {
          event.preventDefault()
          moveFocusToItem(node.parentFolderId)
        }
        return
      case 'Enter':
      case ' ':
        if (currentItem.type !== 'folder') {
          return
        }

        event.preventDefault()
        toggleFolder(currentItem.id)
        return
      default:
        return
    }
  }

  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden">
      <div className="space-y-1 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Shared Workspace
        </p>
        <p className="sr-only" id="shared-workspace-tree-help">
          Use the arrow keys to move through files and folders. Press right arrow
          to expand a folder, left arrow to collapse it, and Enter or Space to
          toggle the focused folder.
        </p>
      </div>

      <div
        role="tree"
        aria-label="Shared workspace files"
        aria-describedby="shared-workspace-tree-help"
        className="min-w-0 rounded-2xl [content-visibility:auto]"
      >
        <TreeBranch
          items={items}
          shareSlug={shareSlug}
          selectedFileId={selectedFileId}
          expandedFolderIds={expandedFolderIds}
          activeItemId={resolvedActiveItemId}
          itemMetadata={itemMetadata}
          onToggleFolder={toggleFolder}
          onSelectFile={onSelectFile}
          onMoveFocus={setActiveItemId}
          onTreeKeyDown={handleTreeKeyDown}
          registerItemRef={(itemId, node) => {
            if (node) {
              itemRefs.current.set(itemId, node)
            } else {
              itemRefs.current.delete(itemId)
            }
          }}
        />
      </div>
    </div>
  )
}
