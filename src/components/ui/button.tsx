import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[3px] text-sm font-bold tracking-wide touch-manipulation transition-transform transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-1",
  {
    variants: {
      variant: {
        default:
          "border-border bg-primary text-primary-foreground hover:bg-primary/90 shadow-[4px_4px_0_0_rgba(26,26,26,0.6)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border shadow-[4px_4px_0_0_rgba(26,26,26,0.6)]",
        destructive:
          "border-border bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[4px_4px_0_0_rgba(26,26,26,0.6)]",
        outline:
          "border-[3px] border-accent bg-background text-accent hover:bg-accent hover:text-accent-foreground shadow-[4px_4px_0_0_rgba(26,26,26,0.4)]",
        ghost: 
          "border-0 bg-transparent hover:bg-secondary hover:text-foreground shadow-none",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary/80 border-0 shadow-none",
        success:
          "border-border bg-green-500 text-white hover:bg-green-600 shadow-[4px_4px_0_0_rgba(26,26,26,0.6)]","
      },
      size: {
        default: "h-11 px-6 py-2 md:h-10", // Increased height for more visible button
        sm: "h-9 rounded-lg px-4 text-xs", // Smaller variant
        lg: "h-14 rounded-full px-8 text-base md:h-12", // Larger variant with more padding
        icon: "h-12 w-12 md:h-11 md:w-11", // Icon button size
        touch: "h-12 min-w-[48px] px-6 py-2", // Touch-friendly minimum
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };