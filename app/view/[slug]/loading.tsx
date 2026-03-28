import { Skeleton } from '@/components/ui/skeleton'

export default function SharedDocumentLoading() {
  return (
    <div className="min-h-svh bg-background">
      <div className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-5/6" />
        </div>
      </main>
    </div>
  )
}
