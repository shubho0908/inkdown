'use client'

import {
  Columns2,
  Download,
  Edit3,
  Eye,
  Save,
  Share2,
} from 'lucide-react'
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
  onDownload: () => void
  onSave: () => void
}

export function MarkdownEditorHeader({
  fileName,
  isSaving,
  hasChanges,
  viewMode,
  onViewModeChange,
  onShare,
  onDownload,
  onSave,
}: MarkdownEditorHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:px-4 sm:py-2">
      <div className="min-w-0 md:flex-1">
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

      <div className="grid w-full grid-cols-3 gap-2 md:order-3 md:w-auto md:flex-none">
        <Button
          variant="outline"
          size="sm"
          className="min-w-0 w-full md:w-auto"
          onClick={onShare}
        >
          <Share2 className="mr-1.5 size-4" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="min-w-0 w-full md:w-auto"
          onClick={onDownload}
        >
          <Download className="mr-1.5 size-4" />
          Download
        </Button>
        <Button
          size="sm"
          className="min-w-0 w-full md:w-auto"
          onClick={onSave}
          disabled={!hasChanges || isSaving}
        >
          <Save className="mr-1.5 size-4" />
          Save
        </Button>
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(value) => onViewModeChange(value as ViewMode)}
        className="min-w-0 w-full md:order-2 md:w-auto"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl p-1 md:inline-flex md:w-auto md:grid-cols-none">
          <TabsTrigger
            value="edit"
            className="h-9 min-w-0 rounded-xl px-2.5 md:h-8 md:px-3"
          >
            <span className="flex size-4 items-center justify-center">
              <Edit3 className="size-3.5" />
            </span>
            Edit
          </TabsTrigger>
          <TabsTrigger
            value="split"
            className="h-9 min-w-0 rounded-xl px-2.5 md:h-8 md:px-3"
          >
            <span className="flex size-4 items-center justify-center">
              <Columns2 className="size-3.5" />
            </span>
            Split
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="h-9 min-w-0 rounded-xl px-2.5 md:h-8 md:px-3"
          >
            <span className="flex size-4 items-center justify-center">
              <Eye className="size-3.5" />
            </span>
            Preview
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
