'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

function generateClientToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function getStoredToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )client-token=([^;]*)/)
  return match ? match[1] : null
}

function setStoredToken(token: string): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + 3600000).toUTCString()
  document.cookie = `client-token=${token}; expires=${expires}; path=/; SameSite=Strict`
}

export function useZipExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [clientToken, setClientToken] = useState<string>('')

  useEffect(() => {
    let token = getStoredToken()
    if (!token) {
      token = generateClientToken()
      setStoredToken(token)
    }
    setClientToken(token)
  }, [])

  const downloadZip = useCallback(async (
    url: string, 
    filename: string, 
    loadingMsg: string, 
    successMsg: string
  ): Promise<void> => {
    if (!clientToken) {
      toast.error('Security token not ready. Please try again.')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading(loadingMsg)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/zip',
          'X-Client-Token': clientToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      })

      clearTimeout(timeoutId)

      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment.')
      }

      if (response.status === 403) {
        throw new Error('Request blocked. Please refresh and try again.')
      }

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
      link.rel = 'noopener noreferrer'
      
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
  }, [clientToken])

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
