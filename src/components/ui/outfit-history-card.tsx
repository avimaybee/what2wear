/**
 * Outfit History Card Component
 * 
 * Displays a single outfit from history with date, items, and feedback
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Star, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutfitItem {
  id: number;
  name: string;
  type: string;
  image_url: string;
  color: string;
  category: string;
}

interface OutfitHistoryCardProps {
  id: number;
  date: string;
  items: OutfitItem[];
  feedback?: number | null;
  renderedImage?: string | null;
  onReuse?: () => void;
  onDelete?: () => void;
  index?: number;
}

export function OutfitHistoryCard({
  id: _id,
  date,
  items,
  feedback,
  renderedImage: _renderedImage,
  onReuse,
  onDelete,
  index = 0
}: OutfitHistoryCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const daysSinceWorn = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const getDateBadge = () => {
    if (daysSinceWorn === 0) return { text: 'Today', variant: 'default' as const };
    if (daysSinceWorn === 1) return { text: 'Yesterday', variant: 'secondary' as const };
    if (daysSinceWorn < 7) return { text: `${daysSinceWorn} days ago`, variant: 'secondary' as const };
    if (daysSinceWorn < 30) return { text: `${Math.floor(daysSinceWorn / 7)} weeks ago`, variant: 'outline' as const };
    return { text: `${Math.floor(daysSinceWorn / 30)} months ago`, variant: 'outline' as const };
  };
  
  const dateBadge = getDateBadge();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">{formattedDate}</p>
                <Badge variant={dateBadge.variant} className="mt-1 text-xs">
                  {dateBadge.text}
                </Badge>
              </div>
            </div>
            
            {/* Feedback Stars */}
            {feedback !== null && feedback !== undefined && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < feedback
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Outfit Items Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {items.slice(0, 4).map((item, _idx) => (
              <motion.div
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group-hover:scale-105 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 25vw, 100px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-1">
                    <p className="text-white text-[10px] font-medium truncate">
                      {item.name}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Item Count Badge */}
          {items.length > 4 && (
            <Badge variant="secondary" className="mb-3 text-xs">
              +{items.length - 4} more items
            </Badge>
          )}
          
          {/* Item Categories */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from(new Set(items.map(i => i.category)))
              .filter(Boolean)
              .slice(0, 4)
              .map(category => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={onReuse}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Wear Again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
