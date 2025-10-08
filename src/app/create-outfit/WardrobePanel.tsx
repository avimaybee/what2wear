'use client'

import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useMemo } from 'react';
import type { ClothingItem } from '@/lib/types';

export default function WardrobePanel({ items }: { items: ClothingItem[] }) {
  const categorizedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ClothingItem[]>);
  }, [items]);

  return (
    <div className="bg-surface rounded-lg p-4 space-y-6">
      <h2 className="text-xl font-bold">Your Wardrobe</h2>
      
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="space-y-8">
          {Object.entries(categorizedItems).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold capitalize mb-4">{category}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {items.map(item => (
                  <SortableItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}