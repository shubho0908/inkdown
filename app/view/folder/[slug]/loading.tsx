import { Skeleton } from '@/components/ui/skeleton'

export default function SharedFolderLoading() {
  return (
    <div className="min-h-svh bg-background">
      <div className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 sm:py-8 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
        <div className="rounded-2xl border p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-28" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-[88%]" />
            <Skeleton className="h-10 w-[74%]" />
          </div>
        </div>
        <div className="rounded-2xl border p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-3 h-4 w-56" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-5/6" />
          </div>
        </div>
      </main>
    </div>
  )
}
