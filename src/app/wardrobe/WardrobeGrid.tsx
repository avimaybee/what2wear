'use client'

import { useState, useMemo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WardrobeItemCard from './WardrobeItemCard'
import ConfirmationModal from '../components/ConfirmationModal'
import { deleteClothingItem } from './actions'
import type { ClothingItem } from '@/lib/types'

const categories = ['all', 'shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory'];
const sortOptions = ['newest', 'oldest'];

export default function WardrobeGrid({ items }: { items: ClothingItem[] }) {
  const [allItems, setAllItems] = useState(items);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAndSortedItems = useMemo(() => {
    let result = allItems;

    if (filter !== 'all') {
      result = result.filter(item => item.category === filter);
    }

    if (sort === 'newest') {
      result = result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'oldest') {
      result = result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return result;
  }, [allItems, filter, sort]);

  const handleDelete = (id: number, _imageUrl: string) => { // Renamed to _imageUrl
    const item = allItems.find(i => i.id === id);
    if (item) {
      setItemToDelete(item);
    }
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    setAllItems(prev => prev.filter(item => item.id !== itemToDelete.id));
    setItemToDelete(null);

    startTransition(async () => {
      const result = await deleteClothingItem(itemToDelete.id, itemToDelete.image_url);
      if (result.error) {
        setAllItems(items);
        alert(`Error: ${result.error}`);
      }
    });
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <label htmlFor="category-filter" className="text-text-light">Filter by:</label>
            <select 
              id="category-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-surface border border-white/10 rounded-md py-2 px-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="sort-by" className="text-text-light">Sort by:</label>
            <select 
              id="sort-by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-surface border border-white/10 rounded-md py-2 px-3 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sortOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>

        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <AnimatePresence>
            {filteredAndSortedItems.map(item => (
              <WardrobeItemCard key={item.id} item={item} onDelete={() => handleDelete(item.id, item.image_url)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <ConfirmationModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Clothing Item"
        message="Are you sure you want to permanently delete this item? This action cannot be undone."
        confirmText="Delete"
        isConfirming={isPending}
      />
    </>
  )
}
