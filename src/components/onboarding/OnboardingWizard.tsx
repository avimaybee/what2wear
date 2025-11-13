"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { WizardStep1Upload } from "./WizardStep1Upload";
import { WizardStep2Review } from "./WizardStep2Review";
import { WizardStep3Success } from "./WizardStep3Success";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import { IClothingItem } from "@/lib/types";

export interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  userId?: string;
}

export interface UploadedItem {
  file: File;
  preview: string;
  metadata?: Partial<IClothingItem>;
  isAnalyzing?: boolean;
  error?: string;
}

export function OnboardingWizard({
  open,
  onComplete,
  onSkip,
  userId,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when wizard opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset state when closing
        setCurrentStep(1);
        setUploadedItems([]);
        setError(null);
        setIsProcessing(false);
      }
    },
    []
  );

  const goNext = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => (prev === 3 ? 3 : (prev + 1) as typeof currentStep));
  }, []);

  const goPrev = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => (prev === 1 ? 1 : (prev - 1) as typeof currentStep));
  }, []);

  const handleUpload = useCallback((files: File[]) => {
    const newItems: UploadedItem[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isAnalyzing: false,
    }));
    setUploadedItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleUpdateItemMetadata = useCallback(
    (index: number, metadata: Partial<IClothingItem>) => {
      setUploadedItems((prev) => [
        ...prev.slice(0, index),
        { ...prev[index], metadata: { ...prev[index].metadata, ...metadata } },
        ...prev.slice(index + 1),
      ]);
    },
    []
  );

  const handleRemoveItem = useCallback((index: number) => {
    setUploadedItems((prev) => [
      ...prev.slice(0, index),
      ...prev.slice(index + 1),
    ]);
  }, []);

  const handleCompleteWizard = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Create FormData for multipart file upload
      const formData = new FormData();
      
      // Add each uploaded file with its metadata
      uploadedItems.forEach((item, index) => {
        formData.append('files', item.file);
        
        // Add metadata as JSON string
        if (item.metadata) {
          formData.append(`metadata_${index}`, JSON.stringify({
            name: item.metadata.name || `Item ${index + 1}`,
            type: item.metadata.type,
            color: item.metadata.color,
            material: item.metadata.material,
            style_tags: item.metadata.style_tags || [],
          }));
        }
      });

      // Call the wardrobe upload endpoint
      const response = await fetch('/api/wardrobe/upload-batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.message || 'Failed to save wardrobe items');
      }

      const result = await response.json();
      
      // Show success message
      if (result.success && result.itemsCreated) {
        const itemCountMessage = result.itemsCreated === 1 
          ? '1 item added' 
          : `${result.itemsCreated} items added`;
        
        // Show brief success state before completing
        setTimeout(() => {
          setIsProcessing(false);
          onComplete();
        }, 800);
      } else {
        throw new Error(result.message || 'Failed to create wardrobe items');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMsg);
      setIsProcessing(false);
    }
  }, [uploadedItems, onComplete]);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      // If no skip handler, just close
      setCurrentStep(1);
      setUploadedItems([]);
      setError(null);
    }
  }, [onSkip]);

  // Step validation
  const canProceedToNext = useCallback((): boolean => {
    if (currentStep === 1) {
      return uploadedItems.length > 0;
    }
    if (currentStep === 2) {
      return uploadedItems.every((item) => item.metadata?.type);
    }
    return true;
  }, [currentStep, uploadedItems]);

  const stepVariants = {
    enter: { opacity: 0, x: 100 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  const transition = { duration: 0.3, type: "tween" as const };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="h-screen md:h-auto md:max-w-2xl md:mx-auto md:max-h-[90vh] md:rounded-lg md:inset-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2"
        showClose={false}
      >
        {/* Header with close and back buttons */}
        <div className="flex items-center justify-between mb-6 pt-4 md:pt-0">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: currentStep > 1 ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            onClick={goPrev}
            disabled={currentStep === 1}
            className="p-2 -ml-2 hover:bg-muted rounded-md transition-colors disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Go to previous step"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                className="h-1.5 rounded-full transition-all"
                animate={{
                  width: step === currentStep ? 24 : 8,
                  backgroundColor:
                    step <= currentStep ? "#10b981" : "#e5e7eb",
                }}
                transition={{ duration: 0.3 }}
                aria-label={`Step ${step} of 3`}
              />
            ))}
          </div>

          <button
            onClick={handleSkip}
            className="p-2 -mr-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Close onboarding wizard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        <div className="overflow-hidden relative flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <WizardStep1Upload
                  onUpload={handleUpload}
                  uploadedItems={uploadedItems}
                  onRemoveItem={handleRemoveItem}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <WizardStep2Review
                  uploadedItems={uploadedItems}
                  onUpdateMetadata={handleUpdateItemMetadata}
                  isAnalyzing={isProcessing}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <WizardStep3Success itemCount={uploadedItems.length} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with action buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 1}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (currentStep === 3) {
                handleCompleteWizard();
              } else {
                goNext();
              }
            }}
            disabled={!canProceedToNext() || isProcessing}
            className="flex-1"
          >
            {currentStep === 1 && "Review Items"}
            {currentStep === 2 && "Confirm & Celebrate"}
            {currentStep === 3 && "Get My First Outfit"}
          </Button>
        </div>

        {/* Skip hint */}
        <div className="text-center mt-4 text-xs text-muted-foreground">
          {currentStep === 1 && (
            <p>Add at least 3 items for better recommendations</p>
          )}
          {currentStep === 2 && (
            <p>
              Make sure each item has a type selected • You can edit colors too
            </p>
          )}
          {currentStep === 3 && <p>Almost there! One more click to get started</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
