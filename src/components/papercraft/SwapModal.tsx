"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Loader2 } from "lucide-react";
import { SystemDialog, RetroButton } from "@/components/papercraft";
import { PapercraftCard, StickerBadge } from "@/components/papercraft";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ClothingItem {
  id: string;
  name?: string;
  category: string;
  color?: string;
  season_tags?: string[];
  image_url?: string;
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: ClothingItem;
  availableItems: ClothingItem[];
  onSwap: (newItem: ClothingItem) => Promise<void>;
}

export function SwapModal({
  isOpen,
  onClose,
  currentItem,
  availableItems,
  onSwap,
}: SwapModalProps) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwapClick = async () => {
    if (!selectedItem) return;
    
    setIsSwapping(true);
    try {
      await onSwap(selectedItem);
      onClose();
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsSwapping(false);
      setSelectedItem(null);
    }
  };

  if (!isOpen) return null;

  // Filter out the current item from available items
  const swappableItems = availableItems.filter(
    (item) => item.id !== currentItem.id
  );

  return (
    <SystemDialog
      open={isOpen}
      onClose={onClose}
      title={`Swap ${currentItem.category}`}
      type="info"
    >
      <div className="space-y-4">
        {/* Current item display */}
        <div className="pb-4 border-b-2 border-[var(--border)]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Currently wearing
          </p>
          <PapercraftCard
            variant="flat"
            paperTexture
            className="flex items-center gap-3 p-3"
          >
            {currentItem.image_url && (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[14px] border-[2px] border-[var(--border-strong)] bg-[var(--paper)]">
                <Image
                  src={currentItem.image_url}
                  alt={currentItem.name || currentItem.category}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {currentItem.name || currentItem.category}
              </p>
                <div className="mt-1 flex flex-wrap gap-1">
                {currentItem.color && (
                  <StickerBadge type="info" text={currentItem.color} />
                )}
                {currentItem.season_tags?.map((tag) => (
                  <StickerBadge key={tag} type="success" text={tag} />
                ))}
              </div>
            </div>
          </PapercraftCard>
        </div>

        {/* Available items grid */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Pick a replacement ({swappableItems.length} available)
          </p>
          
          {swappableItems.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-[18px] border-2 border-dashed border-[var(--border)] bg-[var(--muted)] p-4 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                No other {currentItem.category} items in your wardrobe.
                <br />
                Add more to swap!
              </p>
            </div>
          ) : (
            <div className="grid max-h-[400px] gap-3 overflow-y-auto pr-2 grid-cols-1 sm:grid-cols-2">
              <AnimatePresence>
                {swappableItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <PapercraftCard
                        variant={isSelected ? "elevated" : "flat"}
                        paperTexture
                        hoverEffect="lift"
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected &&
                            "ring-4 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg)]"
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-center gap-3 p-3">
                          {item.image_url ? (
                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[12px] border-[2px] border-[var(--border-strong)] bg-[var(--paper)]">
                              <Image
                                src={item.image_url}
                                alt={item.name || item.category}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 flex-shrink-0 rounded-[12px] border-[2px] border-dashed border-[var(--border)] bg-[var(--muted)] flex items-center justify-center">
                              <span className="text-2xl">📦</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {item.name || item.category}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.color && (
                                <StickerBadge type="info" text={item.color} />
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <StickerBadge type="primary" text="Selected" icon="✓" />
                            </div>
                          )}
                        </div>
                      </PapercraftCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-[var(--border)]">
          <RetroButton
            variant="secondary"
            onClick={onClose}
            disabled={isSwapping}
          >
            Cancel
          </RetroButton>
          <RetroButton
            variant="primary"
            onClick={handleSwapClick}
            disabled={!selectedItem || isSwapping}
          >
            {isSwapping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Swapping...
              </>
            ) : (
              <>Swap & regenerate</>
            )}
          </RetroButton>
        </div>
      </div>
    </SystemDialog>
  );
}
