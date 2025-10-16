'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getOutfitHistory } from './actions'
import OutfitCard from './OutfitCard'
import { motion } from 'framer-motion'
import type { Outfit } from '@/lib/types'
import { Shirt } from 'lucide-react'

// Custom hook for infinite scrolling
function useInfiniteScroll(fetcher: (page: number) => Promise<{ outfits: Outfit[] | null, error: string | null }>) {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const loaderRef = useRef(null)

  const loadMoreOutfits = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const { outfits: newOutfits, error } = await fetcher(page);
    if (error) {
      console.error(error);
      setHasMore(false);
    } else if (newOutfits && newOutfits.length > 0) {
      setOutfits(prev => [...prev, ...newOutfits]);
      setPage(prev => prev + 1);
      setHasMore(newOutfits.length > 0);
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [fetcher, hasMore, isLoading, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreOutfits();
        }
      },
      { threshold: 1.0 }
    );

    const loader = loaderRef.current;
    if (loader) {
      observer.observe(loader);
    }

    return () => {
      if (loader) {
        observer.unobserve(loader);
      }
    };
  }, [loadMoreOutfits]);

  return { outfits, loaderRef, hasMore, isLoading, page }; // Return page state
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function OutfitHistoryList({ initialOutfits }: { initialOutfits: Outfit[] }) {
  const { outfits, loaderRef, hasMore, isLoading, page } = useInfiniteScroll(async (currentPage) => { // Get page from hook
    if (currentPage === 1) return { outfits: initialOutfits, error: null };
    return getOutfitHistory(currentPage);
  });

  const allOutfits = page === 1 ? initialOutfits : outfits;

  if (allOutfits.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-2/50 flex items-center justify-center mb-6">
          <Shirt className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-serif mb-2">No outfit history yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start creating and rating outfits to build your style history.
        </p>
      </div>
    )
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {allOutfits.map(outfit => (
        <OutfitCard key={outfit.id} outfit={outfit} />
      ))}

      <div ref={loaderRef} className="flex justify-center items-center p-8">
        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span>Loading more outfits...</span>
          </div>
        )}
        {!hasMore && allOutfits.length > 0 && (
          <p className="text-muted-foreground">You&apos;ve reached the end of your history.</p>
        )}
      </div>
    </motion.div>
  )
}
