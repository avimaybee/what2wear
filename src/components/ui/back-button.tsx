"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  label?: string;
  className?: string;
  fallbackPath?: string;
}

/**
 * Back Button Component
 * 
 * Provides intuitive navigation back to the previous page
 * Falls back to a specified path if no history exists
 */
export function BackButton({ 
  label = "Back", 
  className,
  fallbackPath = "/" 
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // On mobile, check if document.referrer exists and navigate accordingly
    // This ensures proper back navigation instead of always going to home
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      // Fallback to specified path if no meaningful history
      router.push(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn("gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
