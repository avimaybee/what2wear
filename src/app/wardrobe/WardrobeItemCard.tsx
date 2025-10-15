'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, PanInfo, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { ClothingItem } from '@/lib/types'

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 420, damping: 40 } },
}

export default function WardrobeItemCard({ item, onDelete }: { item: ClothingItem, onDelete: (id: number, imageUrl: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete(item.id, item.image_url);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="relative"
      onHoverStart={() => setIsMenuOpen(true)}
      onHoverEnd={() => setIsMenuOpen(false)}
    >
      {/* Swipe background (delete) */}
      <div className="absolute inset-0 z-0 flex items-center justify-end rounded-xl bg-[var(--color-error)]">
        <div className="p-4 text-[var(--color-background)]">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        whileTap={{ scale: 0.985 }}
        onDragEnd={handleDragEnd}
        className="relative z-10 will-change-transform"
      >
        <Link href={`/wardrobe/${item.id}`}>
          <div className="aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-subtle">
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
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--color-background)]/50"
          >
            <Link href={`/wardrobe/${item.id}/edit`} className="rounded-l-md bg-[var(--color-surface-3)] px-4 py-2 text-sm text-[var(--color-text)] hover:brightness-110">Edit</Link>
            <button onClick={() => onDelete(item.id, item.image_url)} className="rounded-r-md bg-[var(--color-error)] px-4 py-2 text-sm text-[var(--color-background)] hover:brightness-110">Delete</button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
