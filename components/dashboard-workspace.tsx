'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { MarkdownEditor } from '@/components/markdown-editor'

export function DashboardWorkspace() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  return (
    <div className="flex min-h-svh flex-col md:h-svh md:grid md:grid-cols-[var(--workspace-sidebar-width)_minmax(0,1fr)]">
      <DashboardSidebar
        selectedFileId={selectedFileId}
        onFileSelect={setSelectedFileId}
      />
      <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        {selectedFileId ? (
          <MarkdownEditor fileId={selectedFileId} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-12 text-center text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8" />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="font-medium">No file selected</p>
              <p className="text-sm">
                Select a file from the workspace or create a new one to start writing.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
