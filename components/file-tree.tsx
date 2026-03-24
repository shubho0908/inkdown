'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, MoreHorizontal, Plus, Pencil, Trash2, Share2 } from 'lucide-react'
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
}: FileTreeProps) {
  return (
    <div className="flex flex-col gap-1">
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
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isFolder = item.type === 'folder'
  const isSelected = selectedId === item.id

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
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
              onSelect={onSelect}
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
