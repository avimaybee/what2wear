'use client';

import { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WardrobeItemCard from './WardrobeItemCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { deleteClothingItem } from './actions';
import type { ClothingItem } from '@/lib/types';
import { useToast } from '../components/ToastProvider';
import Chip from '../components/Chip';
import { Shirt } from 'lucide-react';

const categories = ['all', 'shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory'];
const sortOptions = ['newest', 'oldest'];

export default function WardrobeGrid({ items }: { items: ClothingItem[] }) {
  const [allItems, setAllItems] = useState(items);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const filteredAndSortedItems = useMemo(() => {
    let result = [...allItems]; // Create a copy here

    if (filter !== 'all') {
      result = result.filter(item => item.category === filter);
    }

    if (sort === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return result;
  }, [allItems, filter, sort]);

  const handleDelete = (id: number, _imageUrl: string) => {
    const item = allItems.find(i => i.id === id);
    if (item) {
      setItemToDelete(item);
    }
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    const itemToUndo = itemToDelete;
    setAllItems(prev => prev.filter(item => item.id !== itemToDelete.id));
    setItemToDelete(null);

    startTransition(async () => {
      const result = await deleteClothingItem(itemToUndo.id, itemToUndo.image_url);
      if (result.error) {
        setAllItems(items);
        showToast({ variant: 'error', title: 'Delete failed', description: result.error });
      } else {
        showToast({ variant: 'success', title: 'Deleted', description: 'Item removed from wardrobe.' });
      }
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filter and Sort Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-surface-1/50 border border-border/50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Chip key={c} selected={filter === c} onClick={() => setFilter(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sort-by" className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by:</label>
            <select 
              id="sort-by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-border bg-input px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring/30 transition-all"
            >
              {sortOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>

        {/* Items Grid */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-2/50 flex items-center justify-center mb-6">
              <Shirt className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif mb-2">No items yet</h3>
            <p className="text-muted-foreground max-w-sm">
              {filter === 'all' 
                ? "Start building your digital wardrobe by uploading your first clothing item."
                : `No ${filter} items found. Try a different filter or upload new items.`
              }
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {filteredAndSortedItems.map(item => (
                <WardrobeItemCard key={item.id} item={item} onDelete={() => handleDelete(item.id, item.image_url)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
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

export function WardrobeGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-1/50 border border-border/50">
        <div className="h-10 w-64 rounded-lg bg-surface-2 animate-pulse" />
        <div className="h-10 w-40 rounded-lg bg-surface-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-surface-2 animate-pulse" />
        ))}
      </div>
    </div>
  )
}