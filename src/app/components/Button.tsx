'use client'
import React from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

export default function Button({
  as: As = 'button',
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & {
  as?: React.ElementType
  variant?: Variant
  size?: Size
}) {
  const base = 'inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-50 disabled:pointer-events-none transition active:scale-[0.98]'

  const sizes: Record<Size, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-14 px-6 text-base',
  }

  const variants: Record<Variant, string> = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-105',
    secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:brightness-110',
    outline: 'bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]',
    ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)]',
    destructive: 'bg-[var(--color-error)] text-[var(--color-background)] hover:brightness-105',
  }

  return (
    <As className={classNames(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </As>
  )
}

function classNames(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ')
}
