/**
 * Weekly Activity Chart Component
 * 
 * Displays a bar chart of outfit logging activity over the past 7 days
 */

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeeklyActivityChartProps {
  data: number[]; // 7 days of activity counts
  className?: string;
}

export function WeeklyActivityChart({ data, className }: WeeklyActivityChartProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxValue = Math.max(...data, 1);
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0, Sun=6
  
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Weekly Activity</h3>
          <p className="text-sm text-muted-foreground">
            Last 7 days
          </p>
        </div>
        
        {/* Chart */}
        <div className="flex items-end justify-between gap-2 h-32">
          {data.map((value, index) => {
            const heightPercent = (value / maxValue) * 100;
            const isToday = index === 6; // Last item is always today
            
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                {/* Bar */}
                <div className="relative w-full h-full flex items-end justify-center">
                  <motion.div
                    className={cn(
                      "w-full rounded-t-md transition-colors",
                      isToday 
                        ? "bg-gradient-to-t from-primary to-primary/70" 
                        : value > 0 
                          ? "bg-gradient-to-t from-muted-foreground/30 to-muted-foreground/20"
                          : "bg-muted/50"
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {/* Value label */}
                    {value > 0 && (
                      <motion.div
                        className={cn(
                          "absolute -top-6 left-1/2 -translate-x-1/2",
                          "text-xs font-medium",
                          isToday ? "text-primary" : "text-muted-foreground"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                      >
                        {value}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
                
                {/* Day label */}
                <div className="text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {days[index]}
                  </p>
                  {isToday && (
                    <p className="text-[10px] text-primary">Today</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Stats */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-semibold">
              {data.reduce((sum, val) => sum + val, 0)} outfits
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Average</p>
            <p className="font-semibold">
              {(data.reduce((sum, val) => sum + val, 0) / 7).toFixed(1)} per day
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
