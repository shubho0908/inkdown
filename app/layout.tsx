import type { Metadata, Viewport } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { Toaster } from '@/components/ui/sonner'
import { createSocialImageSet } from '@/lib/social-metadata'
import { getSiteUrlObject } from '@/lib/site-url'
import 'katex/dist/katex.min.css'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--app-font-sans',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--app-font-display',
  display: 'swap',
})

const rootSocialImages = createSocialImageSet(
  '/',
  'Inkdown homepage preview - create, organize, and share markdown documents',
)

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
    images: rootSocialImages.openGraph,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inkdown - Beautiful Markdown Editor',
    description: 'Create, organize, and share beautiful markdown documents.',
    images: rootSocialImages.twitter,
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

const themeBootstrapScript = `
(() => {
  const storageKey = 'inkdown-theme';
  const storedTheme = window.localStorage.getItem(storageKey);
  const theme = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
    ? storedTheme
    : 'system';
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased selection:bg-primary/20`}>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
