'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { MarkdownEditor } from '@/components/markdown-editor'
import { FileText, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardPage() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId)
    setSidebarOpen(false) // Close mobile sidebar on file select
  }

  return (
    <div className="flex h-svh flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <DashboardSidebar
              selectedFileId={selectedFileId}
              onFileSelect={handleFileSelect}
            />
          </SheetContent>
        </Sheet>
        <InkdownLogo size="sm" />
        <ThemeToggle />
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar
          selectedFileId={selectedFileId}
          onFileSelect={setSelectedFileId}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {selectedFileId ? (
          <MarkdownEditor fileId={selectedFileId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-medium">No file selected</p>
              <p className="mt-1 text-sm">
                <span className="md:hidden">Tap the menu to select a file</span>
                <span className="hidden md:inline">Select a file from the sidebar or create a new one</span>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
