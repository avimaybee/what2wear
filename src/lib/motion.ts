/**
 * Motion System Constants
 * Centralized configuration for animations throughout the application
 * Based on Motion Primitives and modern animation best practices
 */

// Easing curves
export const motionEasing = {
  // Fast, snappy animations (taps, hovers)
  fast: [0.2, 0.9, 0.2, 1] as const,
  
  // Medium-paced transitions (page transitions, reveals)
  medium: [0.22, 1, 0.36, 1] as const,
  
  // Standard easing curves
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  
  // Bouncy, playful animations
  bounce: [0.34, 1.56, 0.64, 1] as const,
  
  // Smooth, elastic feel
  elastic: [0.68, -0.55, 0.265, 1.55] as const,
} as const;

// Duration tokens (in milliseconds)
export const motionDurations = {
  // Micro-interactions (button press, toggle)
  fast: 120,
  
  // Standard transitions (cards, modals)
  medium: 240,
  
  // Slower, more dramatic (page transitions)
  slow: 420,
  
  // Very slow (parallax, ambient animations)
  verySlow: 800,
} as const;

// Spring configurations
export const motionSprings = {
  // Snappy spring (buttons, toggles)
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },
  
  // Bouncy spring (fun interactions)
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
    mass: 1,
  },
  
  // Smooth spring (cards, panels)
  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },
  
  // Gentle spring (background elements)
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
    mass: 1.2,
  },
} as const;

// Common animation variants
export const motionVariants = {
  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  // Slide up from bottom
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  // Slide down from top
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  // Scale and fade
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  
  // Blur and fade
  blur: {
    initial: { opacity: 0, filter: 'blur(4px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(4px)' },
  },
  
  // Slide and blur combined
  blurSlide: {
    initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -20, filter: 'blur(4px)' },
  },
  
  // Pop in (scale with bounce)
  pop: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: motionSprings.bouncy,
    },
    exit: { opacity: 0, scale: 0.9 },
  },
} as const;

// Stagger configurations for lists/grids
export const motionStagger = {
  // Fast stagger (small lists, 3-5 items)
  fast: {
    staggerChildren: 0.05,
    delayChildren: 0.05,
  },
  
  // Medium stagger (medium lists, 5-10 items)
  medium: {
    staggerChildren: 0.08,
    delayChildren: 0.1,
  },
  
  // Slow stagger (large lists, 10+ items)
  slow: {
    staggerChildren: 0.12,
    delayChildren: 0.15,
  },
  
  // Reverse stagger (exit animations)
  reverse: {
    staggerChildren: 0.05,
    staggerDirection: -1,
  },
} as const;

// Preset transition combinations
export const motionPresets = {
  // Button tap animation
  buttonTap: {
    scale: 0.98,
    transition: { duration: motionDurations.fast / 1000 },
  },
  
  // Card hover lift
  cardHover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: motionDurations.medium / 1000,
      ease: motionEasing.medium,
    },
  },
  
  // Toast entrance
  toastEnter: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: motionDurations.medium / 1000,
        ease: motionEasing.fast,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: motionDurations.fast / 1000,
      },
    },
  },
  
  // Modal appearance
  modalAppear: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: motionDurations.medium / 1000,
        ease: motionEasing.medium,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: motionDurations.fast / 1000,
      },
    },
  },
  
  // Page transition
  pageTransition: {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: motionDurations.slow / 1000,
        ease: motionEasing.medium,
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: motionDurations.medium / 1000,
      },
    },
  },
} as const;

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Helper to get safe animation config (respects reduced motion preference)
export const getSafeAnimation = <T extends object>(animation: T, fallback: Partial<T> = {}): T => {
  if (prefersReducedMotion()) {
    return { ...animation, ...fallback, transition: { duration: 0.01 } } as T;
  }
  return animation;
};

// Helper to create custom transition
export const createTransition = (
  duration: keyof typeof motionDurations = 'medium',
  easing: keyof typeof motionEasing = 'medium'
) => ({
  duration: motionDurations[duration] / 1000,
  ease: motionEasing[easing],
});

// Export types for TypeScript
export type MotionEasing = keyof typeof motionEasing;
export type MotionDuration = keyof typeof motionDurations;
export type MotionSpring = keyof typeof motionSprings;
export type MotionVariant = keyof typeof motionVariants;
export type MotionStagger = keyof typeof motionStagger;
export type MotionPreset = keyof typeof motionPresets;
