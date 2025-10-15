'use client'

import { SkeletonCard } from '../components/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-[var(--color-surface-2)]" />
        <div className="h-8 w-56 rounded bg-[var(--color-surface-2)]" />
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
