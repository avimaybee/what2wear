"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  tips?: string[];
  className?: string;
  variant?: "default" | "minimal" | "illustrated";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  tips = [],
  className,
  variant = "default"
}: EmptyStateProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as any
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
        delay: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.3 + i * 0.1
      }
    })
  };

  if (variant === "minimal") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("text-center space-y-4 py-12", className)}
      >
        <motion.div
          variants={iconVariants}
          className="flex justify-center"
        >
          <div className="rounded-full bg-muted p-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Button
                    onClick={action.onClick}
                    variant={action.variant || "default"}
                    size="sm"
                  >
                    {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card className={cn(
        "border-dashed",
        variant === "illustrated" && "bg-gradient-to-br from-accent/5 to-transparent"
      )}>
        <CardContent className={cn(
          "text-center space-y-6 py-12",
          variant === "illustrated" ? "px-8" : "px-6"
        )}>
          {/* Animated Icon */}
          <motion.div
            variants={iconVariants}
            className="flex justify-center"
          >
            <div className={cn(
              "rounded-full bg-gradient-to-br shadow-sm",
              variant === "illustrated"
                ? "from-primary/10 to-primary/5 p-8"
                : "from-muted to-muted/50 p-6"
            )}>
              <Icon className={cn(
                variant === "illustrated"
                  ? "h-16 w-16 text-primary"
                  : "h-12 w-12 text-muted-foreground"
              )} />
            </div>
          </motion.div>

          {/* Content */}
          <div className="space-y-3 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-accent/10 border border-accent/20 rounded-lg p-4 max-w-md mx-auto"
            >
              <p className="text-xs font-medium text-accent-foreground/80 mb-2">
                💡 Quick Tips
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 text-left">
                {tips.map((tip, index) => (
                  <motion.li
                    key={index}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <motion.div
                    key={action.label}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Button
                      onClick={action.onClick}
                      variant={action.variant || (index === 0 ? "default" : "outline")}
                      size="lg"
                      className="min-w-[140px]"
                    >
                      {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
