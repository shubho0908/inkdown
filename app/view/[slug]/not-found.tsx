import { Button } from '@/components/ui/button'
import { FileText, FileQuestion } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">MarkdownHub</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Document not found</h1>
          <p className="mt-2 text-muted-foreground">
            This document may have been deleted or made private.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Create your own</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
