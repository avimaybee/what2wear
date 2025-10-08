'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useState } from 'react';
import type { ClothingItem } from '@/lib/types';

export default function CreationZone({ items, onSave }: { items: ClothingItem[], onSave: (name: string) => void }) {
  const [outfitName, setOutfitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!outfitName.trim()) {
      alert('Please give your outfit a name.');
      return;
    }
    setIsSaving(true);
    await onSave(outfitName);
    setIsSaving(false);
  };

  return (
    <div className="bg-surface rounded-lg p-4 space-y-6 sticky top-24">
      <h2 className="text-xl font-bold">New Outfit</h2>

      <div className="min-h-[200px] bg-background/50 rounded-lg p-4">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {items.length > 0 ? (
              items.map(item => (
                <SortableItem key={item.id} item={item} />
              ))
            ) : (
              <div className="text-center text-text-light py-10">
                <p>Drag items here to build your outfit.</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      <div className="space-y-4">
        <input 
          type="text"
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          placeholder="e.g., Casual Friday, Weekend Look"
          className="w-full border border-surface bg-background rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
        />
        <button
          onClick={handleSave}
          disabled={isSaving || items.length === 0}
          className="w-full px-4 py-2 bg-primary text-background font-semibold rounded-md disabled:opacity-50 hover:bg-secondary transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Outfit'}
        </button>
      </div>
    </div>
  );
}