'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useState } from 'react';
import type { ClothingItem } from '@/lib/types';
import Button from '../components/Button'
import { useToast } from '../components/ToastProvider'

export default function CreationZone({ items, onSave }: { items: ClothingItem[], onSave: (name: string) => void }) {
  const [outfitName, setOutfitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast()

  const handleSave = async () => {
    if (!outfitName.trim()) {
      showToast({ variant: 'info', title: 'Name required', description: 'Please give your outfit a name.' })
      return;
    }
    setIsSaving(true);
    await onSave(outfitName);
    setIsSaving(false);
  };

  return (
  <div className="sticky top-24 space-y-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-xl font-bold">New Outfit</h2>

  <div className="min-h-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
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
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
        />
        <Button onClick={handleSave} disabled={isSaving || items.length === 0} className="w-full">
          {isSaving ? 'Saving…' : 'Save outfit'}
        </Button>
      </div>
    </div>
  );
}