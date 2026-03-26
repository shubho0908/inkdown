'use client'

import { useMemo, useState, type DragEvent } from 'react'
import { Move } from 'lucide-react'
import { TreeNode } from '@/components/file-tree-node'
import { canMoveTreeItem } from '@/lib/folder-tree'
import { cn } from '@/lib/utils'
import type { TreeItem } from '@/lib/types'

interface FileTreeProps {
  items: TreeItem[]
  selectedId: string | null
  onSelect: (item: TreeItem) => void
  onMove: (item: TreeItem, targetFolderId: string | null) => void
  onCreateFile: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRename: (item: TreeItem) => void
  onDelete: (item: TreeItem) => void
  onTogglePublic?: (item: TreeItem) => void
}

interface RootDropZoneProps {
  active: boolean
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}

function RootDropZone({
  active,
  onDragOver,
  onDragLeave,
  onDrop,
}: RootDropZoneProps) {
  return (
    <div
      className={cn(
        'mx-1 flex min-h-9 items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors',
        active
          ? 'border-primary/50 bg-primary/10 text-foreground'
          : 'border-border/70 bg-background/40',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Move className="h-3.5 w-3.5" />
      Drop to move to workspace root
    </div>
  )
}

export function FileTree({
  items,
  selectedId,
  onSelect,
  onMove,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onTogglePublic,
}: FileTreeProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | 'root' | null>(null)

  const itemIndex = useMemo(() => {
    const map = new Map<string, TreeItem>()

    const visit = (treeItems: TreeItem[]) => {
      treeItems.forEach((treeItem) => {
        map.set(treeItem.id, treeItem)
        if (treeItem.children?.length) {
          visit(treeItem.children)
        }
      })
    }

    visit(items)

    return map
  }, [items])

  const folderIndex = useMemo(
    () =>
      Array.from(itemIndex.values())
        .filter((item): item is TreeItem & { type: 'folder' } => item.type === 'folder')
        .map(({ id, parent_id }) => ({ id, parent_id })),
    [itemIndex],
  )

  const isTreeBackgroundDragEvent = (event: DragEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null

    return !target?.closest('[data-tree-node-id]')
  }

  const canDropIntoFolder = (
    draggedItem: TreeItem | undefined,
    targetFolderId: string | null,
  ) => {
    if (!draggedItem) return false
    return canMoveTreeItem(folderIndex, draggedItem, targetFolderId)
  }

  const draggedItem = draggedItemId ? itemIndex.get(draggedItemId) : undefined
  const canDropToRoot = canDropIntoFolder(draggedItem, null)

  const handleRootDrop = () => {
    if (!draggedItem || !canDropToRoot) return
    onMove(draggedItem, null)
    setDraggedItemId(null)
    setDropTargetId(null)
  }

  const handleRootZoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation()
    event.preventDefault()
    if (dropTargetId !== 'root') {
      setDropTargetId('root')
    }
  }

  const handleRootZoneDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    if (dropTargetId === 'root') {
      setDropTargetId(null)
    }
  }

  const handleRootZoneDrop = (event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation()
    event.preventDefault()
    handleRootDrop()
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-2xl',
        dropTargetId === 'root' && 'bg-accent/30',
      )}
      onDragOver={(event) => {
        if (!isTreeBackgroundDragEvent(event)) return
        if (!canDropToRoot) return
        event.preventDefault()
        if (dropTargetId !== 'root') {
          setDropTargetId('root')
        }
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        if (dropTargetId === 'root') {
          setDropTargetId(null)
        }
      }}
      onDrop={(event) => {
        if (!isTreeBackgroundDragEvent(event)) return
        if (!canDropToRoot) return
        event.preventDefault()
        handleRootDrop()
      }}
    >
      {draggedItem && canDropToRoot && (
        <RootDropZone
          active={dropTargetId === 'root'}
          onDragOver={handleRootZoneDragOver}
          onDragLeave={handleRootZoneDragLeave}
          onDrop={handleRootZoneDrop}
        />
      )}
      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          level={0}
          selectedId={selectedId}
          draggedItemId={draggedItemId}
          dropTargetId={dropTargetId}
          draggedItem={draggedItem}
          canDropIntoFolder={canDropIntoFolder}
          onDragStart={setDraggedItemId}
          onDragEnd={() => {
            setDraggedItemId(null)
            setDropTargetId(null)
          }}
          onDropTargetChange={setDropTargetId}
          onSelect={onSelect}
          onMove={onMove}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          onDelete={onDelete}
          onTogglePublic={onTogglePublic}
        />
      ))}
      {draggedItem && canDropToRoot && items.length > 0 && (
        <RootDropZone
          active={dropTargetId === 'root'}
          onDragOver={handleRootZoneDragOver}
          onDragLeave={handleRootZoneDragLeave}
          onDrop={handleRootZoneDrop}
        />
      )}
    </div>
  )
}
