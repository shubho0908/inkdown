'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ShareDialog } from '@/components/share-dialog'
import { MarkdownEditorHeader, type ViewMode } from '@/components/markdown-editor-header'
import { MarkdownEditorLoading } from '@/components/markdown-editor-loading'
import { MarkdownEditorToolbar } from '@/components/markdown-editor-toolbar'
import { MarkdownPreview } from '@/components/markdown-preview'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useToggleFilePublicMutation,
  useUpdateFileMutation,
} from '@/hooks/workspace/use-file-mutations'
import { useFileQuery } from '@/hooks/workspace/use-workspace-queries'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  fileId: string
}

export function MarkdownEditor({ fileId }: MarkdownEditorProps) {
  const isMobile = useIsMobile()
  const { data: file, isLoading } = useFileQuery(fileId)

  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [shareOpen, setShareOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateFileMutation = useUpdateFileMutation({
    onSuccess: () => {
      setHasChanges(false)
      setIsSaving(false)
    },
  })
  const toggleFilePublicMutation = useToggleFilePublicMutation()

  useEffect(() => {
    if (file) {
      setContent(file.content)
      setHasChanges(false)
    }
  }, [file?.id])

  const saveContent = useCallback(
    async (newContent: string) => {
      if (!fileId) return
      setIsSaving(true)

      try {
        await updateFileMutation.mutateAsync({
          fileId,
          data: { content: newContent },
        })
      } catch {
        setIsSaving(false)
      }
    },
    [fileId, updateFileMutation],
  )

  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveContent(content)
  }, [content, saveContent])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent)
    }, 1500)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('edit')
    }
  }, [isMobile, viewMode])

  const insertMarkdown = (before: string, after = '') => {
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
    await toggleFilePublicMutation.mutateAsync({ file, isPublic })
  }

  if (isLoading) {
    return <MarkdownEditorLoading />
  }

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        File not found
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <MarkdownEditorHeader
        fileName={file.name}
        isSaving={isSaving}
        hasChanges={hasChanges}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onShare={() => setShareOpen(true)}
        onSave={handleSave}
      />

      {viewMode !== 'preview' && (
        <MarkdownEditorToolbar
          onWrap={insertMarkdown}
          onLinePrefix={insertAtLineStart}
        />
      )}

      <div
        className={cn(
          'flex min-h-0 flex-1 overflow-hidden',
          viewMode === 'split' && isMobile ? 'flex-col' : 'flex-row',
        )}
      >
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={cn(
              'min-h-0 min-w-0 bg-background',
              viewMode === 'split'
                ? cn('flex-1', isMobile ? 'border-b' : 'border-r')
                : 'w-full',
            )}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => handleContentChange(event.target.value)}
              className="h-full min-h-[18rem] w-full resize-none bg-background p-4 font-mono text-sm leading-6 focus:outline-none sm:p-6"
              placeholder="Start writing markdown..."
              spellCheck={false}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={cn(
              'min-h-0 min-w-0',
              viewMode === 'split' ? 'flex-1' : 'w-full',
            )}
          >
            <div className="h-full overflow-auto p-4 sm:p-6">
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}
      </div>

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
