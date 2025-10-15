'use client';

import { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WardrobeItemCard from './WardrobeItemCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { deleteClothingItem } from './actions';
import type { ClothingItem } from '@/lib/types';
import toast from 'react-hot-toast';
import Chip from '../components/Chip';

const categories = ['all', 'shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory'];
const sortOptions = ['newest', 'oldest'];

export default function WardrobeGrid({ items }: { items: ClothingItem[] }) {
  const [allItems, setAllItems] = useState(items);
  const [filter, setFilter] = useState('all';
  const [sort, setSort] = useState('newest');
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [isPending, startTransition] = useTransition();

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
        toast.error(result.error);
      } else {
        toast('Item deleted.', {
          action: {
            label: 'Undo',
            onClick: () => setAllItems(prev => [...prev, itemToUndo])
          }
        });
      }
    });
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Chip key={c} selected={filter === c} onClick={() => setFilter(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="sort-by" className="text-sm text-muted-foreground">Sort by:</label>
            <select 
              id="sort-by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-highlight focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {sortOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>

        <motion.div layout className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
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