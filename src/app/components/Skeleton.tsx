'use client'

import React from 'react'

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={classNames('animate-pulse rounded-lg bg-[var(--color-surface-2)]', className)} />
  )
}

export function SkeletonLine({ width = '100%' }: { width?: string }) {
  return (
    <div className="animate-pulse h-3 rounded bg-[var(--color-surface-3)]" style={{ width }} />
  )
}

function classNames(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ')
}
