"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Shirt, ArrowRight, Camera, Sun, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motionDurations, motionEasing, motionStagger } from "@/lib/motion";

interface HeroProps {
  isAuthenticated: boolean;
  hasWardrobe: boolean;
  className?: string;
  onGetOutfitClick?: () => void;
}

/**
 * Hero component - Creates a premium brand moment for setmyfit
 * 
 * Improvements:
 * - Dynamic gradient text with animation
 * - Enhanced background with moving gradients
 * - Floating animated elements for visual interest
 * - Improved button states and hover effects
 * - Better mobile responsiveness
 * - More engaging feature showcase
 * - Smooth scroll detection and animations
 */
export const Hero = ({ isAuthenticated, hasWardrobe, className, onGetOutfitClick }: HeroProps) => {
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Hide the scroll hint once the user scrolls down a little.
    // Use requestAnimationFrame to avoid layout thrashing on fast scroll events.
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          const y = window.scrollY || window.pageYOffset || 0;
          setShowScrollHint(y <= 60);
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const shouldReduceMotion = useReducedMotion();

  // Animation variants for staggered entry
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        ...motionStagger.medium,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionDurations.slow / 1000,
        ease: motionEasing.medium,
      },
    },
  };

  const sparkleVariants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 180,
        damping: 12,
        delay: 0.4,
      },
    },
  };

  // Determine primary CTA based on user state
  const primaryCTA = {
    label: isAuthenticated && hasWardrobe ? "Get Outfit" : "Add Wardrobe",
    href: isAuthenticated && hasWardrobe ? "#dashboard" : "/wardrobe",
    icon: isAuthenticated && hasWardrobe ? ArrowRight : Shirt,
    onClick: isAuthenticated && hasWardrobe ? onGetOutfitClick : undefined,
  };

  const secondaryCTA = {
    label: isAuthenticated ? "View Wardrobe" : "Sign In",
    href: isAuthenticated ? "/wardrobe" : "/auth/sign-in",
  };

  return (
    <motion.section
      variants={containerVariants}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      animate="visible"
      className={cn(
        "relative min-h-screen flex items-center justify-center overflow-hidden",
        "bg-gradient-to-b from-background via-background to-background",
        className
      )}
      role="region"
      aria-label="Hero introduction section"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient layers - extends beyond section for seamless blend */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        
        {/* Dynamic radial gradients */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at ${mousePosition.x}px ${mousePosition.y}px, 
                rgba(99,102,241,0.15) 0%, 
                rgba(99,102,241,0.08) 15%, 
                transparent 40%),
              radial-gradient(ellipse at 85% 80%, 
                rgba(236,72,153,0.1) 0%, 
                rgba(236,72,153,0.05) 18%, 
                transparent 45%)
            `,
            opacity: shouldReduceMotion ? 0 : 1,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Animated accent blob (top right) - removed float animation */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          aria-hidden="true"
        />
        
        {/* Animated accent blob (bottom left) - removed float animation */}
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/8 rounded-full blur-3xl"
          aria-hidden="true"
        />

        {/* Removed floating star elements for minimal design */}
      </div>

      {/* Content container */}
      <div className="relative z-10 container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left column: headline, description and CTAs */}
          <motion.div className="space-y-8">
            {/* Main headline with enhanced typography */}
            <motion.div variants={itemVariants} className="space-y-4">
              <motion.h1
                variants={itemVariants}
                className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-tight max-w-[90%] md:max-w-[85%] font-heading"
              >
                <span className="block text-foreground uppercase">SetMyFit</span>
                <motion.span 
                  className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent"
                  animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  AI-Powered Style
                </motion.span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg sm:text-xl text-muted-foreground max-w-[80%] leading-relaxed"
              >
                Get personalized outfit recommendations powered by AI, tailored to your weather, location, and unique wardrobe. Look great every day, effortlessly.
              </motion.p>
            </motion.div>

            {/* Status badge row */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3"
            >
              <motion.div
                className="paper-tape text-primary"
                variants={itemVariants}
                role="img"
                aria-label="AI-powered feature indicator"
              >
                <motion.div variants={sparkleVariants}>
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                <span className="text-sm font-semibold font-heading">Smart Recommendations</span>
              </motion.div>

              <div
                className="inline-flex flex-1 min-w-[260px] items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-card to-card/80 border border-border/50 backdrop-blur-sm"
                aria-live="polite"
                aria-label="Weather-based recommendation indicator"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-foreground">
                  Real-time recommendations based on weather and location
                </span>
              </div>
            </motion.div>

            {/* Enhanced CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-6"
            >
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="flex-1 sm:flex-initial">
                <div className="mb-3">
                  <span className="paper-tape text-[11px] font-semibold uppercase text-muted-foreground/80 font-heading">
                    Instant Outfit
                  </span>
                </div>
                {primaryCTA.onClick ? (
                  <Button
                    size="lg"
                    onClick={primaryCTA.onClick}
                    className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300 group"
                    aria-label={`${primaryCTA.label} - Get started with setmyfit`}
                  >
                    <motion.span
                      className="flex items-center justify-center gap-2"
                      whileHover={{ x: 4 }}
                    >
                      {primaryCTA.label}
                      <primaryCTA.icon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </motion.span>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    asChild
                    className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300 group"
                  >
                    <Link href={primaryCTA.href} aria-label={`${primaryCTA.label} - Get started with setmyfit`} className="flex items-center justify-center gap-2">
                      {primaryCTA.label}
                      <primaryCTA.icon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                )}
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/80">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Outfit drafted in under 3 seconds
                </p>
              </motion.div>

              <Link href={secondaryCTA.href} className="flex-1 sm:flex-initial">
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 border-2 border-accent text-accent hover:bg-accent/10 transition-all duration-300"
                    aria-label={secondaryCTA.label}
                  >
                    {secondaryCTA.label}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right column: feature showcase with improved styling */}
          <motion.div
            variants={itemVariants}
            className="hidden md:flex flex-col items-start justify-center gap-5 pl-8 border-l border-gradient-to-b from-border/50 to-border/0"
            aria-hidden="true"
          >
            {[
              { 
                icon: <Camera className="h-6 w-6 text-primary" />, 
                label: "Smart Photo", 
                description: "AI analyzes your clothes",
                delay: 0 
              },
              { 
                icon: <Sun className="h-6 w-6 text-amber-500 dark:text-amber-400" />, 
                label: "Weather Smart", 
                description: "Context-aware picks",
                delay: 0.1 
              },
              { 
                icon: <Zap className="h-6 w-6 text-primary" />, 
                label: "Instant", 
                description: "Real-time suggestions",
                delay: 0.2 
              },
            ].map((feature) => (
              <motion.div
                key={feature.label}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-all duration-300 w-full"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 border border-primary/10">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-foreground">{feature.label}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator with improved styling */}
      <AnimatePresence>
        {showScrollHint && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-muted-foreground text-sm font-medium">Scroll to explore</div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-muted-foreground/60"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
