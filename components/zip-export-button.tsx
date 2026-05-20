'use client'

import { Download, Loader2 } from 'lucide-react'
import { useZipExport } from '@/hooks/use-zip-export'
import { Button } from '@/components/ui/button'

interface ZipExportButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ZipExportButton({
  variant = 'outline',
  size = 'sm',
  className,
}: ZipExportButtonProps) {
  const { isExporting, exportWorkspace } = useZipExport()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isExporting}
      onClick={exportWorkspace}
    >
      {isExporting ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" />
      ) : (
        <Download className="mr-1.5 size-4" />
      )}
      {isExporting ? 'Exporting...' : 'Export Workspace'}
    </Button>
  )
}
