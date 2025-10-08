'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import OutfitItemCard from './OutfitItemCard'

type ClothingItem = {
  id: number;
  image_url: string;
  category: string | null;
};

type Outfit = ClothingItem[];

export default function OutfitCardStack({ outfits, onVote }: { outfits: Outfit[], onVote: (outfit: Outfit, vote: 'like' | 'dislike') => void }) {
  const [stack, setStack] = useState(outfits);

  const handleVote = (outfit: Outfit, vote: 'like' | 'dislike') => {
    onVote(outfit, vote);
    setStack(prev => prev.slice(0, -1));
  };

  return (
    <div className="relative w-full h-96 max-w-sm mx-auto">
      <AnimatePresence>
        {stack.map((outfit, index) => (
          <motion.div
            key={index}
            className="absolute w-full h-full"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1 - (stack.length - 1 - index) * 0.05, y: 0, opacity: 1 }}
            exit={{ x: index === stack.length - 1 ? (Math.random() > 0.5 ? 300 : -300) : 0, opacity: 0, transition: { duration: 0.3 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(event, info) => {
              if (info.offset.x > 100) {
                handleVote(outfit, 'like');
              } else if (info.offset.x < -100) {
                handleVote(outfit, 'dislike');
              }
            }}
          >
            {outfit.map(item => (
              <OutfitItemCard key={item.id} item={item} />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
