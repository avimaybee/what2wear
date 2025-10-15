'use client'

import React from 'react'

type ChipProps = {
  selected?: boolean
  children: React.ReactNode
  onClick?: () => void
  onRemove?: () => void
  className?: string
}

export default function Chip({ selected, children, onClick, onRemove, className }: ChipProps) {
  return (
    <div className={classNames(
      'inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition',
      selected
        ? 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
        : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:brightness-110',
      className,
    )}>
      <button
        type="button"
        onClick={onClick}
        className="flex-1 text-left"
      >
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 text-xs opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}

function classNames(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ')
}
