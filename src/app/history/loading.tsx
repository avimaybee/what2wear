'use client'

import { SkeletonCard } from '../components/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-40 rounded bg-[var(--color-surface-2)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
