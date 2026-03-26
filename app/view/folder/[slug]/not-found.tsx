import { Button } from '@/components/ui/button'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowRight, FolderSearch, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/">
            <InkdownLogo size="sm" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FolderSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="relative text-center">
          <h1 className="text-2xl font-bold">Shared folder not found</h1>
          <p className="mt-2 text-muted-foreground">
            This folder may have been deleted or made private.
          </p>
        </div>
        <div className="relative flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-1.5 h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">
              Start writing
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
