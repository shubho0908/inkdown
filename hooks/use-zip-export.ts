'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export function useZipExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportWorkspace = useCallback(async (): Promise<void> => {
    if (isExporting) return

    setIsExporting(true)
    const toastId = toast.loading('Exporting workspace...')

    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/export/zip', {
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(error.error || `Export failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = `inkdown-export-${new Date().toISOString().split('T')[0]}.zip`
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      
      toast.success('Export complete', { id: toastId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      toast.error(message, { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }, [isExporting])

  return { isExporting, exportWorkspace }
}
