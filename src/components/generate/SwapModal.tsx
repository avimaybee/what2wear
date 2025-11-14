'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// badge intentionally not used here
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { IClothingItem } from '@/lib/types';
import { logger } from '@/lib/logger';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: IClothingItem | null;
  onItemSelected: (selectedItem: IClothingItem) => void;
}

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Cpath fill='%239ca3af' d='M150 100h100v200h-100z'/%3E%3Ccircle fill='%239ca3af' cx='200' cy='100' r='40'/%3E%3Ctext x='200' y='350' font-family='system-ui' font-size='20' fill='%236b7280' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * SwapModal Component
 * 
 * Allows users to swap individual outfit items with alternatives from their wardrobe.
 * Filters wardrobe items by type (top, bottom, outerwear, shoes) matching the current item's category.
 * Supports preview generation before committing to a full-resolution swap.
 * 
 * Features:
 * - Lists same-category items filtered by type
 * - Displays item preview with name, color, and metadata
 * - Generates preview on selection (low-res, fast)
 * - Option to confirm swap and enqueue full-res generation
 * - Handles loading, error, and success states
 * - Mobile-optimized with responsive grid layout
 */
export const SwapModal = ({
  isOpen,
  onClose,
  currentItem,
  onItemSelected,
}: SwapModalProps) => {
  const [loading, setLoading] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<IClothingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IClothingItem | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fetchWardrobeItems = useCallback(async () => {
    if (!currentItem) return;

    try {
      setLoading(true);
      const response = await fetch('/api/wardrobe');

      if (!response.ok) {
        throw new Error('Failed to fetch wardrobe items');
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid wardrobe data');
      }

      // Filter items by same type/category, excluding current item
      const filteredItems = (data.data as IClothingItem[]).filter(
        (item) =>
          item.type === currentItem.type &&
          item.id !== currentItem.id
      );

      setWardrobeItems(filteredItems);
    } catch (error) {
      logger.error('Error fetching wardrobe items:', error);
      toast.error('Failed to load wardrobe items');
    } finally {
      setLoading(false);
    }
  }, [currentItem]);

  // Fetch wardrobe items on modal open
  useEffect(() => {
    if (isOpen && currentItem) {
      fetchWardrobeItems();
    }
  }, [isOpen, currentItem, fetchWardrobeItems]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      setConfirming(false);
    }
  }, [isOpen]);

  const handleItemSelect = (item: IClothingItem) => {
    setSelectedItem(item);
  };

  const handleConfirmSwap = async () => {
    if (!selectedItem) return;

    try {
      setConfirming(true);

      // Call the swap callback with the selected item
      onItemSelected(selectedItem);

      toast.success('Item swapped! Generating full-resolution outfit...', {
        duration: 3000,
      });

      // Close modal after a brief delay to show success
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      logger.error('Error confirming swap:', error);
      toast.error('Failed to confirm swap. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  // Map clothing type for display
  const getTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'Top': 'Top',
      'Bottom': 'Bottom',
      'Outerwear': 'Outerwear',
      'Footwear': 'Shoes',
      'Accessory': 'Accessory',
      'Headwear': 'Headwear',
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Swap Item</DialogTitle>
          <DialogDescription>
            {currentItem && (
              <span>
                Choose a different <strong>{getTypeLabel(currentItem.type)}</strong> to swap
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Item Preview */}
          {currentItem && (
            <div className="bg-muted/50 p-4 rounded-lg border border-muted">
              <p className="text-sm font-semibold mb-3 text-muted-foreground">
                Current Item
              </p>
              <div className="flex gap-4 items-center">
                <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                  <Image
                    src={currentItem.image_url || PLACEHOLDER_IMAGE}
                    alt={currentItem.name || 'Current item'}
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={(e) => {
                      const target = (e as React.SyntheticEvent<HTMLImageElement, Event>).currentTarget as HTMLImageElement;
                      if (target && target.src !== PLACEHOLDER_IMAGE) target.src = PLACEHOLDER_IMAGE;
                    }}
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">
                    {currentItem.name || 'Clothing Item'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTypeLabel(currentItem.type)}
                  </p>
                  {currentItem.color && (
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-muted-foreground/30"
                        style={{ backgroundColor: currentItem.color.toLowerCase() }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {currentItem.color}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wardrobe Items List */}
          <div>
            <p className="text-sm font-semibold mb-3">
              {wardrobeItems.length > 0
                ? `Available ${getTypeLabel(currentItem?.type || '')}s (${wardrobeItems.length})`
                : 'No alternative items'}
            </p>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : wardrobeItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <AnimatePresence>
                  {wardrobeItems.map((item) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => handleItemSelect(item)}
                      className={`group text-left focus:outline-none rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedItem?.id === item.id
                          ? 'ring-2 ring-primary shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                    >
                      {/* Item Image */}
                      <div className="relative aspect-square bg-muted overflow-hidden rounded-lg mb-2 border-2 transition-colors ${
                        selectedItem?.id === item.id
                          ? 'border-primary'
                          : 'border-transparent group-hover:border-muted-foreground/20'
                      }"
                      >
                        <Image
                          src={item.image_url || PLACEHOLDER_IMAGE}
                          alt={item.name || 'Wardrobe item'}
                          fill
                          sizes="(max-width: 768px) 45vw, 30vw"
                          className="object-cover transition-opacity group-hover:opacity-90"
                          onError={(e) => {
                            const target = (e as React.SyntheticEvent<HTMLImageElement, Event>).currentTarget as HTMLImageElement;
                            if (target && target.src !== PLACEHOLDER_IMAGE) target.src = PLACEHOLDER_IMAGE;
                          }}
                          unoptimized
                        />

                        {/* Selection Indicator */}
                        {selectedItem?.id === item.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 bg-primary/10 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          </motion.div>
                        )}
                      </div>

                      {/* Item Info */}
                      <p className="text-sm font-semibold line-clamp-2">
                        {item.name || 'Clothing Item'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(item.type)}
                      </p>
                      {item.color && (
                        <div className="flex items-center gap-1 mt-1">
                          <div
                            className="w-3 h-3 rounded-full border border-muted-foreground/30"
                            style={{ backgroundColor: item.color.toLowerCase() }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.color}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No alternative {getTypeLabel(currentItem?.type || '')}s in your wardrobe
                </p>
                <p className="text-xs mt-1 opacity-75">
                  Add more items to unlock swap suggestions
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={confirming}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSwap}
              disabled={!selectedItem || confirming}
              className="flex-1"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Confirm Swap
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
