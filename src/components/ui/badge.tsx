import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[0.75rem] border-2 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-sm bg-card relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring/50 select-none",
  {
    variants: {
      variant: {
        default:
          "border-accent bg-secondary text-accent-foreground after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_20%_20%,hsl(6_100%_68%)/35%,transparent_70%)] after:opacity-70 after:pointer-events-none",
        secondary:
          "border-border text-muted-foreground hover:bg-secondary",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground",
        outline: 
          "border-border text-foreground hover:bg-secondary",
        success:
          "border-green-500 bg-green-500 text-white",
        warning:
          "border-yellow-500 bg-yellow-400 text-yellow-900",
        info:
          "border-sky-500 bg-sky-400 text-sky-950",
        sticker:
          "border-accent bg-card text-accent-foreground after:absolute after:inset-0 after:bg-[linear-gradient(135deg,hsl(177_79%_26%)/15%,transparent_60%)]",
      },
      tone: {
        coral: "bg-primary text-primary-foreground border-primary",
        teal: "bg-accent text-accent-foreground border-accent",
        muted: "bg-muted text-muted-foreground border-border",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, tone, ...props }: BadgeProps & { tone?: "coral" | "teal" | "muted" }) {
  return (
    <div className={cn(badgeVariants({ variant, tone }), className)} {...props} />
  );
}

export { Badge, badgeVariants };