import { QueryProvider } from '@/components/query-provider'

export default function SharedDocumentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <QueryProvider>{children}</QueryProvider>
}
