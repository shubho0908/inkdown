import { EmailTemplate } from '@/components/email-template'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Templates',
  description: 'Preview Inkdown email templates',
  robots: {
    index: false,
    follow: false,
  },
}

export default function EmailPreviewPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-1.5 size-4" />
                Back
              </Link>
            </Button>
            <InkdownLogo size="sm" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold sm:text-4xl">Email Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Preview the email templates used by Inkdown for user communications.
          </p>
        </div>

        <Tabs defaultValue="confirmation" className="w-full">
          <div className="mb-6 overflow-x-auto pb-1">
            <TabsList className="w-max min-w-full justify-start">
              <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
              <TabsTrigger value="welcome">Welcome</TabsTrigger>
              <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="confirmation" className="overflow-hidden rounded-lg border shadow-sm">
            <EmailTemplate 
              type="confirmation" 
              confirmationUrl="https://inkdown.app/confirm?token=example-token-123" 
            />
          </TabsContent>
          
          <TabsContent value="welcome" className="overflow-hidden rounded-lg border shadow-sm">
            <EmailTemplate 
              type="welcome" 
              userName="Alex" 
            />
          </TabsContent>
          
          <TabsContent value="password-reset" className="overflow-hidden rounded-lg border shadow-sm">
            <EmailTemplate 
              type="password-reset" 
              resetUrl="https://inkdown.app/reset?token=example-reset-token" 
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8 rounded-lg border bg-muted/30 p-4 sm:p-5">
          <h2 className="font-semibold">About these templates</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These email templates are designed to be responsive and accessible across all email clients. 
            They use inline styles for maximum compatibility and follow Inkdown&apos;s brand guidelines.
          </p>
        </div>
      </main>
    </div>
  )
}
