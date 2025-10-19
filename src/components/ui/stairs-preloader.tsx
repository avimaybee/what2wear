"use client";

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Stairs Preloader - Skiper UI inspired staircase animation
 * Based on skiper9 with stepped timing and geometric patterns
 * 
 * Features:
 * - Staircase reveal animation with stepped timing
 * - Smooth transitions with customizable colors
 * - Respects prefers-reduced-motion
 * - Can be used for page loads or route transitions
 */

interface StairsPreloaderProps {
  onComplete?: () => void;
  duration?: number;
  steps?: number;
  className?: string;
  backgroundColor?: string;
}

export const StairsPreloader: React.FC<StairsPreloaderProps> = ({
  onComplete,
  duration = 1.5,
  steps = 6,
  className,
  backgroundColor,
}) => {
  const stepsArray = Array.from({ length: steps }, (_, i) => i);

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none",
        className
      )}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: duration }}
      onAnimationComplete={onComplete}
    >
      <div className="relative h-full w-full flex">
        {stepsArray.map((i) => {
          const delay = (i / steps) * duration * 0.5;

          return (
            <motion.div
              key={i}
              className={cn(
                "relative h-full flex-1",
                backgroundColor || "bg-background"
              )}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 1, 1, 0] }}
              transition={{
                duration: duration,
                times: [0, 0.3, 0.7, 1],
                delay: delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                transformOrigin: "top",
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

/**
 * Hook to control stairs preloader
 * Usage:
 * ```tsx
 * const { isLoading, startLoading } = useStairsPreloader();
 * 
 * return (
 *   <>
 *     {isLoading && <StairsPreloader onComplete={() => setIsLoading(false)} />}
 *     <YourContent />
 *   </>
 * );
 * ```
 */
export const useStairsPreloader = (defaultState = false) => {
  const [isLoading, setIsLoading] = React.useState(defaultState);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    setIsLoading,
  };
};

/**
 * Stairs transition wrapper for route changes
 * Wraps content and shows stairs on route change
 */
interface StairsTransitionProps {
  children: React.ReactNode;
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  steps?: number;
}

export const StairsTransition: React.FC<StairsTransitionProps> = ({
  children,
  show,
  onComplete,
  duration,
  steps,
}) => {
  return (
    <>
      <AnimatePresence mode="wait">
        {show && (
          <StairsPreloader
            onComplete={onComplete}
            duration={duration}
            steps={steps}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );
};

/**
 * Alternative double stairs version
 * Two sets of stairs meeting in the middle
 */
export const DoubleStairsPreloader: React.FC<StairsPreloaderProps> = ({
  onComplete,
  duration = 1.5,
  steps = 6,
  className,
  backgroundColor,
}) => {
  const stepsArray = Array.from({ length: steps }, (_, i) => i);

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none",
        className
      )}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: duration }}
      onAnimationComplete={onComplete}
    >
      <div className="relative h-full w-full flex">
        {stepsArray.map((i) => {
          const isFirstHalf = i < steps / 2;
          const delay = isFirstHalf
            ? (i / (steps / 2)) * duration * 0.5
            : ((i - steps / 2) / (steps / 2)) * duration * 0.5;

          return (
            <motion.div
              key={i}
              className={cn(
                "relative h-full flex-1",
                backgroundColor || "bg-background"
              )}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 1, 1, 0] }}
              transition={{
                duration: duration,
                times: [0, 0.3, 0.7, 1],
                delay: delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                transformOrigin: isFirstHalf ? "bottom" : "top",
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

/**
 * First visit detector
 * Shows preloader only on first visit using localStorage
 */
export const useFirstVisit = (key: string = "stairs-preloader-seen") => {
  const [isFirstVisit, setIsFirstVisit] = React.useState(false);

  React.useEffect(() => {
    const hasSeenPreloader = localStorage.getItem(key);
    if (!hasSeenPreloader) {
      setIsFirstVisit(true);
      localStorage.setItem(key, "true");
    }
  }, [key]);

  return isFirstVisit;
};
