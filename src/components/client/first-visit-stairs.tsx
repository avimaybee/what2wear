"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { StairsPreloader } from "@/components/ui/stairs-preloader";

interface FirstVisitStairsProps {
  children: React.ReactNode;
  storageKey?: string;
  duration?: number;
  steps?: number;
}

/**
 * FirstVisitStairs Component
 * Shows stairs preloader animation only on the user's first visit
 * Uses localStorage to track if the user has seen the animation
 */
export const FirstVisitStairs: React.FC<FirstVisitStairsProps> = ({
  children,
  storageKey = "setmyfit-stairs-seen",
  duration = 1.5,
  steps = 6,
}) => {
  const [showStairs, setShowStairs] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if user has seen the stairs animation before
    const hasSeenStairs = localStorage.getItem(storageKey);
    
    if (!hasSeenStairs) {
      // First visit - show stairs
      setShowStairs(true);
      localStorage.setItem(storageKey, "true");
    }
    
    // Mark as ready to render (prevents hydration mismatch)
    setIsReady(true);
  }, [storageKey]);

  const handleComplete = () => {
    setShowStairs(false);
  };

  // Don't render until we've checked localStorage (prevents hydration mismatch)
  if (!isReady) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showStairs && (
          <StairsPreloader
            onComplete={handleComplete}
            duration={duration}
            steps={steps}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );
};
