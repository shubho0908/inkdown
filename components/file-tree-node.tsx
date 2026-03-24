'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TreeItem } from '@/lib/types'

interface TreeNodeProps {
  item: TreeItem
  level: number
  selectedId: string | null
  draggedItemId: string | null
  dropTargetId: string | 'root' | null
  draggedItem?: TreeItem
  canDropIntoFolder: (draggedItem: TreeItem | undefined, targetFolderId: string | null) => boolean
  onDragStart: (itemId: string) => void
  onDragEnd: () => void
  onDropTargetChange: (targetId: string | 'root' | null) => void
  onSelect: (item: TreeItem) => void
  onMove: (item: TreeItem, targetFolderId: string | null) => void
  onCreateFile: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRename: (item: TreeItem) => void
  onDelete: (item: TreeItem) => void
  onTogglePublic?: (item: TreeItem) => void
}

export function TreeNode({
  item,
  level,
  selectedId,
  draggedItemId,
  dropTargetId,
  draggedItem,
  canDropIntoFolder,
  onDragStart,
  onDragEnd,
  onDropTargetChange,
  onSelect,
  onMove,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onTogglePublic,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isFolder = item.type === 'folder'
  const isSelected = selectedId === item.id
  const isDragging = draggedItemId === item.id
  const isDropTarget = dropTargetId === item.id
  const canDropOnThisFolder = isFolder && canDropIntoFolder(draggedItem, item.id)

  const handleDrop = () => {
    if (!canDropOnThisFolder || !draggedItem) return
    onMove(draggedItem, item.id)
    onDragEnd()
  }

  return (
    <div>
      <div
        className={cn(
          'group flex min-w-0 items-center gap-1 rounded-xl border border-transparent px-2 py-2 text-sm transition-colors hover:bg-accent/70',
          isSelected && 'border-border bg-accent/80 shadow-xs',
          isDragging && 'cursor-grabbing opacity-55',
          isDropTarget &&
            canDropOnThisFolder &&
            'border-primary/60 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onDragOver={(event) => {
          if (!canDropOnThisFolder) return
          event.preventDefault()
          if (!isExpanded) {
            setIsExpanded(true)
          }
          if (dropTargetId !== item.id) {
            onDropTargetChange(item.id)
          }
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
          if (dropTargetId === item.id) {
            onDropTargetChange(null)
          }
        }}
        onDrop={(event) => {
          event.preventDefault()
          handleDrop()
        }}
      >
        <button
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', item.id)
            onDragStart(item.id)
          }}
          onDragEnd={onDragEnd}
          className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground/55 transition-colors hover:text-muted-foreground"
          aria-label={`Drag ${item.name}`}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {isFolder ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-4 w-4 shrink-0 items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <button
          onClick={() => onSelect(item)}
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left"
        >
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            )
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{item.name}</span>
          {!isFolder && item.is_public && (
            <Share2 className="h-3 w-3 shrink-0 text-primary" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isFolder && (
              <>
                <DropdownMenuItem onClick={() => onCreateFile(item.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateFolder(item.id)}>
                  <Folder className="mr-2 h-4 w-4" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isFolder && onTogglePublic && (
              <>
                <DropdownMenuItem onClick={() => onTogglePublic(item)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {item.is_public ? 'Make Private' : 'Make Public'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onRename(item)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(item)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isFolder && isExpanded && item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              draggedItemId={draggedItemId}
              dropTargetId={dropTargetId}
              draggedItem={draggedItem}
              canDropIntoFolder={canDropIntoFolder}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropTargetChange={onDropTargetChange}
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
      )}
    </div>
  )
}
