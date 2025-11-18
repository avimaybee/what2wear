"use client";

import { motion } from "framer-motion";
import { Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRef } from "react";
import type { UploadedItem } from "./OnboardingWizard";

export interface WizardStep1UploadProps {
  onUpload: (files: File[]) => void;
  uploadedItems: UploadedItem[];
  onRemoveItem: (index: number) => void;
}

export function WizardStep1Upload({
  onUpload,
  uploadedItems,
  onRemoveItem,
}: WizardStep1UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    if (files.length > 0) {
      onUpload(files);
      e.currentTarget.value = ""; // Reset input
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    if (files.length > 0) {
      onUpload(files);
      e.currentTarget.value = ""; // Reset input
    }
  };

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
        <h2 className="text-2xl font-bold text-foreground">Snap your style</h2>
        <p className="text-muted-foreground mt-2">
          Upload or capture photos of your favorite clothing items. We&apos;ll analyze them and build your digital wardrobe.
        </p>
      </motion.div>

      {/* Upload and Camera buttons */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-auto flex-col gap-2 py-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm font-medium">Upload Photos</span>
            <span className="text-xs text-muted-foreground">From gallery</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload clothing photos"
          />
        </motion.div>

        <motion.div variants={item}>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-auto flex-col gap-2 py-4"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-6 w-6" />
            <span className="text-sm font-medium">Take Photo</span>
            <span className="text-xs text-muted-foreground">Use camera</span>
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
            aria-label="Capture photo with camera"
          />
        </motion.div>
      </motion.div>

      {/* Tips section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-muted p-4 rounded-lg"
      >
        <p className="text-sm font-semibold text-foreground mb-3">
          📸 Photography Tips
        </p>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="text-foreground">• Use a neutral background (plain wall or bed)</li>
          <li className="text-foreground">• Capture the full garment clearly</li>
          <li className="text-foreground">• Good lighting helps us detect colors better</li>
          <li className="text-foreground">• One item per photo works best</li>
        </ul>
      </motion.div>

      {/* Uploaded items preview */}
      {uploadedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Uploaded ({uploadedItems.length})
            </h3>
            {uploadedItems.length > 0 && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-green-600 dark:text-green-400 font-medium"
              >
                ✓ Ready to review
              </motion.p>
            )}
          </div>

          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {uploadedItems.map((uploadedItem, index) => (
              <motion.div
                key={index}
                variants={item}
                className="relative group"
              >
                <Card className="overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedItem.preview}
                    alt={`Uploaded item ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </Card>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onRemoveItem(index)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove uploaded item ${index + 1}`}
                >
                  <span className="text-lg leading-none">×</span>
                </motion.button>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/90 text-xs font-medium px-2 py-1 rounded"
                >
                  #{index + 1}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-xs text-muted-foreground">
            Tip: You can add more items anytime by uploading again
          </p>
        </motion.div>
      )}

      {/* Empty state message */}
      {uploadedItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8 text-muted-foreground"
        >
          <p className="text-sm">
            No photos yet. Start by uploading or taking a photo!
          </p>
        </motion.div>
      )}
    </div>
  );
}
