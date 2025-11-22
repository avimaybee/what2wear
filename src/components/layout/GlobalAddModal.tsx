"use client";

import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadClothingImage } from '@/lib/supabase/storage';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { ClothingItem, ClothingType } from '@/types/retro';
import { toast } from '@/components/ui/toaster';
import { useAddItem } from '@/contexts/AddItemContext';

export const GlobalAddModal: React.FC = () => {
    const { isGlobalAddOpen, closeGlobalAdd } = useAddItem();

    const mapUiCategoryToDbType = (uiCategory: ClothingType): string => {
        switch (uiCategory) {
            case 'Shoes': return 'Footwear';
            default: return uiCategory;
        }
    };

    const handleAddItem = async (item: Partial<ClothingItem>, file?: File) => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("You must be logged in.");
                return;
            }

            let imageUrl = item.image_url;

            if (file) {
                const uploadResult = await uploadClothingImage(file, session.user.id);
                if (!uploadResult.success || !uploadResult.url) {
                    throw new Error(uploadResult.error || "Failed to upload image");
                }
                imageUrl = uploadResult.url;
            }

            const payload = {
                name: item.name,
                type: mapUiCategoryToDbType(item.category as ClothingType),
                category: "General",
                material: item.material,
                color: "Unknown",
                season_tags: item.season_tags,
                dress_code: item.dress_code,
                image_url: imageUrl,
                insulation_value: item.insulation_value,
                is_favorite: item.is_favorite,
                style_tags: item.style_tags,
            };

            const response = await fetch("/api/wardrobe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to create item");

            toast.success("Item added to wardrobe.");
            closeGlobalAdd();

            // Reload the page to refresh wardrobe if on wardrobe page
            if (typeof window !== 'undefined' && window.location.pathname === '/wardrobe') {
                window.location.reload();
            }

        } catch (err) {
            console.error("Error adding item:", err);
            toast.error("Failed to add item.");
        }
    };

    const handleAnalyzeImage = async (base64: string): Promise<Partial<ClothingItem> | null> => {
        try {
            const response = await fetch("/api/wardrobe/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64 })
            });

            if (!response.ok) throw new Error("Analysis failed");

            const result = await response.json();
            if (result.success && result.data) {
                return result.data as Partial<ClothingItem>;
            }
            return null;
        } catch (error) {
            console.error("Error analyzing image:", error);
            toast.error("Failed to analyze image.");
            return null;
        }
    };

    // Render WardrobeGrid with just the modal, no grid
    return (
        <WardrobeGrid
            items={[]} // Empty items array since we're only using the modal
            onAddItem={handleAddItem}
            onUpdateItem={() => { }} // Not used in global add
            onDelete={() => { }} // Not used in global add
            isAdding={isGlobalAddOpen}
            onOpenAdd={() => { }} // Not used (controlled by context)
            onCloseAdd={closeGlobalAdd}
            onToggleFavorite={() => { }} // Not used in global add
            onAnalyzeImage={handleAnalyzeImage}
        />
    );
};
