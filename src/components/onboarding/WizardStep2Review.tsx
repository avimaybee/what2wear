"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { UploadedItem } from "./OnboardingWizard";
import type { IClothingItem, ClothingType } from "@/lib/types";

export interface WizardStep2ReviewProps {
  uploadedItems: UploadedItem[];
  onUpdateMetadata: (index: number, metadata: Partial<IClothingItem>) => void;
  isAnalyzing: boolean;
}

// Clothing type options
const CLOTHING_TYPES = [
  { value: "top", label: "Top (shirt, blouse, sweater)" },
  { value: "bottom", label: "Bottom (pants, skirt, shorts)" },
  { value: "shoes", label: "Shoes" },
  { value: "outerwear", label: "Outerwear (jacket, coat)" },
  { value: "accessories", label: "Accessories" },
  { value: "underwear", label: "Underwear" },
];

const DRESS_CODES = [
  { value: "casual", label: "Casual" },
  { value: "business-casual", label: "Business Casual" },
  { value: "formal", label: "Formal" },
  { value: "athletic", label: "Athletic" },
];

export function WizardStep2Review({
  uploadedItems,
  onUpdateMetadata,
}: WizardStep2ReviewProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Step title and description */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-foreground">Review your items</h2>
        <p className="text-muted-foreground mt-2">
          Make sure each item has a type selected. You can edit the details if needed.
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900"
      >
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          We&apos;ll analyze these photos to detect colors, materials, and style. You can adjust them here.
        </p>
      </motion.div>

      {/* Items grid */}
      <motion.div
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {uploadedItems.map((uploadedItem, index) => (
          <motion.div key={index} variants={item}>
            <Card className="p-4 space-y-4">
              {/* Image and basic info */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedItem.preview}
                    alt={`Item ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  {/* Item type selector */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Item Type *
                    </label>
                    <select
                      value={uploadedItem.metadata?.type || ""}
                      onChange={(e) =>
                        onUpdateMetadata(index, { type: e.target.value as ClothingType })
                      }
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={`Item type for item ${index + 1}`}
                    >
                      <option value="">Select a type...</option>
                      {CLOTHING_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {uploadedItem.metadata?.type && (
                      <motion.p
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs text-green-600 dark:text-green-400 mt-1"
                      >
                        ✓ Confirmed
                      </motion.p>
                    )}
                  </div>

                  {/* Dress code selector */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Dress Code
                    </label>
                    <select
                      value={uploadedItem.metadata?.dress_code?.[0] || ""}
                      onChange={(e) =>
                        onUpdateMetadata(index, {
                          dress_code: [e.target.value],
                        })
                      }
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={`Dress code for item ${index + 1}`}
                    >
                      <option value="">Auto-detect</option>
                      {DRESS_CODES.map((code) => (
                        <option key={code.value} value={code.value}>
                          {code.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Color preview (if available) */}
              {uploadedItem.metadata?.color && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2 border-t"
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Detected Color
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-input"
                      style={{
                        backgroundColor: uploadedItem.metadata.color as string,
                      }}
                      aria-label={`Color: ${uploadedItem.metadata.color}`}
                    />
                    <span className="text-sm text-foreground">
                      {uploadedItem.metadata.color}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Error state */}
              {uploadedItem.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-destructive bg-destructive/10 p-2 rounded"
                >
                  {uploadedItem.error}
                </motion.div>
              )}

              {/* Analyzing state */}
              {uploadedItem.isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-muted-foreground">
                    🔍 Analyzing image...
                  </p>
                  <Skeleton className="h-8 w-full" />
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Validation message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground text-center"
      >
        {uploadedItems.filter((item) => !item.metadata?.type).length > 0 ? (
          <p className="text-amber-600 dark:text-amber-400">
            ⚠️ Please select a type for all items before proceeding
          </p>
        ) : (
          <p className="text-green-600 dark:text-green-400">
            ✓ All items are ready to confirm
          </p>
        )}
      </motion.div>
    </div>
  );
}
