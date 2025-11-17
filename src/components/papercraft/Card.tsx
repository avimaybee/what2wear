'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode, HTMLAttributes } from 'react';

export interface PapercraftCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat' | 'outlined';
  pattern?: 'checker' | 'dots' | 'lines' | 'none';
  paperTexture?: boolean;
  animate?: boolean;
  hoverEffect?: 'lift' | 'pop' | 'none';
  children: ReactNode;
}

const patternClasses = {
  checker: 'bg-pattern-checker',
  dots: 'bg-pattern-dots',
  lines: 'bg-pattern-lines',
  none: '',
};

const variantClasses = {
  default: 'panel-papercraft',
  elevated: 'panel-papercraft-lg',
  flat: 'bg-card border border-border rounded-2xl',
  outlined: 'bg-transparent border-2 border-border rounded-2xl',
};

const hoverEffectClasses = {
  lift: 'hover-lift cursor-pointer',
  pop: 'hover-pop cursor-pointer',
  none: '',
};

const animations = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  },
};

export function PapercraftCard({
  variant = 'default',
  pattern = 'none',
  paperTexture = false,
  animate = false,
  hoverEffect = 'none',
  className,
  children,
  ...props
}: PapercraftCardProps) {
  const classes = cn(
    variantClasses[variant],
    patternClasses[pattern],
    hoverEffectClasses[hoverEffect],
    paperTexture && 'paper-texture',
    'relative overflow-hidden',
    className
  );

  if (animate) {
    const {
      onDrag,
      onDragEnd,
      onDragStart,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...restProps
    } = props;
    return (
      <motion.div
        className={classes}
        initial={animations.initial}
        animate={animations.animate}
        transition={animations.transition}
        {...restProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

// Specialized card variants for common use cases

export function ClothingItemCard({
  item,
  onClick,
  onDelete,
  showWearCount = true,
  className,
}: {
  item: {
    id: number;
    image_url: string;
    category: string;
    color: string;
    wear_count: number;
    is_favorite: boolean;
    last_worn?: string | null;
  };
  onClick?: () => void;
  onDelete?: () => void;
  showWearCount?: boolean;
  className?: string;
}) {
  return (
    <PapercraftCard
      variant="default"
      animate
      hoverEffect="lift"
      className={cn('p-0 group relative', className)}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl">
        <img
          src={item.image_url}
          alt={`${item.color} ${item.category}`}
          className="w-full h-full object-cover"
        />
        
        {/* Favorite badge */}
        {item.is_favorite && (
          <div className="absolute top-2 right-2 sticker sticker-warning px-2 py-1 rounded-lg text-xs font-medium">
            ⭐
          </div>
        )}
        
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3 space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-heading text-sm font-semibold capitalize">{item.category}</p>
            <p className="text-xs text-secondary-label">{item.color}</p>
          </div>
          
          {showWearCount && (
            <div className="sticker sticker-info px-2 py-0.5 rounded-md text-xs">
              {item.wear_count}× worn
            </div>
          )}
        </div>
        
        {item.last_worn && (
          <p className="text-xs text-tertiary-label">
            Last worn: {new Date(item.last_worn).toLocaleDateString()}
          </p>
        )}
      </div>
    </PapercraftCard>
  );
}

export function OutfitCard({
  outfit,
  onClick,
  className,
}: {
  outfit: {
    id: number;
    outfit_date: string;
    visual_image_url?: string;
    reasoning?: string;
    items?: Array<{ id: number; image_url: string; category: string }>;
  };
  onClick?: () => void;
  className?: string;
}) {
  return (
    <PapercraftCard
      variant="elevated"
      animate
      hoverEffect="lift"
      className={cn('cursor-pointer', className)}
      onClick={onClick}
    >
      {/* Visual preview or item grid */}
      {outfit.visual_image_url ? (
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl">
          <img
            src={outfit.visual_image_url}
            alt="Outfit visualization"
            className="w-full h-full object-cover"
          />
          {/* AI badge */}
          <div className="absolute bottom-2 right-2 sticker sticker-info px-2 py-1 rounded-lg text-xs flex items-center gap-1">
            <span>✨</span>
            <span>AI</span>
          </div>
        </div>
      ) : outfit.items && outfit.items.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 p-2">
          {outfit.items.slice(0, 6).map((item) => (
            <div key={item.id} className="aspect-square rounded-lg overflow-hidden">
              <img
                src={item.image_url}
                alt={item.category}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
      
      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-heading text-lg">
            {new Date(outfit.outfit_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
        </div>
        
        {outfit.reasoning && (
          <p className="text-sm text-secondary-label line-clamp-2">
            {outfit.reasoning}
          </p>
        )}
      </div>
    </PapercraftCard>
  );
}
