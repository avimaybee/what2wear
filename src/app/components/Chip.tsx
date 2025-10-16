'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type ChipProps = {
  selected?: boolean
  children: React.ReactNode
  onClick?: () => void
  onRemove?: () => void
  className?: string
}

export default function Chip({ selected, children, onClick, onRemove, className }: ChipProps) {
  return (
    <div className={cn(
      'inline-flex items-center whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
      selected
        ? 'border-primary/50 bg-primary/20 text-primary shadow-lg shadow-primary/10'
        : 'border-border/50 bg-surface-2/50 text-foreground hover:bg-surface-2 hover:border-border',
      onClick && 'cursor-pointer',
      className,
    )}>
      <button
        type="button"
        onClick={onClick}
        className="flex-1 text-left capitalize"
      >
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  )
}
