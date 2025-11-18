import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.875rem] border-2 border-border text-sm font-semibold tracking-wide touch-manipulation transition-transform transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_6px_0_0_rgba(15,23,42,1),0_16px_24px_-8px_rgba(15,23,42,0.25)] active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_6px_0_0_rgba(15,23,42,1),0_16px_24px_-8px_rgba(15,23,42,0.25)] active:shadow-none",
        outline:
          "border-2 border-accent bg-background text-accent hover:bg-accent hover:text-accent-foreground",
        ghost: 
          "border-2 border-border bg-transparent hover:bg-secondary hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        success:
          "bg-green-500 text-white hover:bg-green-600 shadow-md active:shadow-none",
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