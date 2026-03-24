import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication Error',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage =
    params?.error ??
    'An unexpected error occurred during authentication.'
  const isPkceStorageError = errorMessage
    .toLowerCase()
    .includes('pkce code verifier not found in storage')

  return (
    <div className="relative flex min-h-svh w-full items-start justify-center px-4 py-16 sm:px-6 sm:py-20 md:items-center md:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-destructive/5 blur-3xl" />
      </div>

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center">
            <Link href="/">
              <InkdownLogo size="lg" />
            </Link>
          </div>
          <Card className="border-border/50 py-5 shadow-xl shadow-destructive/5 sm:py-6">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="break-words text-sm text-muted-foreground">
                {`Error: ${errorMessage}`}
              </p>
              {isPkceStorageError ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  This usually means the confirmation link opened in a
                  different browser context than the one that started the auth
                  flow. Update your Supabase email template to use the server
                  confirmation route with a `token_hash` instead of the default
                  PKCE callback URL.
                </p>
              ) : null}
              <div className="mt-6">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Try again</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
