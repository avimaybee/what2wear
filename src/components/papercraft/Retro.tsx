'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

// System-style dialog matching reference image aesthetic
export interface SystemDialogProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  message?: string;
  type?: 'error' | 'info' | 'warning' | 'success';
  icon?: ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  children?: ReactNode; // Allow custom content
  className?: string;
}

const dialogIcons = {
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
};

export function SystemDialog({
  open,
  onClose,
  title,
  message,
  type = 'info',
  icon,
  actions,
  children,
  className,
}: SystemDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      {/* Dialog */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={cn(
          'relative bg-card border-3 border-border rounded-2xl shadow-2xl max-w-md w-full',
          'overflow-hidden',
          className
        )}
      >
        {/* Window title bar */}
        <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 flex items-center justify-between border-b-3 border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive border border-border" />
            <div className="w-3 h-3 rounded-full bg-warning border border-border" />
            <div className="w-3 h-3 rounded-full bg-success border border-border" />
          </div>
          <span className="text-xs font-heading font-semibold text-white">
            System Message
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="w-3 h-3 flex items-center justify-center hover:opacity-80"
            >
              <X size={12} className="text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0">
              {icon || dialogIcons[type]}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {title}
              </h3>
              {message && (
                <p className="text-secondary-label text-sm leading-relaxed">
                  {message}
                </p>
              )}
              {children}
            </div>
          </div>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 justify-end pt-2">
              {actions.map((action, idx) => (
                <RetroButton
                  key={idx}
                  onClick={action.onClick}
                  variant={action.variant || 'secondary'}
                  size="sm"
                >
                  {action.label}
                </RetroButton>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Retro-style button matching reference
export interface RetroButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

const buttonVariants = {
  primary: 'bg-primary text-primary-foreground border-primary hover:brightness-110',
  secondary: 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80',
  danger: 'bg-destructive text-destructive-foreground border-destructive hover:brightness-110',
  success: 'bg-success text-success-foreground border-success hover:brightness-110',
  warning: 'bg-warning text-warning-foreground border-warning hover:brightness-110',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function RetroButton({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: RetroButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'font-heading font-semibold rounded-lg border-3 transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center gap-2 justify-center',
        'shadow-md hover:shadow-lg',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}

// Retro checkbox styled like reference
export function RetroCheckbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer group', className)}>
      <div
        className={cn(
          'w-5 h-5 border-3 border-border rounded flex items-center justify-center transition-all',
          'group-hover:border-primary',
          checked ? 'bg-primary' : 'bg-background'
        )}
        onClick={() => onChange(!checked)}
      >
        {checked && <span className="text-primary-foreground text-sm">✓</span>}
      </div>
      {label && (
        <span className="text-sm font-medium text-foreground select-none">
          {label}
        </span>
      )}
    </label>
  );
}

// Retro search bar
export function RetroSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2 bg-background border-3 border-border rounded-xl',
          'focus:outline-none focus:ring-3 focus:ring-primary focus:border-primary',
          'font-body text-sm placeholder:text-tertiary-label',
          'transition-all'
        )}
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary-label">
        🔍
      </span>
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-label hover:text-foreground"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Retro progress bar with segments like reference
export function RetroProgressBar({
  progress,
  segments = 10,
  label,
  showPercentage = true,
  className,
}: {
  progress: number; // 0-100
  segments?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const filledSegments = Math.round((clampedProgress / 100) * segments);

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-secondary-label font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-primary font-heading font-semibold">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="flex gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-4 rounded border-2 transition-all duration-300',
              i < filledSegments
                ? 'bg-primary border-primary'
                : 'bg-muted border-border'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Retro folder/file icon like reference
export function RetroFolder({
  label,
  icon = '📁',
  onClick,
  selected = false,
  className,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex flex-col items-center gap-1 p-3 rounded-lg transition-colors',
        'hover:bg-accent/20',
        selected && 'bg-accent/30',
        className
      )}
    >
      <span className="text-4xl">{icon}</span>
      <span className="text-xs font-medium text-center text-foreground max-w-[80px] truncate">
        {label}
      </span>
    </motion.button>
  );
}

// Retro window container
export function RetroWindow({
  title,
  children,
  onClose,
  minimizable = false,
  className,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  minimizable?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('bg-card border-3 border-border rounded-2xl overflow-hidden shadow-papercraft-lg', className)}>
      {/* Title bar */}
      <div className="bg-gradient-to-r from-primary to-accent-pink p-2 flex items-center justify-between border-b-3 border-border">
        <span className="text-sm font-heading font-semibold text-white px-2">
          {title}
        </span>
        <div className="flex gap-1">
          {minimizable && (
            <button className="w-5 h-5 bg-warning border-2 border-border rounded flex items-center justify-center hover:brightness-110">
              <span className="text-xs">−</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-5 h-5 bg-destructive border-2 border-border rounded flex items-center justify-center hover:brightness-110"
            >
              <X size={12} className="text-white" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
