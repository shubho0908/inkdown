import { QueryProvider } from '@/components/query-provider'

export default function SharedFolderLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <QueryProvider>{children}</QueryProvider>
}
