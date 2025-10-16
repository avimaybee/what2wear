'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { ClothingItem } from '@/lib/types';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 40 } },
};

export default function WardrobeItemCard({ item, onDelete }: { item: ClothingItem, onDelete: (id: number, imageUrl: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete(item.id, item.image_url);
    }
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="relative group"
      onHoverStart={() => setIsMenuOpen(true)}
      onHoverEnd={() => setIsMenuOpen(false)}
    >
      {/* Swipe background (delete) */}
      <div className="absolute inset-0 z-0 flex items-center justify-end rounded-xl bg-gradient-to-l from-destructive to-destructive/80">
        <div className="p-4 text-destructive-foreground">
          <Trash2 className="h-6 w-6" />
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        whileTap={{ scale: 0.98 }}
        onDragEnd={handleDragEnd}
        className="relative z-10 will-change-transform"
      >
        <Link href={`/wardrobe/${item.id}`}>
          <div className="aspect-square overflow-hidden rounded-xl border border-border/50 bg-surface-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-border group-hover:scale-[1.02]">
            <div className="relative w-full h-full">
              <Image 
                src={item.image_url} 
                alt={item.category || 'Clothing item'} 
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Desktop hover actions */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-sm"
          >
            <Link href={`/wardrobe/${item.id}`}>
              <Button variant="secondary" size="sm" className="shadow-lg">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={() => onDelete(item.id, item.image_url)} className="shadow-lg">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Category badge */}
      {item.category && (
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-lg bg-surface-1/90 backdrop-blur-sm border border-border/50 text-xs font-medium capitalize">
          {item.category}
        </div>
      )}
    </motion.div>
  )
}