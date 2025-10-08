'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

type ClothingItem = {
  id: number;
  image_url: string;
  category: string | null;
};

export default function OutfitItemCard({ item }: { item: ClothingItem }) {
  return (
    <motion.div 
      className="absolute w-full h-full bg-surface rounded-xl shadow-xl overflow-hidden"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
    >
      <Image 
        src={item.image_url} 
        alt={item.category || 'Clothing item'} 
        layout="fill"
        objectFit="cover"
      />
    </motion.div>
  )
}
