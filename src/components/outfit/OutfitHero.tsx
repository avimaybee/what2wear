"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, RefreshCw, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatReasoningForUser } from "@/lib/helpers/reasoningFormatter";
import type { IClothingItem } from "@/lib/types";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Cpath fill='%239ca3af' d='M150 100h100v200h-100z'/%3E%3Ccircle fill='%239ca3af' cx='200' cy='100' r='40'/%3E%3Ctext x='200' y='350' font-family='system-ui' font-size='20' fill='%236b7280' text-anchor='middle'%3EOutfit%3C/text%3E%3C/svg%3E";

interface OutfitHeroProps {
  outfitItems?: IClothingItem[];
  detailedReasoning?: string;
  className?: string;
  onItemClick?: (item: IClothingItem) => void;
  onLikeClick?: () => void;
  onDislikeClick?: () => void;
  onLogOutfit?: () => void;
  onRegenerate?: () => void;
  isLiked?: boolean;
  isDisliked?: boolean;
  isLoggingOutfit?: boolean;
  isRegenerating?: boolean;
}

/**
 * OutfitHero Component
 * 
 * Displays the outfit items with thumbnail stack and color chips.
 * Features:
 * - Thumbnail stack of outfit items (horizontally scrollable)
 * - Dominant color chips extracted from outfit
 * - Expandable reasoning section
 * - Smooth animations and hover states
 * - Mobile-optimized layout
 */
export function OutfitHero({
  outfitItems = [],
  detailedReasoning,
  className,
  onItemClick,
  onLikeClick,
  onDislikeClick,
  onLogOutfit,
  onRegenerate,
  isLiked = false,
  isDisliked = false,
  isLoggingOutfit = false,
  isRegenerating = false,
}: OutfitHeroProps) {
  const [showFullReason, setShowFullReason] = useState(false);

  // Extract dominant colors from outfit items (up to 5 unique colors)
  const dominantColors = outfitItems
    .map((item) => item.color)
    .filter((color): color is string => color !== null && color !== undefined)
    .filter((color, index, self) => self.indexOf(color) === index)
    .slice(0, 5);

  // Format reasoning to be more conversational and user-friendly
  const formattedReasoning = useMemo(() => {
    return detailedReasoning ? formatReasoningForUser(detailedReasoning) : '';
  }, [detailedReasoning]);

  // Parse formatted reasoning into paragraphs
  const reasoningParagraphs = formattedReasoning?.split('\n\n') || [];
  const previewText = reasoningParagraphs[0] || formattedReasoning || '';
  const hasMoreContent = reasoningParagraphs.length > 1;

  return (
    <Card className={cn("overflow-hidden glass-effect", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl md:text-2xl">Your Perfect Look</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Curated for today — practical, comfortable, and styled for your plans.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Thumbnail Stack - Outfit Items */}
      {outfitItems.length > 0 && (
        <div className="px-4 sm:px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Outfit Items ({outfitItems.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {outfitItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onItemClick?.(item)}
                  className="flex-shrink-0 relative group"
                  aria-label={`Swap ${item.name || item.type || 'outfit item'}`}
                  type="button"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-border/50 group-hover:border-primary/50 transition-colors bg-muted/30">
                    <Image
                      src={item.image_url || PLACEHOLDER_IMAGE}
                      alt={`${item.name || item.type || 'Outfit item'} - ${item.color || 'clothing item'}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                      unoptimized={item.image_url?.startsWith('data:')}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] px-1.5 py-0.5 font-medium">{item.type}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Color Chips */}
      {dominantColors.length > 0 && (
        <div className="px-4 sm:px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Color Palette
            </p>
            <div className="flex gap-2 flex-wrap">
              {dominantColors.map((color, index) => (
                <motion.div
                  key={`${color}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                  whileHover={{ scale: 1.1 }}
                  className="group relative"
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-border/50 shadow-sm group-hover:shadow-md transition-all cursor-pointer"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  >
                    {color}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed Reasoning Section */}
      {detailedReasoning && (
        <div className="px-4 sm:px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="rounded-xl border border-border/50 bg-gradient-to-br from-background/40 to-muted/20 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Why this outfit?</p>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={showFullReason ? 'full' : 'preview'}
                initial={{ opacity: 0, height: 'auto' }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-muted-foreground leading-relaxed space-y-2"
              >
                {showFullReason ? (
                  reasoningParagraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p>{previewText.length > 220 ? previewText.slice(0, 220).trimEnd() + '…' : previewText}</p>
                )}
              </motion.div>
            </AnimatePresence>

            {hasMoreContent && (
              <div className="pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFullReason(!showFullReason)}
                  className="h-8 text-xs font-medium group"
                  aria-expanded={showFullReason}
                  aria-label={showFullReason ? "Show less reasoning" : "Show more reasoning"}
                >
                  {showFullReason ? (
                    <>
                      Show less <ChevronUp className="ml-1 h-3 w-3 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="ml-1 h-3 w-3 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 sm:px-6 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Primary Actions */}
          <div className="flex gap-2 flex-1">
            <Button
              onClick={onLogOutfit}
              disabled={isLoggingOutfit || isRegenerating}
              className="flex-1 gap-2"
              variant="default"
              aria-label="Log this outfit to history"
            >
              <Shirt className="h-4 w-4" aria-hidden="true" />
              {isLoggingOutfit ? "Logging..." : "Log Outfit"}
            </Button>
            <Button
              onClick={onRegenerate}
              disabled={isRegenerating || isLoggingOutfit}
              className="flex-1 gap-2"
              variant="outline"
              aria-label="Generate a new outfit"
            >
              <RefreshCw className={cn("h-4 w-4", isRegenerating && "animate-spin")} aria-hidden="true" />
              {isRegenerating ? "Generating..." : "Regenerate"}
            </Button>
          </div>

          {/* Feedback Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onLikeClick}
              disabled={isLoggingOutfit || isRegenerating}
              size="icon"
              variant={isLiked ? "default" : "outline"}
              className={cn(
                "transition-colors",
                isLiked && "bg-green-500 hover:bg-green-600 text-white border-green-500"
              )}
              aria-label="I like this outfit"
              aria-pressed={isLiked}
            >
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={onDislikeClick}
              disabled={isLoggingOutfit || isRegenerating}
              size="icon"
              variant={isDisliked ? "default" : "outline"}
              className={cn(
                "transition-colors",
                isDisliked && "bg-red-500 hover:bg-red-600 text-white border-red-500"
              )}
              aria-label="I don't like this outfit"
              aria-pressed={isDisliked}
            >
              <ThumbsDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      </div>
    </Card>
  );
}
