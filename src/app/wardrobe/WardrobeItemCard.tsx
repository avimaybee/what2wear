'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, PanInfo, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { ClothingItem } from '@/lib/types'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="relative z-10"
      >
        <Link href={`/wardrobe/${item.id}`}>
          <div className="aspect-square bg-surface/70 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden">
            <Image 
              src={item.image_url} 
              alt={item.category || 'Clothing item'} 
              width={200} 
              height={200} 
              className="w-full h-full object-cover"
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
            className="absolute top-0 right-0 bottom-0 left-0 flex justify-center items-center bg-background/50 rounded-xl"
          >
            <Link href={`/wardrobe/${item.id}/edit`} className="px-4 py-2 text-sm text-text bg-surface rounded-l-md hover:bg-primary hover:text-background">Edit</Link>
            <button onClick={() => onDelete(item.id, item.image_url)} className="px-4 py-2 text-sm text-white bg-error rounded-r-md hover:bg-opacity-90">Delete</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile swipe actions */}
      <div className="absolute top-0 right-0 bottom-0 left-0 flex justify-end items-center bg-error rounded-xl">
        <div className="p-4 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
      </div>
    </motion.div>
  )
}
