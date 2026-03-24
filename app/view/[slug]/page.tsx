import { createClient } from '@/lib/supabase/server'
import { MarkdownPreview } from '@/components/markdown-preview'
import { Button } from '@/components/ui/button'
import { FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface ViewPageProps {
  params: Promise<{ slug: string }>
}

// Generate dynamic metadata for OG tags
export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: file } = await supabase
    .from('files')
    .select('name, content')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!file) {
    return {
      title: 'Not Found - MarkdownHub',
    }
  }

  // Extract first paragraph as description
  const description = file.content
    .split('\n')
    .filter((line: string) => line.trim() && !line.startsWith('#'))
    .slice(0, 2)
    .join(' ')
    .slice(0, 200)

  const title = file.name.replace(/\.md$/, '')

  return {
    title: `${title} - MarkdownHub`,
    description: description || `Read "${title}" on MarkdownHub`,
    openGraph: {
      title: title,
      description: description || `Read "${title}" on MarkdownHub`,
      type: 'article',
      siteName: 'MarkdownHub',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description || `Read "${title}" on MarkdownHub`,
    },
  }
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: file } = await supabase
    .from('files')
    .select('name, content, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!file) {
    notFound()
  }

  const title = file.name.replace(/\.md$/, '')
  const updatedAt = new Date(file.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">MarkdownHub</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/sign-up">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Create your own
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <article>
          <header className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated on {updatedAt}
            </p>
          </header>
          <MarkdownPreview content={file.content} />
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
          <p>
            Shared via{' '}
            <Link href="/" className="text-foreground underline underline-offset-4 hover:text-primary">
              MarkdownHub
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
