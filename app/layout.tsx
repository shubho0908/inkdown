import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: 'Inkdown - Beautiful Markdown Editor & Sharing Platform',
    template: '%s | Inkdown',
  },
  description: 'Create, organize, and share beautiful markdown documents. Inkdown provides a seamless writing experience with live preview, folder organization, and instant sharing.',
  keywords: ['markdown', 'editor', 'writing', 'documentation', 'notes', 'sharing', 'collaboration'],
  authors: [{ name: 'Inkdown' }],
  creator: 'Inkdown',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://inkdown.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Inkdown - Beautiful Markdown Editor & Sharing Platform',
    description: 'Create, organize, and share beautiful markdown documents with live preview and instant sharing.',
    siteName: 'Inkdown',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Inkdown - Markdown Editor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inkdown - Beautiful Markdown Editor',
    description: 'Create, organize, and share beautiful markdown documents.',
    images: ['/og-image.png'],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
