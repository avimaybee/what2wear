'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

type Outfit = {
  id: number;
  created_at: string;
  feedback: number | null;
  outfit_items: {
    clothing_items: {
      id: number;
      image_url: string;
      category: string | null;
    } | null;
  }[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const getFeedbackIcon = (feedback: number | null) => {
  if (feedback === 1) return '👍';
  if (feedback === -1) return '👎';
  return null;
}

export default function OutfitCard({ outfit }: { outfit: Outfit }) {
  const feedbackIcon = getFeedbackIcon(outfit.feedback);

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="bg-surface/70 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="font-semibold text-text">
          {new Date(outfit.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
        {feedbackIcon && (
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
            className="text-2xl"
          >
            {feedbackIcon}
          </motion.span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4">
        {outfit.outfit_items.map(({ clothing_items: item }) => (
          item && (
            <div key={item.id} className="rounded-lg overflow-hidden aspect-square bg-background/50">
              <Image 
                src={item.image_url} 
                alt={item.category || 'Clothing item'} 
                width={150} 
                height={150} 
                className="w-full h-full object-cover"
              />
            </div>
          )
        ))}
      </div>
    </motion.div>
  )
}
