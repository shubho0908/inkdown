import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { InkdownLogo } from '@/components/inkdown-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Mail, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Check Your Email',
  description: 'We sent you a confirmation link to verify your Inkdown account.',
  robots: { index: false },
}

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; reason?: string }>
}) {
  const params = await searchParams
  const isVerificationGate = params.reason === 'verify-email'

  return (
    <div className="relative flex min-h-svh w-full items-start justify-center px-4 py-16 sm:px-6 sm:py-20 md:items-center md:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
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
          <Card className="border-border/50 py-5 shadow-xl shadow-primary/5 sm:py-6">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {isVerificationGate
                  ? 'Verify your email to continue'
                  : 'Check your email'}
              </CardTitle>
              <CardDescription>
                {params.email
                  ? `We sent a confirmation link to ${params.email}`
                  : "We've sent you a confirmation link"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3 text-left">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {isVerificationGate
                      ? 'Your account exists, but sign-in stays blocked until you confirm your email address.'
                      : 'Click the link in your email to confirm your account and start using Inkdown.'}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
