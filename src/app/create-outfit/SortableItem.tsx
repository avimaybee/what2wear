'use client'

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import type { ClothingItem } from '@/lib/types';
import { GripVertical } from 'lucide-react';

export function SortableItem({ item }: { item: ClothingItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`group relative rounded-xl overflow-hidden aspect-square bg-surface-1 cursor-grab active:cursor-grabbing border border-border/50 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:scale-105 ${
        isDragging ? 'opacity-50 scale-95 shadow-2xl ring-4 ring-primary/30' : ''
      }`}
    >
      <div className="relative w-full h-full">
        <Image 
          src={item.image_url} 
          alt={item.category || 'Clothing item'} 
          fill
          sizes="150px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded-lg bg-surface-1/90 backdrop-blur-sm flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
