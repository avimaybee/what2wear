'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'grid' | 'outfit';
  count?: number;
  className?: string;
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('panel-papercraft p-0 overflow-hidden', className)}>
      {/* Image skeleton */}
      <div className="aspect-square bg-muted animate-pulse rounded-t-2xl" />
      
      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

function SkeletonList({ className }: { className?: string }) {
  return (
    <div className={cn('panel-papercraft p-4', className)}>
      <div className="space-y-3">
        <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
      </div>
    </div>
  );
}

function SkeletonOutfit({ className }: { className?: string }) {
  return (
    <div className={cn('panel-papercraft-lg p-0 overflow-hidden', className)}>
      {/* Large image skeleton */}
      <div className="aspect-[3/4] bg-muted animate-pulse rounded-t-2xl" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-2">
        <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  variant = 'card',
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  if (variant === 'card') {
    return (
      <>
        {skeletons.map((i) => (
          <SkeletonCard key={i} className={className} />
        ))}
      </>
    );
  }
  
  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {skeletons.map((i) => (
          <SkeletonList key={i} className={className} />
        ))}
      </div>
    );
  }
  
  if (variant === 'outfit') {
    return (
      <>
        {skeletons.map((i) => (
          <SkeletonOutfit key={i} className={className} />
        ))}
      </>
    );
  }
  
  // Grid variant
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {skeletons.map((i) => (
        <SkeletonCard key={i} className={className} />
      ))}
    </div>
  );
}

export interface PapercraftLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function PapercraftLoader({
  size = 'md',
  text,
  className,
}: PapercraftLoaderProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <motion.div
        className={cn(
          'border-3 border-primary border-t-transparent rounded-full',
          sizes[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {text && (
        <p className="text-sm text-secondary-label font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

export function HourglassLoader({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <motion.div
        className="text-4xl"
        animate={{ rotate: 180 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      >
        ⏳
      </motion.div>
      
      {text && (
        <p className="text-sm text-secondary-label font-medium">
          {text}
        </p>
      )}
    </div>
  );
}

export interface ProgressBarProps {
  progress: number; // 0-100
  variant?: 'default' | 'striped' | 'animated';
  label?: string;
  className?: string;
}

export function PapercraftProgressBar({
  progress,
  variant = 'default',
  label,
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-secondary-label">{label}</span>
          <span className="text-primary font-medium">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      
      <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
        <motion.div
          className={cn(
            'h-full bg-primary rounded-full',
            variant === 'striped' && 'bg-pattern-lines',
            variant === 'animated' && 'animate-pulse'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
      </div>
    </div>
  );
}
