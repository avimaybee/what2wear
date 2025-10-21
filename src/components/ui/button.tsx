import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/85",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/90",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/90",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        success:
          "bg-green-500 text-white shadow-sm hover:bg-green-600 active:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700",
      },
      size: {
        default: "h-10 px-4 py-2 md:h-9", // 40px on mobile, 36px on desktop
        sm: "h-9 rounded-md px-3 text-xs", // 36px
        lg: "h-12 rounded-md px-6 text-base md:h-11", // 48px on mobile, 44px on desktop
        icon: "h-12 w-12 md:h-11 md:w-11", // 48px on mobile, 44px on desktop
        touch: "h-12 min-w-[44px] px-4 py-2", // Always 48px for mobile-first
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