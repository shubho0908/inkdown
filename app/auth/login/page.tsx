import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Inkdown account to access your markdown workspace.',
  robots: { index: false },
}

export default function LoginPage() {
  return <LoginForm />
}
