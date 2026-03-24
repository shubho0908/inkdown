'use client'

import { useMemo, useState } from 'react'
import { Move } from 'lucide-react'
import { TreeNode } from '@/components/file-tree-node'
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

  const canDropIntoFolder = (
    draggedItem: TreeItem | undefined,
    targetFolderId: string | null,
  ) => {
    if (!draggedItem) return false

    if (draggedItem.type === 'file') {
      return draggedItem.parent_id !== targetFolderId
    }

    if (draggedItem.id === targetFolderId) return false
    if (draggedItem.parent_id === targetFolderId) return false

    if (targetFolderId === null) return true

    let current = itemIndex.get(targetFolderId)
    while (current) {
      if (current.id === draggedItem.id) {
        return false
      }

      current = current.parent_id ? itemIndex.get(current.parent_id) : undefined
    }

    return true
  }

  const draggedItem = draggedItemId ? itemIndex.get(draggedItemId) : undefined

  const handleRootDrop = () => {
    if (!draggedItem || !canDropIntoFolder(draggedItem, null)) return
    onMove(draggedItem, null)
    setDraggedItemId(null)
    setDropTargetId(null)
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-2xl',
        dropTargetId === 'root' && 'bg-accent/30',
      )}
      onDragOver={(event) => {
        if (!draggedItem || !canDropIntoFolder(draggedItem, null)) return
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
        event.preventDefault()
        handleRootDrop()
      }}
    >
      {draggedItem && canDropIntoFolder(draggedItem, null) && (
        <div
          className={cn(
            'mx-1 mb-2 flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors',
            dropTargetId === 'root'
              ? 'border-primary/50 bg-primary/10 text-foreground'
              : 'border-border/70',
          )}
        >
          <Move className="h-3.5 w-3.5" />
          Drop here to move to root
        </div>
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
    </div>
  )
}
