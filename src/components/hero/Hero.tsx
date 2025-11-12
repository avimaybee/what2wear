"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Shirt, ArrowRight, Camera, Sun, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeroProps {
  isAuthenticated: boolean;
  hasWardrobe: boolean;
  className?: string;
}

/**
 * Hero component - Creates a brand moment for what2wear
 * Displays differently based on authentication and wardrobe state
 * 
 * Features:
 * - Animated headline and description
 * - Dynamic CTA buttons (Get Outfit vs Add Wardrobe)
 * - Weather/scene chip animation
 * - Mobile-first responsive design
 * - Accessibility: keyboard navigation, aria-labels, semantic HTML
 */
export const Hero = ({ isAuthenticated, hasWardrobe, className }: HeroProps) => {
  const [showScrollHint, setShowScrollHint] = useState(true);

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
  const shouldReduceMotion = useReducedMotion();

  // Animation variants for staggered entry
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const sparkleVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
        delay: 0.3,
      },
    },
  };

  // Subtle pulse animation for accent elements
  const pulseVariants = {
    initial: { scale: 1, opacity: 0.8 },
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  // Determine primary CTA based on user state
  const primaryCTA = {
    label: isAuthenticated && hasWardrobe ? "Get Outfit" : "Add Wardrobe",
    href: isAuthenticated && hasWardrobe ? "/" : "/wardrobe",
    icon: isAuthenticated && hasWardrobe ? ArrowRight : Shirt,
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
        "relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-background via-background to-accent/5",
        className
      )}
      role="region"
      aria-label="Hero introduction section"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-40" />

        {/* Layered modern, subtle radial gradients for depth (blurred, soft blend) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 10% 20%, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.06) 12%, transparent 35%), radial-gradient(ellipse at 85% 80%, rgba(236,72,153,0.08) 0%, rgba(236,72,153,0.04) 18%, transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(15,23,42,0.02))',
            mixBlendMode: 'soft-light',
            opacity: 0.95,
            filter: 'blur(36px)'
          }}
        />
        
        {/* Animated accent blob (top right, subtle) */}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          animate={{
            y: [0, 20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
        
        {/* Animated accent blob (bottom left, subtle) */}
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left column: headline, description and CTAs */}
          <div className="space-y-8">
          {/* Main headline */}
          <motion.div variants={itemVariants} className="space-y-4">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20"
              variants={itemVariants}
              role="img"
              aria-label="AI-powered feature indicator"
            >
              <motion.div variants={sparkleVariants}>
                <Sparkles className="h-4 w-4" />
              </motion.div>
              <span className="text-sm font-medium">AI-Powered Style Assistant</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center md:text-left max-w-[60ch] mx-auto md:mx-0"
            >
              <span className="block">What to Wear</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                Just Got Smarter
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-[60ch] leading-relaxed text-center md:text-left mx-auto md:mx-0"
            >
              Get personalized outfit recommendations powered by AI, tailored to your
              weather, location, and unique wardrobe. Look great every day, effortlessly.
            </motion.p>
          </motion.div>

          {/* Weather/Scene indicator chip */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border glass-thin"
            aria-live="polite"
            aria-label="Weather-based recommendation indicator"
          >
            <motion.div
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-foreground">
              Real-time recommendations based on weather and location
            </span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Link href={primaryCTA.href} className="flex-1">
              <Button
                size="lg"
                className="w-full group relative overflow-hidden"
                aria-label={`${primaryCTA.label} - Get started with setmyfit`}
              >
                <motion.span
                  className="flex items-center justify-center gap-2"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {primaryCTA.label}
                  <primaryCTA.icon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.span>
              </Button>
            </Link>

            <Link href={secondaryCTA.href} className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                aria-label={secondaryCTA.label}
              >
                {secondaryCTA.label}
              </Button>
            </Link>
          </motion.div>

          </div>

          {/* Right column: feature chips (uses remaining horizontal space on desktop) */}
          <motion.div
            variants={itemVariants}
            className="hidden md:flex flex-col items-start justify-center gap-6 pl-8 border-l border-border/20"
            aria-hidden="true"
          >
            {[
              { icon: <Camera className="h-6 w-6 text-primary" />, label: "Smart Photo", description: "AI analyzes your clothes" },
              { icon: <Sun className="h-6 w-6 text-primary" />, label: "Weather Smart", description: "Context-aware picks" },
              { icon: <Zap className="h-6 w-6 text-primary" />, label: "Instant", description: "Real-time suggestions" },
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex items-center gap-4 bg-card p-3 rounded-lg border border-border/10 shadow-sm"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/5">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{feature.label}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - hidden on mobile, shown on desktop */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center"
        animate={
          showScrollHint
            ? { opacity: 1, y: [0, 8, 0] }
            : { opacity: 0, y: 0 }
        }
        transition={
          showScrollHint
            ? { y: { duration: 2, repeat: Infinity }, opacity: { duration: 0.45 } }
            : { opacity: { duration: 0.35 } }
        }
        style={{ pointerEvents: showScrollHint ? "auto" : "none" }}
        aria-hidden={!showScrollHint}
      >
        <div className="text-muted-foreground text-sm">Scroll to explore</div>
      </motion.div>
    </motion.section>
  );
};
