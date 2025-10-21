/**
 * Achievement Badge Component
 * 
 * Displays an achievement with unlock status and progress
 */

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/lib/gamification/stats';

interface AchievementBadgeProps {
  achievement: Achievement;
  index?: number;
}

export function AchievementBadge({ achievement, index = 0 }: AchievementBadgeProps) {
  const { title, description, icon, unlocked, progress = 0, current, target } = achievement;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className={cn(
        "p-4 relative overflow-hidden transition-all duration-300",
        unlocked 
          ? "bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 hover:shadow-lg border-amber-500/20" 
          : "bg-muted/30 hover:bg-muted/50 opacity-75"
      )}>
        {/* Unlock shine effect */}
        {unlocked && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />
        )}
        
        <div className="relative z-10 flex items-start gap-3">
          {/* Icon */}
          <motion.div
            className={cn(
              "text-3xl flex-shrink-0",
              !unlocked && "grayscale opacity-50"
            )}
            animate={unlocked ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{
              duration: 0.5,
              repeat: unlocked ? Infinity : 0,
              repeatDelay: 3
            }}
          >
            {icon}
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={cn(
                "font-semibold text-sm",
                unlocked ? "text-foreground" : "text-muted-foreground"
              )}>
                {title}
              </h4>
              {unlocked && (
                <Badge 
                  variant="secondary"
                  className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs"
                >
                  Unlocked
                </Badge>
              )}
            </div>
            
            <p className={cn(
              "text-xs mb-2",
              unlocked ? "text-muted-foreground" : "text-muted-foreground/70"
            )}>
              {description}
            </p>
            
            {/* Progress bar */}
            {!unlocked && progress !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Progress
                  </span>
                  {current !== undefined && target !== undefined && (
                    <span className="text-muted-foreground font-medium">
                      {current}/{target}
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
            
            {/* Unlock date */}
            {unlocked && achievement.unlockedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Achievement Grid Component
 * 
 * Displays all achievements in a responsive grid
 */
interface AchievementGridProps {
  achievements: Achievement[];
  className?: string;
}

export function AchievementGrid({ achievements, className }: AchievementGridProps) {
  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);
  
  // Sort locked achievements by progress (closest to unlocking first)
  const sortedLocked = locked.sort((a, b) => (b.progress || 0) - (a.progress || 0));
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <Badge variant="secondary" className="text-sm">
          {unlocked.length}/{achievements.length}
        </Badge>
      </div>
      
      {/* Unlocked achievements */}
      {unlocked.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Unlocked</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unlocked.map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Locked achievements */}
      {sortedLocked.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Locked</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedLocked.map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                index={unlocked.length + index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
