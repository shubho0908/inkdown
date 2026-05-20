import { Button } from '@/components/ui/button'
import { InkdownLogo } from '@/components/inkdown-logo'
import { JsonLd } from '@/components/json-ld'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  getEmailVerificationRedirectPath,
  requireVerifiedUser,
} from '@/lib/auth'
import { getSiteUrl } from '@/lib/site-url'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LandingPageContent } from '@/components/landing-page-content'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const authState = isSupabaseConfigured()
    ? await requireVerifiedUser(await createClient())
    : null

  if (authState?.kind === 'authenticated') {
    redirect('/workspace')
  }

  if (authState?.kind === 'unverified') {
    redirect(getEmailVerificationRedirectPath(authState.user.email))
  }

  const siteUrl = getSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Inkdown',
        url: siteUrl,
        description:
          'Create, organize, and share beautiful markdown documents with live preview and instant sharing.',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Inkdown',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        url: siteUrl,
        description:
          'A markdown editor and sharing platform with live preview, folder organization, and public publishing.',
      },
    ],
  }

  return (
    <div className="flex min-h-svh flex-col">
      <JsonLd id="home-structured-data" data={structuredData} />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <InkdownLogo size="md" />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <LandingPageContent />
      </main>

      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <InkdownLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              Inkdown - Your markdown, beautifully organized.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:justify-end">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <span className="text-border">•</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
