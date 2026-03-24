'use client'

import { FilePlus, PanelLeftOpen } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

interface DashboardMobileHeaderProps {
  selectedFileName?: string | null
  onOpenWorkspace: () => void
  onCreateFile: () => void
}

export function DashboardMobileHeader({
  selectedFileName,
  onOpenWorkspace,
  onCreateFile,
}: DashboardMobileHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-14 items-center gap-2 px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenWorkspace}
          aria-label="Open workspace"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {selectedFileName ?? 'Your workspace'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {selectedFileName
              ? 'Editing markdown'
              : 'Open the file tree or create a new file'}
          </p>
        </div>
        <ThemeToggle />
        <Button
          variant="outline"
          size="icon"
          onClick={onCreateFile}
          aria-label="Create file"
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
