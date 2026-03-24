'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { MarkdownEditor } from '@/components/markdown-editor'
import { FileText } from 'lucide-react'

export default function DashboardPage() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  return (
    <div className="flex h-svh">
      <DashboardSidebar
        selectedFileId={selectedFileId}
        onFileSelect={setSelectedFileId}
      />
      <main className="flex-1 overflow-hidden">
        {selectedFileId ? (
          <MarkdownEditor fileId={selectedFileId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-medium">No file selected</p>
              <p className="text-sm">Select a file from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
