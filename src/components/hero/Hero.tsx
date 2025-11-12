"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Shirt, ArrowRight } from "lucide-react";
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
      initial="hidden"
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
        <div className="max-w-3xl mx-auto space-y-8">
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

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="block">What to Wear</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                Just Got Smarter
              </span>
            </h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
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

          {/* Trust badges / Feature highlights */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pt-8 border-t border-border/50"
          >
            {[
              { icon: "📸", label: "Smart Photo", description: "AI analyzes your clothes" },
              { icon: "🌤️", label: "Weather Smart", description: "Context-aware picks" },
              { icon: "⚡", label: "Instant", description: "Real-time suggestions" },
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                variants={itemVariants}
                custom={index}
                className="text-center space-y-2"
              >
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {feature.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - hidden on mobile, shown on desktop */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        aria-hidden="true"
      >
        <div className="text-muted-foreground text-sm">Scroll to explore</div>
      </motion.div>
    </motion.section>
  );
};
