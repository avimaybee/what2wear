/**
 * Stat Card Component
 * 
 * Displays a single statistic with value, label, icon, and optional trend
 */

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  className,
  delay = 0
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn(
        "p-4 hover:shadow-lg transition-all duration-300",
        "bg-gradient-to-br from-background to-muted/20",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">
              {label}
            </p>
            <motion.p
              className="text-3xl font-bold mb-1"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: delay + 0.2, type: "spring" }}
            >
              {value}
            </motion.p>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-0.5 rounded-full",
                trend.isPositive 
                  ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              )}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <motion.div
            className="text-3xl ml-2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: delay + 0.1, type: "spring" }}
          >
            {icon}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
