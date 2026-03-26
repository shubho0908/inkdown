import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/ui/sonner'
import { getSiteUrlObject } from '@/lib/site-url'
import {
  isResolvedTheme,
  isTheme,
  type ResolvedTheme,
  type Theme,
} from '@/lib/theme'
import 'katex/dist/katex.min.css'
import './globals.css'

const geist = localFont({
  src: '../public/fonts/Geist-Regular.ttf',
  variable: '--app-font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Inkdown - Beautiful Markdown Editor & Sharing Platform',
    template: '%s | Inkdown',
  },
  applicationName: 'Inkdown',
  description: 'Create, organize, and share beautiful markdown documents. Inkdown provides a seamless writing experience with live preview, folder organization, and instant sharing.',
  keywords: ['markdown', 'editor', 'writing', 'documentation', 'notes', 'sharing', 'collaboration'],
  authors: [{ name: 'Inkdown' }],
  creator: 'Inkdown',
  publisher: 'Inkdown',
  metadataBase: getSiteUrlObject(),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Inkdown - Beautiful Markdown Editor & Sharing Platform',
    description: 'Create, organize, and share beautiful markdown documents with live preview and instant sharing.',
    siteName: 'Inkdown',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inkdown - Beautiful Markdown Editor',
    description: 'Create, organize, and share beautiful markdown documents.',
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

function getInitialThemeFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const themeCookie = cookieStore.get('theme')?.value
  const resolvedThemeCookie = cookieStore.get('resolved-theme')?.value

  const initialTheme: Theme = isTheme(themeCookie) ? themeCookie : 'system'
  const initialResolvedTheme: ResolvedTheme = isResolvedTheme(resolvedThemeCookie)
    ? resolvedThemeCookie
    : initialTheme === 'dark'
      ? 'dark'
      : 'light'

  return {
    initialTheme,
    initialResolvedTheme,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const { initialTheme, initialResolvedTheme } = getInitialThemeFromCookies(cookieStore)

  return (
    <html
      lang="en"
      className={initialResolvedTheme === 'dark' ? 'dark' : undefined}
      style={{ colorScheme: initialResolvedTheme }}
    >
      <body className={`${geist.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider
            initialTheme={initialTheme}
            initialResolvedTheme={initialResolvedTheme}
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
