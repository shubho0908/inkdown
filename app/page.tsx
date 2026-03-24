import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, FolderTree, Share2, Edit3, Eye, Lock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">MarkdownHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-32">
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Your markdown files,
            <br />
            <span className="text-muted-foreground">organized and shareable</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Create, edit, and organize markdown documents in a clean folder structure.
            Share your work with a single link and let others view your beautifully rendered content.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Start writing for free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Everything you need</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              A complete markdown management solution designed for developers, writers, and teams.
            </p>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Edit3 className="h-6 w-6" />}
                title="Rich Editor"
                description="Full-featured toolbar with formatting buttons, keyboard shortcuts, and syntax highlighting."
              />
              <FeatureCard
                icon={<Eye className="h-6 w-6" />}
                title="Live Preview"
                description="See your markdown rendered in real-time as you type. Toggle between edit and preview modes."
              />
              <FeatureCard
                icon={<FolderTree className="h-6 w-6" />}
                title="Folder Organization"
                description="Create nested folders to organize your documents. Rename, move, and manage with ease."
              />
              <FeatureCard
                icon={<Share2 className="h-6 w-6" />}
                title="Easy Sharing"
                description="Generate shareable links for any document. Control who can view your content."
              />
              <FeatureCard
                icon={<Lock className="h-6 w-6" />}
                title="Secure Storage"
                description="Your documents are securely stored and only accessible to you unless shared."
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Beautiful Rendering"
                description="Your markdown is rendered beautifully with support for GFM, tables, and code blocks."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-muted-foreground">
              Create your free account and start writing in seconds.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/auth/sign-up">Create free account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>MarkdownHub - Your markdown, beautifully organized.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
