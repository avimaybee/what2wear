'use client'

import { useState, useTransition } from 'react'
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { saveManualOutfit } from './actions'
import WardrobePanel from './WardrobePanel'
import CreationZone from './CreationZone'
import { SortableItem } from './SortableItem'
import type { ClothingItem } from '@/lib/types'

export default function OutfitCreator({ items }: { items: ClothingItem[] }) {
  const [wardrobeItems, setWardrobeItems] = useState(items);
  const [creationItems, setCreationItems] = useState<ClothingItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [_isPending, startTransition] = useTransition(); // Renamed to _isPending

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string) => {
    if (creationItems.find(item => item.id.toString() === id)) {
      return 'creation';
    }
    return 'wardrobe';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id.toString());
    const overContainer = over.data.current?.sortable?.containerId || findContainer(over.id.toString());

    if (activeContainer !== overContainer) {
      if (activeContainer === 'wardrobe') {
        const activeItem = wardrobeItems.find(i => i.id.toString() === active.id.toString());
        if (activeItem) {
          setCreationItems(prev => [...prev, activeItem]);
          setWardrobeItems(prev => prev.filter(item => item.id.toString() !== active.id.toString()));
        }
      } else {
        const activeItem = creationItems.find(i => i.id.toString() === active.id.toString());
        if (activeItem) {
          setWardrobeItems(prev => [...prev, activeItem]);
          setCreationItems(prev => prev.filter(item => item.id.toString() !== active.id.toString()));
        }
      }
    }
  };

  const handleDragEnd = (_event: DragEndEvent) => { // Renamed to _event
    setActiveId(null);
  };

  const handleSave = async (name: string) => {
    startTransition(async () => {
      const itemIds = creationItems.map(item => item.id.toString());
      const result = await saveManualOutfit(name, itemIds);
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert('Outfit saved successfully!');
        setCreationItems([]);
      }
    });
  };

  const activeItem = activeId ? items.find(item => item.id.toString() === activeId) : null;

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <WardrobePanel items={wardrobeItems} />
        </div>
        <div>
          <CreationZone items={creationItems} onSave={handleSave} />
        </div>
      </div>
      <DragOverlay>
        {activeItem ? <SortableItem item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
