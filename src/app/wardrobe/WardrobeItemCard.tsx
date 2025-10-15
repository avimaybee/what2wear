'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { ClothingItem } from '@/lib/types';
import { Edit, Trash2 } from 'lucide-react';
import Button from '../components/Button';

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
      className="relative"
      onHoverStart={() => setIsMenuOpen(true)}
      onHoverEnd={() => setIsMenuOpen(false)}
    >
      {/* Swipe background (delete) */}
      <div className="absolute inset-0 z-0 flex items-center justify-end rounded-lg bg-destructive">
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
          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <Image 
              src={item.image_url} 
              alt={item.category || 'Clothing item'} 
              width={200} 
              height={200} 
              className="h-full w-full object-cover"
            />
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
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm"
          >
            <Link href={`/wardrobe/${item.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id, item.image_url)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}