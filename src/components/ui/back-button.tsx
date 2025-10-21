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
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to specified path if no history
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
