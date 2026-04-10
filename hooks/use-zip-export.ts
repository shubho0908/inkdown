'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export function useZipExport() {
  const [isExporting, setIsExporting] = useState(false)

  const downloadZip = useCallback(async (url: string, filename: string, loadingMsg: string, successMsg: string): Promise<void> => {
    setIsExporting(true)
    const toastId = toast.loading(loadingMsg)

    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(error.error || `Export failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url_obj = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url_obj
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => URL.revokeObjectURL(url_obj), 1000)
      
      toast.success(successMsg, { id: toastId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      toast.error(message, { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }, [])

  const exportWorkspace = useCallback(async (): Promise<void> => {
    if (isExporting) return
    
    const timestamp = new Date().toISOString().split('T')[0]
    await downloadZip(
      '/api/export/zip',
      `inkdown-export-${timestamp}.zip`,
      'Exporting workspace...',
      'Export complete'
    )
  }, [isExporting, downloadZip])

  const exportFolder = useCallback(async (folderId: string, folderName: string): Promise<void> => {
    if (isExporting) return
    
    const timestamp = new Date().toISOString().split('T')[0]
    const sanitizedName = folderName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim() || 'folder'
    await downloadZip(
      `/api/export/zip?folderId=${encodeURIComponent(folderId)}`,
      `${sanitizedName}-${timestamp}.zip`,
      `Exporting ${folderName}...`,
      'Folder exported'
    )
  }, [isExporting, downloadZip])

  return { isExporting, exportWorkspace, exportFolder }
}
