'use client'

import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from 'react'
import { FileUp, Move } from 'lucide-react'
import { TreeNode } from '@/components/file-tree-node'
import { canMoveTreeItem } from '@/lib/folder-tree'
import { cn } from '@/lib/utils'
import type { TreeItem } from '@/lib/types'

interface FileTreeProps {
  items: TreeItem[]
  selectedId: string | null
  emptyState?: ReactNode
  onImportFiles: (files: globalThis.File[], folderId: string | null, items?: DataTransferItemList) => void
  onSelect: (item: TreeItem) => void
  onMove: (item: TreeItem, targetFolderId: string | null) => void
  onCreateFile: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRename: (item: TreeItem) => void
  onDelete: (item: TreeItem) => void
  onTogglePublic?: (item: TreeItem) => void
  onDownloadFile?: (item: TreeItem) => void
  onExportFolder?: (folderId: string, folderName: string) => void
}

interface RootDropZoneProps {
  active: boolean
  mode: 'move' | 'import'
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}

function RootDropZone({
  active,
  mode,
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
      {mode === 'import' ? (
        <FileUp className="size-3.5" />
      ) : (
        <Move className="size-3.5" />
      )}
      {mode === 'import'
        ? 'Drop .md files to import to workspace root'
        : 'Drop to move to workspace root'}
    </div>
  )
}

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

function isExternalFileDragEvent(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes('Files')
}

function getDroppedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.files)
}

export function FileTree({
  items,
  selectedId,
  emptyState,
  onImportFiles,
  onSelect,
  onMove,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onTogglePublic,
  onDownloadFile,
  onExportFolder,
}: FileTreeProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | 'root' | null>(null)
  const [externalDropTargetId, setExternalDropTargetId] = useState<string | 'root' | null>(null)
  const [isExternalDragging, setIsExternalDragging] = useState(false)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set())

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key.toLowerCase() !== 'x') return
      if (isEditableElement(event.target)) return

      event.preventDefault()
      setExpandedFolderIds(new Set())
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRootDrop = () => {
    if (!draggedItem || !canDropToRoot) return
    onMove(draggedItem, null)
    setDraggedItemId(null)
    setDropTargetId(null)
  }

  const resetExternalDragState = () => {
    setExternalDropTargetId(null)
    setIsExternalDragging(false)
  }

  const handleRootZoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (isExternalFileDragEvent(event)) {
      event.stopPropagation()
      event.preventDefault()
      setIsExternalDragging(true)
      if (externalDropTargetId !== 'root') {
        setExternalDropTargetId('root')
      }
      return
    }

    event.stopPropagation()
    event.preventDefault()
    if (dropTargetId !== 'root') {
      setDropTargetId('root')
    }
  }

  const handleRootZoneDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    if (externalDropTargetId === 'root') {
      setExternalDropTargetId(null)
    }
    if (dropTargetId === 'root') {
      setDropTargetId(null)
    }
  }

  const handleRootZoneDrop = (event: DragEvent<HTMLDivElement>) => {
    if (isExternalFileDragEvent(event)) {
      event.stopPropagation()
      event.preventDefault()
      const files = getDroppedFiles(event)
      const items = event.dataTransfer.items

      resetExternalDragState()
      if (files.length === 0) return
      onImportFiles(files, null, items)
      return
    }

    event.stopPropagation()
    event.preventDefault()
    handleRootDrop()
  }

  const handleToggleFolder = (itemId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current)

      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }

      return next
    })
  }

  const handleExpandFolder = (itemId: string) => {
    setExpandedFolderIds((current) => {
      if (current.has(itemId)) {
        return current
      }

      const next = new Set(current)
      next.add(itemId)
      return next
    })
  }

  const isFolderExpanded = (itemId: string) => expandedFolderIds.has(itemId)
  const isRootDropTargetActive = dropTargetId === 'root' || externalDropTargetId === 'root'
  const shouldShowRootDropZone = (draggedItem && canDropToRoot) || isExternalDragging
  const shouldShowBottomRootDropZone =
    shouldShowRootDropZone && items.length > 0 && !isExternalDragging

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-2xl',
        isRootDropTargetActive && 'bg-accent/30',
      )}
      onDragOver={(event) => {
        if (isExternalFileDragEvent(event)) {
          setIsExternalDragging(true)
          if (!isTreeBackgroundDragEvent(event)) return
          event.preventDefault()
          if (externalDropTargetId !== 'root') {
            setExternalDropTargetId('root')
          }
          return
        }

        if (!isTreeBackgroundDragEvent(event)) return
        if (!canDropToRoot) return
        event.preventDefault()
        if (dropTargetId !== 'root') {
          setDropTargetId('root')
        }
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        resetExternalDragState()
        if (dropTargetId === 'root') {
          setDropTargetId(null)
        }
      }}
      onDrop={(event) => {
        if (isExternalFileDragEvent(event)) {
          if (!isTreeBackgroundDragEvent(event)) return
          event.preventDefault()
          const files = getDroppedFiles(event)
          const items = event.dataTransfer.items

          resetExternalDragState()
          if (files.length === 0) return
          onImportFiles(files, null, items)
          return
        }

        if (!isTreeBackgroundDragEvent(event)) return
        if (!canDropToRoot) return
        event.preventDefault()
        handleRootDrop()
      }}
    >
      {shouldShowRootDropZone && (
        <RootDropZone
          active={isRootDropTargetActive}
          mode={isExternalDragging ? 'import' : 'move'}
          onDragOver={handleRootZoneDragOver}
          onDragLeave={handleRootZoneDragLeave}
          onDrop={handleRootZoneDrop}
        />
      )}
      {items.length === 0 && emptyState ? (
        <div
          className={cn(
            'mx-1 min-h-36 rounded-2xl border border-dashed p-4 transition-colors',
            externalDropTargetId === 'root'
              ? 'border-primary/50 bg-primary/10'
              : 'border-border/70 bg-background/40',
          )}
        >
          {emptyState}
        </div>
      ) : null}
      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          level={0}
          selectedId={selectedId}
          isExpanded={expandedFolderIds.has(item.id)}
          draggedItemId={draggedItemId}
          dropTargetId={dropTargetId}
          externalDropTargetId={externalDropTargetId}
          draggedItem={draggedItem}
          canDropIntoFolder={canDropIntoFolder}
          onDragStart={setDraggedItemId}
          onDragEnd={() => {
            setDraggedItemId(null)
            setDropTargetId(null)
            resetExternalDragState()
          }}
          onDropTargetChange={setDropTargetId}
          onExternalDropTargetChange={setExternalDropTargetId}
          onExternalDragActiveChange={setIsExternalDragging}
          onImportFiles={onImportFiles}
          isFolderExpanded={isFolderExpanded}
          onToggleExpanded={handleToggleFolder}
          onExpand={handleExpandFolder}
          onSelect={onSelect}
          onMove={onMove}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          onDelete={onDelete}
          onTogglePublic={onTogglePublic}
          onDownloadFile={onDownloadFile}
          onExportFolder={onExportFolder}
        />
      ))}
      {shouldShowBottomRootDropZone && (
        <RootDropZone
          active={isRootDropTargetActive}
          mode={isExternalDragging ? 'import' : 'move'}
          onDragOver={handleRootZoneDragOver}
          onDragLeave={handleRootZoneDragLeave}
          onDrop={handleRootZoneDrop}
        />
      )}
    </div>
  )
}
