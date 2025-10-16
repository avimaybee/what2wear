'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useState } from 'react';
import type { ClothingItem } from '@/lib/types';
import { Button } from '@/components/ui/button'
import { useToast } from '../components/ToastProvider'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Sparkles } from 'lucide-react'
import Input from '../components/Input'

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
    <div className="sticky top-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            New Outfit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop zone */}
          <div className="min-h-[300px] rounded-xl border-2 border-dashed border-border bg-surface-2/30 p-4 transition-all hover:border-primary/50 hover:bg-surface-2/50">
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {items.length > 0 ? (
                  items.map(item => (
                    <SortableItem key={item.id} item={item} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Drag items here to build your outfit
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </div>

          {/* Outfit name and save */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <Input 
              type="text"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              placeholder="e.g., Casual Friday, Weekend Look"
              label="Outfit Name"
            />
            <Button 
              onClick={handleSave} 
              disabled={isSaving || items.length === 0} 
              className="w-full h-12"
              variant={items.length > 0 ? "success" : "outline"}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Outfit'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
