'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function MarkdownEditorLoading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-14 items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <Skeleton className="min-h-0 flex-1 rounded-2xl" />
      </div>
    </div>
  )
}
