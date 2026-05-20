import { AuthCallbackClient } from '@/app/auth/callback/callback-client'
import { AuthShell } from '@/components/auth/auth-shell'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Finishing Sign In',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Finishing sign in"
          description="Finishing authentication..."
        >
          <div className="flex justify-center py-8">
            <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        </AuthShell>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  )
}
