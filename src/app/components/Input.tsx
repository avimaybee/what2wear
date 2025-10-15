'use client'

import React, { forwardRef } from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, error, className, ...props },
  ref,
) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        {...props}
        aria-invalid={!!error}
        className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
