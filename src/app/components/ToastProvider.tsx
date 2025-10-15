'use client'

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

type ToastVariant = 'default' | 'success' | 'error' | 'info'

export type Toast = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  action?: { label: string; onClick: () => void }
  duration?: number
}

type ToastContextValue = {
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const duration = toast.duration ?? 3000
    const t: Toast = { id, ...toast }
    setToasts(prev => [...prev, t])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== id))
      }, duration)
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  const portal = mounted
    ? createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 safe-bottom mb-[72px] flex flex-col items-center gap-2 px-4"
          aria-live="polite"
          role="status"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 shadow-subtle"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: variantColor(t.variant) }}
                  aria-hidden
                />
                <div className="flex-1">
                  {t.title && <p className="text-sm font-semibold text-[var(--color-text)]">{t.title}</p>}
                  {t.description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {t.action && (
                    <button
                      onClick={() => { t.action?.onClick(); dismissToast(t.id) }}
                      className="rounded-md bg-[var(--color-surface-3)] px-2.5 py-1 text-xs font-medium text-[var(--color-text)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    >
                      {t.action.label}
                    </button>
                  )}
                  <button
                    onClick={() => dismissToast(t.id)}
                    aria-label="Dismiss notification"
                    className="rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )
    : null

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portal}
    </ToastContext.Provider>
  )
}

function variantColor(variant: ToastVariant = 'default') {
  switch (variant) {
    case 'success':
      return 'var(--color-success)'
    case 'error':
      return 'var(--color-error)'
    case 'info':
      return 'var(--color-text)'
    default:
      return 'var(--color-primary)'
  }
}
