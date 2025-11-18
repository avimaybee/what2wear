"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  userId?: string;
}

/**
 * Onboarding wizard - currently disabled in favor of wardrobe-based onboarding flow.
 * Kept as stub for potential future use.
 */
export function OnboardingWizard({
  open,
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const handleClose = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-auto max-w-2xl mx-auto rounded-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Welcome to SetMyFit</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4 py-8">
          <p className="text-center text-muted-foreground">
            Head to your wardrobe to add your first clothing items and start getting personalized outfit recommendations!
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              className="flex-1"
            >
              Get Started
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
