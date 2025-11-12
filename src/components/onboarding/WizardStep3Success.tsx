"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, CheckCircle } from "lucide-react";

export interface WizardStep3SuccessProps {
  itemCount: number;
}

// Simple confetti particle component
function ConfettiParticle() {
  const randomLeft = Math.random() * 100;
  const randomDelay = Math.random() * 0.2;
  const randomDuration = 2 + Math.random() * 0.5;
  const randomRotation = Math.random() * 360;

  return (
    <motion.div
      className="fixed pointer-events-none"
      initial={{
        left: `${randomLeft}%`,
        top: "-10px",
        opacity: 1,
        rotate: 0,
      }}
      animate={{
        top: "100vh",
        opacity: 0,
        rotate: randomRotation,
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        ease: "easeIn",
      }}
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
      }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"][
            Math.floor(Math.random() * 5)
          ],
        }}
      />
    </motion.div>
  );
}

export function WizardStep3Success({ itemCount }: WizardStep3SuccessProps) {
  const [confetti, setConfetti] = useState<number[]>([]);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 30 });
    setConfetti(particles.map((_, i) => i));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Confetti animation */}
      {confetti.map((i) => (
        <ConfettiParticle key={i} />
      ))}

      {/* Main success icon */}
      <motion.div
        className="flex justify-center"
        variants={itemVariants}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.6,
          delay: 0.3,
          repeat: 2,
        }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <CheckCircle className="h-24 w-24 text-green-600 dark:text-green-400 relative" />
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          You&apos;re all set!
        </h2>
        <p className="text-lg text-muted-foreground">
          Your wardrobe is ready to shine ✨
        </p>
      </motion.div>

      {/* Stats card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
          <div className="text-center space-y-2">
            <motion.p
              className="text-5xl font-bold text-green-600 dark:text-green-400"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {itemCount}
            </motion.p>
            <p className="text-sm font-semibold text-foreground">
              {itemCount === 1 ? "Item Added" : "Items Added"}
            </p>
            <p className="text-xs text-muted-foreground pt-2">
              {itemCount < 3 ? (
                <>
                  💡 Pro tip: Add more items for better recommendations!
                </>
              ) : (
                <>
                  🎉 Great start! More items = better outfit suggestions.
                </>
              )}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Features preview */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {[
          {
            icon: "🌤️",
            title: "Weather-Smart",
            desc: "Get outfits matched to your local forecast",
          },
          {
            icon: "✨",
            title: "AI-Powered",
            desc: "Smart recommendations based on your style",
          },
          {
            icon: "📊",
            title: "Track Stats",
            desc: "See what you wear and when",
          },
          {
            icon: "🔄",
            title: "Mix & Match",
            desc: "Endless outfit combinations",
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            className="p-3 rounded-lg bg-muted text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <p className="text-2xl mb-1">{feature.icon}</p>
            <p className="text-xs font-semibold text-foreground">
              {feature.title}
            </p>
            <p className="text-xs text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Next steps hint */}
      <motion.div
        variants={itemVariants}
        className="text-center text-sm text-muted-foreground bg-muted p-4 rounded-lg"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="font-semibold text-foreground">Ready for your first outfit?</p>
        </div>
        <p>
          Click the button below to get a personalized outfit recommendation based on today&apos;s weather and your new wardrobe.
        </p>
      </motion.div>
    </motion.div>
  );
}
