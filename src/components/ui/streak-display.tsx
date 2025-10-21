/**
 * Streak Display Component
 * 
 * Visual representation of outfit logging streak with fire animation
 */

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  className
}: StreakDisplayProps) {
  const isActive = currentStreak > 0;
  
  return (
    <Card className={cn(
      "p-6 relative overflow-hidden",
      "bg-gradient-to-br from-orange-500/5 via-background to-red-500/5",
      className
    )}>
      {/* Animated background glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Logging Streak</h3>
          
          {/* Fire emoji with animation */}
          <motion.div
            className="text-4xl"
            animate={isActive ? {
              scale: [1, 1.2, 1],
              rotate: [-5, 5, -5]
            } : {}}
            transition={{
              duration: 0.5,
              repeat: isActive ? Infinity : 0,
              repeatDelay: 0.5
            }}
          >
            {isActive ? '🔥' : '💤'}
          </motion.div>
        </div>
        
        {/* Current streak */}
        <div className="flex items-baseline gap-2 mb-4">
          <motion.span
            className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            {currentStreak}
          </motion.span>
          <span className="text-lg text-muted-foreground">
            {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
        
        {/* Status message */}
        <p className="text-sm text-muted-foreground mb-3">
          {currentStreak === 0 && "Log an outfit today to start your streak!"}
          {currentStreak > 0 && currentStreak < 7 && "Keep it up! You're building momentum."}
          {currentStreak >= 7 && currentStreak < 30 && "Great consistency! 🌟"}
          {currentStreak >= 30 && "You're on fire! Amazing dedication! 🏆"}
        </p>
        
        {/* Longest streak badge */}
        {longestStreak > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Personal Best</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{longestStreak}</span>
              <span className="text-xs text-muted-foreground">
                {longestStreak === 1 ? 'day' : 'days'}
              </span>
              {longestStreak === currentStreak && currentStreak > 1 && (
                <motion.span
                  className="text-xs ml-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  🎯
                </motion.span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
