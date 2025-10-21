/**
 * Floating Action Button (FAB)
 * Mobile-optimized floating button for primary actions
 * 
 * Features:
 * - Fixed positioning (bottom-right corner)
 * - 56x56px touch target (Material Design spec)
 * - Smooth animations and interactions
 * - Accessibility-friendly
 * - Optional extended label
 * - Keyboard navigable
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionDurations, motionEasing } from "@/lib/motion";

export interface FABProps {
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;
  
  /**
   * Click handler
   */
  onClick?: () => void;
  
  /**
   * Optional text label (shows on hover/focus)
   */
  label?: string;
  
  /**
   * Always show label (extended FAB)
   */
  extended?: boolean;
  
  /**
   * Position of FAB
   * @default "bottom-right"
   */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  
  /**
   * Color variant
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "accent";
  
  /**
   * Hide on scroll down, show on scroll up
   * @default true
   */
  hideOnScroll?: boolean;
  
  /**
   * Additional classes
   */
  className?: string;
  
  /**
   * ARIA label for accessibility
   */
  ariaLabel: string;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
}

export const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      icon: Icon,
      onClick,
      label,
      extended = false,
      position = "bottom-right",
      variant = "primary",
      hideOnScroll = true,
      className,
      ariaLabel,
      disabled = false,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [isHovered, setIsHovered] = React.useState(false);
    const lastScrollY = React.useRef(0);

    // Handle scroll behavior
    React.useEffect(() => {
      if (!hideOnScroll) return;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        // Show FAB when scrolling up, hide when scrolling down
        if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [hideOnScroll]);

    // Position classes
    const positionClasses = {
      "bottom-right": "bottom-20 right-4 md:bottom-6 md:right-6",
      "bottom-left": "bottom-20 left-4 md:bottom-6 md:left-6",
      "bottom-center": "bottom-20 left-1/2 -translate-x-1/2 md:bottom-6",
    };

    // Variant classes
    const variantClasses = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-lg",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/85 shadow-lg",
      accent:
        "bg-accent text-accent-foreground hover:bg-accent/80 active:bg-accent/85 shadow-lg",
    };

    const showLabel = extended || isHovered;

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.button
            ref={ref}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              duration: motionDurations.medium / 1000,
              ease: motionEasing.fast,
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "fixed z-40 flex items-center justify-center gap-3 rounded-full font-medium transition-all duration-200 touch-manipulation",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
              extended ? "h-14 min-w-[56px] px-6" : "h-14 w-14",
              positionClasses[position],
              variantClasses[variant],
              className
            )}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            
            <AnimatePresence>
              {showLabel && label && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{
                    duration: motionDurations.fast / 1000,
                    ease: motionEasing.medium,
                  }}
                  className="overflow-hidden whitespace-nowrap text-sm"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    );
  }
);

FAB.displayName = "FAB";

/**
 * Mini FAB - Smaller variant for secondary actions
 */
export interface MiniFABProps extends Omit<FABProps, "extended" | "label"> {
  size?: "small" | "default";
}

export const MiniFAB = React.forwardRef<HTMLButtonElement, MiniFABProps>(
  (
    {
      icon: Icon,
      onClick,
      position = "bottom-right",
      variant = "secondary",
      hideOnScroll = false,
      size = "small",
      className,
      ariaLabel,
      disabled = false,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const lastScrollY = React.useRef(0);

    React.useEffect(() => {
      if (!hideOnScroll) return;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [hideOnScroll]);

    const positionClasses = {
      "bottom-right": "bottom-20 right-4 md:bottom-6 md:right-6",
      "bottom-left": "bottom-20 left-4 md:bottom-6 md:left-6",
      "bottom-center": "bottom-20 left-1/2 -translate-x-1/2 md:bottom-6",
    };

    const variantClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
      accent: "bg-accent text-accent-foreground hover:bg-accent/80 shadow-md",
    };

    const sizeClass = size === "small" ? "h-10 w-10" : "h-12 w-12";
    const iconSize = size === "small" ? "h-5 w-5" : "h-6 w-6";

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.button
            ref={ref}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              duration: motionDurations.medium / 1000,
              ease: motionEasing.fast,
            }}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "fixed z-40 flex items-center justify-center rounded-full transition-all duration-200 touch-manipulation",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:pointer-events-none",
              sizeClass,
              positionClasses[position],
              variantClasses[variant],
              className
            )}
          >
            <Icon className={iconSize} />
          </motion.button>
        )}
      </AnimatePresence>
    );
  }
);

MiniFAB.displayName = "MiniFAB";
