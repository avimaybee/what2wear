'use client'

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import type { ClothingItem } from '@/lib/types';

export function SortableItem({ item }: { item: ClothingItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="rounded-lg overflow-hidden aspect-square bg-background/50 cursor-grab active:cursor-grabbing">
      <Image 
        src={item.image_url} 
        alt={item.category || 'Clothing item'} 
        width={150} 
        height={150} 
        className="w-full h-full object-cover"
      />
    </div>
  );
}