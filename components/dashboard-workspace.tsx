'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { MarkdownEditor } from '@/components/markdown-editor'

export function DashboardWorkspace() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.add('workspace-scroll-locked')
    document.body.classList.add('workspace-scroll-locked')

    return () => {
      document.documentElement.classList.remove('workspace-scroll-locked')
      document.body.classList.remove('workspace-scroll-locked')
    }
  }, [])

  return (
    <div className="flex h-screen min-h-screen w-full min-w-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh supports-[height:100dvh]:min-h-dvh md:grid md:grid-cols-[var(--workspace-sidebar-width)_minmax(0,1fr)]">
      <DashboardSidebar
        selectedFileId={selectedFileId}
        onFileSelect={setSelectedFileId}
      />
      <main className="flex h-full min-h-0 min-w-0 w-full flex-1 overflow-hidden bg-background">
        {selectedFileId ? (
          <MarkdownEditor fileId={selectedFileId} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-12 text-center text-muted-foreground">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <FileText className="size-8" />
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
