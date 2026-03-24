'use client'

import { Columns2, Edit3, Eye, Save, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type ViewMode = 'edit' | 'preview' | 'split'

interface MarkdownEditorHeaderProps {
  fileName: string
  isSaving: boolean
  hasChanges: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onShare: () => void
  onSave: () => void
}

export function MarkdownEditorHeader({
  fileName,
  isSaving,
  hasChanges,
  viewMode,
  onViewModeChange,
  onShare,
  onSave,
}: MarkdownEditorHeaderProps) {
  return (
    <div className="flex min-h-14 flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-medium">{fileName}</h1>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <span>Saving...</span>
          ) : hasChanges ? (
            <span>Unsaved changes</span>
          ) : (
            <span>All changes saved</span>
          )}
        </div>
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(value) => onViewModeChange(value as ViewMode)}
        className="order-3 w-full sm:order-none sm:w-auto"
      >
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl p-1 sm:w-auto">
          <TabsTrigger
            value="edit"
            className="h-9 shrink-0 rounded-xl px-3.5 sm:h-8 sm:px-3"
          >
            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </TabsTrigger>
          <TabsTrigger
            value="split"
            className="h-9 shrink-0 rounded-xl px-3.5 sm:h-8 sm:px-3"
          >
            <Columns2 className="mr-1.5 h-3.5 w-3.5" />
            Split
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="h-9 shrink-0 rounded-xl px-3.5 sm:h-8 sm:px-3"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Button
        variant="outline"
        size="sm"
        className="flex-1 sm:flex-none"
        onClick={onShare}
      >
        <Share2 className="mr-1.5 h-4 w-4" />
        Share
      </Button>
      <Button
        size="sm"
        className="flex-1 sm:flex-none"
        onClick={onSave}
        disabled={!hasChanges || isSaving}
      >
        <Save className="mr-1.5 h-4 w-4" />
        Save
      </Button>
    </div>
  )
}
