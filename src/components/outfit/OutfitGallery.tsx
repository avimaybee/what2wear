"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Cpath fill='%239ca3af' d='M150 100h100v200h-100z'/%3E%3Ccircle fill='%239ca3af' cx='200' cy='100' r='40'/%3E%3Ctext x='200' y='350' font-family='system-ui' font-size='20' fill='%236b7280' text-anchor='middle'%3EVariant%3C/text%3E%3C/svg%3E";

interface OutfitVariant {
  id: string;
  imageUrl: string;
  seed?: number;
  style?: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
}

interface OutfitGalleryProps {
  variants: OutfitVariant[];
  currentIndex?: number;
  onVariantChange?: (index: number) => void;
  className?: string;
}

/**
 * OutfitGallery Component
 * 
 * Displays generated outfit variants in a swipeable carousel gallery.
 * Features:
 * - Swipe left/right to explore variants
 * - Keyboard navigation (arrow keys)
 * - Smooth crossfade transitions
 * - Touch-friendly with drag gestures
 * - Displays variant metadata (style, seed)
 * - Mobile-first responsive design
 * - Reduced motion support
 */
export function OutfitGallery({
  variants,
  currentIndex: controlledIndex,
  onVariantChange,
  className,
}: OutfitGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(controlledIndex || 0);
  const [direction, setDirection] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Sync with controlled index if provided
  useEffect(() => {
    if (controlledIndex !== undefined && controlledIndex !== currentIndex) {
      setCurrentIndex(controlledIndex);
    }
  }, [controlledIndex, currentIndex]);

  const currentVariant = variants[currentIndex];
  const totalVariants = variants.length;

  const navigate = useCallback((newDirection: number) => {
    if (totalVariants === 0) return;
    
    setDirection(newDirection);
    const newIndex = (currentIndex + newDirection + totalVariants) % totalVariants;
    setCurrentIndex(newIndex);
    onVariantChange?.(newIndex);
  }, [currentIndex, totalVariants, onVariantChange]);

  const goToNext = useCallback(() => navigate(1), [navigate]);
  const goToPrevious = useCallback(() => navigate(-1), [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Handle swipe gestures
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 500;

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (Math.abs(offset) > swipeThreshold || Math.abs(velocity) > swipeVelocityThreshold) {
      if (offset > 0 || velocity > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  // Slide variants for entrance/exit animations
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  if (totalVariants === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Outfit Variants</CardTitle>
          <CardDescription>No variants generated yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Screen reader announcement for variant changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Viewing outfit variant {currentIndex + 1} of {totalVariants}
        {currentVariant?.style && `, Style: ${currentVariant.style}`}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              Outfit Variants
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Explore {totalVariants} AI-generated style{totalVariants > 1 ? 's' : ''}
            </CardDescription>
          </div>
          
          {/* Variant Counter */}
          <Badge variant="secondary" className="font-mono">
            {currentIndex + 1} / {totalVariants}
          </Badge>
        </div>
      </CardHeader>

      <div className="px-4 sm:px-6 pb-4">
        {/* Gallery Container */}
        <div className="relative">
          {/* Main Image Display with AnimatePresence for crossfade */}
          <div className="relative aspect-[3/4] w-full max-w-md mx-auto overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted shadow-lg">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentVariant.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
              >
                <Image
                  src={imageErrors.has(currentIndex) ? PLACEHOLDER_IMAGE : currentVariant.imageUrl}
                  alt={`Outfit variant ${currentIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover select-none"
                  priority={currentIndex === 0}
                  unoptimized={currentVariant.imageUrl.startsWith('data:') || imageErrors.has(currentIndex)}
                  onError={() => handleImageError(currentIndex)}
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {totalVariants > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full shadow-md"
                  aria-label="Previous outfit variant"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full shadow-md"
                  aria-label="Next outfit variant"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>

          {/* Variant Metadata */}
          {currentVariant && (currentVariant.style || currentVariant.seed !== undefined) && (
            <motion.div
              key={`metadata-${currentVariant.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-4 flex flex-wrap gap-2 justify-center"
            >
              {currentVariant.style && (
                <Badge variant="outline" className="text-xs">
                  Style: {currentVariant.style}
                </Badge>
              )}
              {currentVariant.seed !== undefined && (
                <Badge variant="outline" className="text-xs font-mono">
                  Seed: {currentVariant.seed}
                </Badge>
              )}
            </motion.div>
          )}

          {/* Thumbnail Strip (for more than 3 variants) */}
          {totalVariants > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent justify-center">
              {variants.map((variant, index) => (
                <motion.button
                  key={variant.id}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                    onVariantChange?.(index);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                    index === currentIndex
                      ? "border-primary shadow-md scale-110"
                      : "border-border/50 opacity-60 hover:opacity-100"
                  )}
                  aria-label={`View outfit variant ${index + 1} of ${totalVariants}`}
                  aria-current={index === currentIndex ? 'true' : 'false'}
                  type="button"
                >
                  <Image
                    src={imageErrors.has(index) ? PLACEHOLDER_IMAGE : variant.imageUrl}
                    alt={`Outfit variant ${index + 1} thumbnail`}
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized={variant.imageUrl.startsWith('data:') || imageErrors.has(index)}
                    onError={() => handleImageError(index)}
                  />
                </motion.button>
              ))}
            </div>
          )}

          {/* Swipe Hint (show only on mobile) */}
          {totalVariants > 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-xs text-center text-muted-foreground mt-3 md:hidden"
            >
              ← Swipe to explore more →
            </motion.p>
          )}
        </div>
      </div>
    </Card>
  );
}
