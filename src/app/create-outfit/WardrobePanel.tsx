'use client'

import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useMemo } from 'react';
import type { ClothingItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'

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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Your Wardrobe</CardTitle>
      </CardHeader>
      <CardContent>
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="space-y-8">
            {Object.entries(categorizedItems).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-base font-semibold capitalize mb-4 text-muted-foreground uppercase tracking-wide">{category}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {items.map(item => (
                    <SortableItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}
