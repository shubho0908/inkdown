'use client'

import { startTransition, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { FileText, FolderOpen, Share2 } from 'lucide-react'
import { MarkdownPreview } from '@/components/markdown-preview'
import { PublicFolderBrowser } from '@/components/public-folder-browser'
import { fetchJson } from '@/lib/api'
import type { PublicFolderFileRecord } from '@/lib/public-folders'
import type { TreeItem } from '@/lib/types'

interface SharedFolderViewerProps {
  shareSlug: string
  folderName: string
  filesCount: number
  subfolderCount: number
  treeItems: TreeItem[]
  initialFile: PublicFolderFileRecord | null
  fallbackFileId: string | null
}

function buildSelectedFileUrl(fileId: string | null) {
  const url = new URL(window.location.href)

  if (fileId) {
    url.searchParams.set('file', fileId)
  } else {
    url.searchParams.delete('file')
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function SharedFolderViewer({
  shareSlug,
  folderName,
  filesCount,
  subfolderCount,
  treeItems,
  initialFile,
  fallbackFileId,
}: SharedFolderViewerProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    initialFile?.id ?? null,
  )

  const { data: selectedFile, isFetching } = useQuery({
    queryKey: ['public-folder', shareSlug, 'file', selectedFileId],
    queryFn: () =>
      fetchJson<PublicFolderFileRecord>(
        `/api/public/folders/${shareSlug}/files/${selectedFileId}`,
      ),
    enabled: Boolean(selectedFileId),
    staleTime: 5 * 60_000,
    initialData:
      initialFile && initialFile.id === selectedFileId ? initialFile : undefined,
    placeholderData: (previousData) => previousData,
  })

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const fileId = params.get('file')
      setSelectedFileId(fileId ?? fallbackFileId)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [fallbackFileId])

  useEffect(() => {
    const currentFileId = new URLSearchParams(window.location.search).get('file')

    if (currentFileId === selectedFileId) {
      return
    }

    window.history.replaceState(window.history.state, '', buildSelectedFileUrl(selectedFileId))
  }, [selectedFileId])

  const handleSelectFile = (fileId: string) => {
    if (fileId === selectedFileId) {
      return
    }

    window.history.pushState(window.history.state, '', buildSelectedFileUrl(fileId))
    startTransition(() => {
      setSelectedFileId(fileId)
    })
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start">
      <aside className="min-w-0 rounded-2xl border bg-card p-3 shadow-sm sm:p-4 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:self-start lg:overflow-hidden">
        <div className="border-b px-2 pb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="min-w-0 text-base font-semibold leading-tight sm:text-lg">
                  {folderName}
                </h1>
                <Share2 className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {filesCount} {filesCount === 1 ? 'file' : 'files'}
                {' · '}
                {subfolderCount} {subfolderCount === 1 ? 'subfolder' : 'subfolders'}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 pt-3 lg:max-h-[calc(100svh-13rem)] lg:overflow-y-auto lg:pr-1">
          <PublicFolderBrowser
            shareSlug={shareSlug}
            items={treeItems}
            selectedFileId={selectedFile?.id ?? selectedFileId}
            onSelectFile={handleSelectFile}
          />
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
        {selectedFile ? (
          <>
            <div className="border-b px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-3xl">
                    {selectedFile.name.replace(/\.md$/, '')}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Shared from &quot;{folderName}&quot; on{' '}
                    <Link
                      href="/"
                      className="text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Inkdown
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 px-4 py-5 sm:p-6">
              {isFetching ? (
                <div className="mb-4 text-sm text-muted-foreground">
                  Loading document...
                </div>
              ) : null}
              <MarkdownPreview content={selectedFile.content} />
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-12 text-center text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No shared files in this folder</p>
              <p className="text-sm">
                This shared folder does not currently contain any nested markdown files.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
