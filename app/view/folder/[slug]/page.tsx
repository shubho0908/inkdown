import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileText, FolderOpen, Share2 } from 'lucide-react'
import { MarkdownPreview } from '@/components/markdown-preview'
import { PublicFolderBrowser } from '@/components/public-folder-browser'
import { Button } from '@/components/ui/button'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { getPublicFolderBySlug, getPublicFolderFileById, getPublicFolderTreeBySlug } from '@/lib/public-folders'
import { createSocialImageSet } from '@/lib/social-metadata'
import { createSiteUrl, getRequestOrigin, getSiteUrl, getSiteUrlObject } from '@/lib/site-url'
import type { TreeItem } from '@/lib/types'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

interface SharedFolderPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ file?: string }>
}

export const dynamic = 'force-dynamic'

function findFirstFileId(items: TreeItem[]): string | null {
  for (const item of items) {
    if (item.type === 'file') {
      return item.id
    }

    const nestedFileId = item.children ? findFirstFileId(item.children) : null
    if (nestedFileId) {
      return nestedFileId
    }
  }

  return null
}

export async function generateMetadata({
  params,
}: SharedFolderPageProps): Promise<Metadata> {
  const { slug } = await params
  const folder = await getPublicFolderBySlug(slug)

  if (!folder) {
    return { title: 'Not Found' }
  }

  const requestHeaders = await headers()
  const requestOrigin = getRequestOrigin(requestHeaders)
  const documentUrl = createSiteUrl(`/view/folder/${slug}`, requestOrigin).toString()
  const description = `Browse the shared folder "${folder.name}" on Inkdown.`
  const socialImageAlt = `Preview of the shared folder "${folder.name}" on Inkdown`
  const socialImages = createSocialImageSet(
    `/view/folder/${slug}`,
    socialImageAlt,
    requestOrigin,
  )

  return {
    title: folder.name,
    description,
    metadataBase: getSiteUrlObject(requestOrigin),
    alternates: {
      canonical: documentUrl,
    },
    openGraph: {
      title: folder.name,
      description,
      type: 'website',
      locale: 'en_US',
      siteName: 'Inkdown',
      url: documentUrl,
      images: socialImages.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: folder.name,
      description,
      images: socialImages.twitter,
    },
  }
}

export default async function SharedFolderPage({
  params,
  searchParams,
}: SharedFolderPageProps) {
  const { slug } = await params
  const { file: requestedFileId } = await searchParams
  const requestHeaders = await headers()
  const requestOrigin = getRequestOrigin(requestHeaders)

  const sharedFolder = await getPublicFolderTreeBySlug(slug)

  if (!sharedFolder) {
    notFound()
  }

  const fallbackFileId = findFirstFileId(sharedFolder.treeItems)
  const selectedFileId = requestedFileId || fallbackFileId
  let selectedFile = selectedFileId
    ? await getPublicFolderFileById(slug, selectedFileId)
    : null

  if (!selectedFile && requestedFileId && fallbackFileId && fallbackFileId !== requestedFileId) {
    selectedFile = await getPublicFolderFileById(slug, fallbackFileId)
  }

  const siteUrl = getSiteUrl(requestOrigin)
  const folderUrl = createSiteUrl(`/view/folder/${slug}`, requestOrigin).toString()
  const subfolderCount = Math.max(sharedFolder.folders.length - 1, 0)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: sharedFolder.folder.name,
    description: `Browse the shared folder "${sharedFolder.folder.name}" on Inkdown.`,
    url: folderUrl,
    datePublished: sharedFolder.folder.created_at,
    dateModified: sharedFolder.folder.updated_at,
    publisher: {
      '@type': 'Organization',
      name: 'Inkdown',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: createSiteUrl('/favicon.png', requestOrigin).toString(),
      },
    },
  }

  return (
    <div className="min-h-svh bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/">
            <InkdownLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" asChild className="shrink-0">
              <Link href="/auth/sign-up">
                Start writing
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

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
                    {sharedFolder.folder.name}
                  </h1>
                  <Share2 className="h-4 w-4 shrink-0 text-primary" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {sharedFolder.files.length} {sharedFolder.files.length === 1 ? 'file' : 'files'}
                  {' · '}
                  {subfolderCount} {subfolderCount === 1 ? 'subfolder' : 'subfolders'}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 pt-3 lg:max-h-[calc(100svh-13rem)] lg:overflow-y-auto lg:pr-1">
            <PublicFolderBrowser
              shareSlug={slug}
              items={sharedFolder.treeItems}
              selectedFileId={selectedFile?.id ?? null}
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
                      Shared from &quot;{sharedFolder.folder.name}&quot; on{' '}
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
    </div>
  )
}
