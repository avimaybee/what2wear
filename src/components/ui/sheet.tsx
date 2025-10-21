"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-card p-6 shadow-2xl transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top rounded-b-lg",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom rounded-t-lg",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm rounded-r-lg",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm rounded-l-lg",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /**
   * Whether to show the close button
   * @default true
   */
  showClose?: boolean;
  /**
   * Enable swipe-to-close gesture on mobile
   * @default true
   */
  swipeToClose?: boolean;
  /**
   * Callback when sheet is closed via swipe
   */
  onSwipeClose?: () => void;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, showClose = true, swipeToClose = true, onSwipeClose, ...props }, ref) => {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0]);
  
  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    // If dragged down more than 120px, close the sheet
    if (info.offset.y > 120 && side === "bottom") {
      onSwipeClose?.();
      // Trigger close via Radix dialog
      const closeButton = document.querySelector('[data-state="open"] button[data-radix-dialog-close]') as HTMLButtonElement;
      closeButton?.click();
    }
  };

  // Separate mobile and desktop rendering
  const isMobileBottomSheet = swipeToClose && side === "bottom";

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        asChild={isMobileBottomSheet}
        {...props}
      >
        {isMobileBottomSheet ? (
          <motion.div
            style={{ y, opacity }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag Handle for mobile bottom sheets */}
            <div 
              className="mx-auto mb-4 mt-2 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/20 md:hidden cursor-grab active:cursor-grabbing" 
              aria-label="Drag to close"
            />
            
            {children}
            
            {showClose && (
              <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            )}
          </motion.div>
        ) : (
          <>
            {children}
            {showClose && (
              <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            )}
          </>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
