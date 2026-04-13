import { QueryProvider } from '@/components/query-provider'

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <QueryProvider>{children}</QueryProvider>
}
