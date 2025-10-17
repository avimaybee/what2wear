import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-background hover:bg-primary/80",
        secondary:
          "border-transparent bg-card text-foreground hover:bg-card/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-green-500/20 text-green-400 border-green-500/30",
        warning:
          "border-transparent bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        danger:
          "border-transparent bg-red-500/20 text-red-400 border-red-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
