'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ShareDialog } from '@/components/share-dialog'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image,
  CheckSquare,
  Minus,
  Share2,
  Save,
  Eye,
  Edit3,
  Columns2,
} from 'lucide-react'
import { File } from '@/lib/types'
import { MarkdownPreview } from '@/components/markdown-preview'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MarkdownEditorProps {
  fileId: string
}

type ViewMode = 'edit' | 'preview' | 'split'

export function MarkdownEditor({ fileId }: MarkdownEditorProps) {
  const { data: file, isLoading } = useSWR<File>(
    fileId ? `/api/files/${fileId}` : null,
    fetcher
  )

  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [shareOpen, setShareOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update content when file changes
  useEffect(() => {
    if (file) {
      setContent(file.content)
      setHasChanges(false)
    }
  }, [file])

  // Auto-save with debounce
  const saveContent = useCallback(async (newContent: string) => {
    if (!fileId) return
    setIsSaving(true)
    try {
      await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
      setHasChanges(false)
      mutate(`/api/files/${fileId}`)
    } finally {
      setIsSaving(false)
    }
  }, [fileId])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new auto-save timeout (1.5 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent)
    }, 1500)
  }

  // Manual save
  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveContent(content)
  }

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [content])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end)

    handleContentChange(newContent)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = content.lastIndexOf('\n', start - 1) + 1
    const newContent =
      content.substring(0, lineStart) + prefix + content.substring(lineStart)

    handleContentChange(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const handleShareToggle = async (isPublic: boolean) => {
    if (!file) return
    const res = await fetch(`/api/files/${file.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: isPublic }),
    })
    if (res.ok) {
      mutate(`/api/files/${fileId}`)
      mutate('/api/files')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        File not found
      </div>
    )
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Strikethrough, action: () => insertMarkdown('~~', '~~'), title: 'Strikethrough' },
    { type: 'divider' as const },
    { icon: Heading1, action: () => insertAtLineStart('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertAtLineStart('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertAtLineStart('### '), title: 'Heading 3' },
    { type: 'divider' as const },
    { icon: List, action: () => insertAtLineStart('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertAtLineStart('1. '), title: 'Numbered List' },
    { icon: CheckSquare, action: () => insertAtLineStart('- [ ] '), title: 'Task List' },
    { type: 'divider' as const },
    { icon: Quote, action: () => insertAtLineStart('> '), title: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`', '`'), title: 'Inline Code' },
    { icon: Minus, action: () => insertMarkdown('\n---\n'), title: 'Horizontal Rule' },
    { type: 'divider' as const },
    { icon: Link2, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <h1 className="font-medium">{file.name}</h1>
        {hasChanges && (
          <span className="text-xs text-muted-foreground">(unsaved)</span>
        )}
        {isSaving && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
        <div className="flex-1" />
        
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="edit" className="h-7 px-2">
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="split" className="h-7 px-2">
              <Columns2 className="mr-1.5 h-3.5 w-3.5" />
              Split
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 px-2">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="mr-1.5 h-4 w-4" />
          Share
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
          <Save className="mr-1.5 h-4 w-4" />
          Save
        </Button>
      </div>

      {/* Toolbar */}
      {viewMode !== 'preview' && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
          {toolbarButtons.map((btn, i) =>
            btn.type === 'divider' ? (
              <div key={i} className="mx-1 h-6 w-px bg-border" />
            ) : (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={btn.action}
                title={btn.title}
              >
                <btn.icon className="h-4 w-4" />
                <span className="sr-only">{btn.title}</span>
              </Button>
            )
          )}
        </div>
      )}

      {/* Editor/Preview */}
      <div className="flex flex-1 overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={viewMode === 'split' ? 'w-1/2 border-r' : 'w-full'}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="h-full w-full resize-none bg-background p-4 font-mono text-sm focus:outline-none"
              placeholder="Start writing markdown..."
              spellCheck={false}
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
            <div className="h-full overflow-auto p-4">
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        fileName={file.name}
        isPublic={file.is_public}
        slug={file.slug}
        onTogglePublic={handleShareToggle}
      />
    </div>
  )
}
