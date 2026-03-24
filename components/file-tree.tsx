'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Share2,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TreeItem } from '@/lib/types'

interface FileTreeProps {
  items: TreeItem[]
  selectedId: string | null
  onSelect: (item: TreeItem) => void
  onCreateFile: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRename: (item: TreeItem) => void
  onDelete: (item: TreeItem) => void
  onTogglePublic?: (item: TreeItem) => void
  onDrop?: (draggedId: string, targetFolderId: string | null) => void
}

export function FileTree({
  items,
  selectedId,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onTogglePublic,
  onDrop,
}: FileTreeProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          onDelete={onDelete}
          onTogglePublic={onTogglePublic}
          onDrop={onDrop}
        />
      ))}
    </div>
  )
}

interface TreeNodeProps {
  item: TreeItem
  level: number
  selectedId: string | null
  onSelect: (item: TreeItem) => void
  onCreateFile: (folderId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRename: (item: TreeItem) => void
  onDelete: (item: TreeItem) => void
  onTogglePublic?: (item: TreeItem) => void
  onDrop?: (draggedId: string, targetFolderId: string | null) => void
}

function TreeNode({
  item,
  level,
  selectedId,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onTogglePublic,
  onDrop,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const isFolder = item.type === 'folder'
  const isSelected = selectedId === item.id

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFolder) {
      setIsDragOver(true)
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (!isFolder || !onDrop) return

    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId && draggedId !== item.id) {
      onDrop(draggedId, item.id)
      // Auto-expand folder when something is dropped
      setIsExpanded(true)
    }
  }

  return (
    <div>
      <div
        draggable={item.type === 'file'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
          'hover:bg-accent',
          isSelected && 'bg-accent',
          isDragOver && isFolder && 'bg-primary/20 ring-2 ring-primary/50'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Drag handle for files */}
        {item.type === 'file' && (
          <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50 opacity-0 group-hover:opacity-100 active:cursor-grabbing" />
        )}

        {/* Folder expand/collapse */}
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

        {/* Item content */}
        <button
          onClick={() => onSelect(item)}
          className="flex flex-1 items-center gap-2 overflow-hidden"
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

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
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
                  {item.is_public ? 'Sharing Settings' : 'Share'}
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

      {/* Children */}
      {isFolder && isExpanded && item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onRename={onRename}
              onDelete={onDelete}
              onTogglePublic={onTogglePublic}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
}
