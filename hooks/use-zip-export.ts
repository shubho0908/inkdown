'use client'

import { useCallback, useState } from 'react'
import { fetchApi } from '@/lib/api'
import { toast } from 'sonner'

export function useZipExport() {
  const [isExporting, setIsExporting] = useState(false)

  const downloadZip = useCallback(
    async (
      url: string,
      filename: string,
      loadingMsg: string,
      successMsg: string,
      body?: Record<string, unknown>,
    ): Promise<void> => {
      setIsExporting(true)
      const toastId = toast.loading(loadingMsg)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetchApi(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Accept: 'application/zip',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        })

        clearTimeout(timeoutId)

        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment.')
        }

        if (response.status === 401) {
          throw new Error('Your session has expired. Please sign in again.')
        }

        if (response.status === 403) {
          const error = await response.json().catch(() => null)
          throw new Error(
            typeof error?.error === 'string'
              ? error.error
              : 'Request blocked. Please refresh and try again.',
          )
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Export failed' }))
          throw new Error(error.error || `Export failed: ${response.status}`)
        }

        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = objectUrl
        link.download = filename
        link.style.display = 'none'
        link.rel = 'noopener noreferrer'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

        toast.success(successMsg, { id: toastId })
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === 'AbortError'
            ? 'Export timed out. Please try again.'
            : error instanceof Error
              ? error.message
              : 'Export failed'
        toast.error(message, { id: toastId })
      } finally {
        clearTimeout(timeoutId)
        setIsExporting(false)
      }
    },
    [],
  )

  const exportWorkspace = useCallback(async (): Promise<void> => {
    if (isExporting) return

    const timestamp = new Date().toISOString().split('T')[0]
    await downloadZip(
      '/api/export/zip',
      `inkdown-export-${timestamp}.zip`,
      'Exporting workspace...',
      'Export complete',
    )
  }, [isExporting, downloadZip])

  const exportFolder = useCallback(
    async (folderId: string, folderName: string): Promise<void> => {
      if (isExporting) return

      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedName =
        folderName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim() ||
        'folder'
      await downloadZip(
        '/api/export/zip',
        `${sanitizedName}-${timestamp}.zip`,
        `Exporting ${folderName}...`,
        'Folder exported',
        { folderId },
      )
    },
    [isExporting, downloadZip],
  )

  return { isExporting, exportWorkspace, exportFolder }
}
