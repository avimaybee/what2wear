'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  RetroWindow,
  RetroButton,
  RetroProgressBar,
  RetroCheckbox,
  SystemDialog,
  PapercraftCard,
} from '@/components/papercraft';
import type { ClothingCategory, Season, StyleTag } from '@/types/papercraft';
import { cn } from '@/lib/utils';

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  metadata: {
    category: ClothingCategory;
    color: string;
    season_tags: Season[];
    style_tags: StyleTag[];
    tags: string[];
  };
}

const categories: ClothingCategory[] = ['shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory'];
const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const styles: StyleTag[] = ['casual', 'formal', 'streetwear', 'sporty', 'business'];

export default function WardrobeUploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newItem: UploadItem = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: e.target?.result as string,
          metadata: {
            category: 'shirt',
            color: '',
            season_tags: [],
            style_tags: [],
            tags: [],
          },
        };
        setItems(prev => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Remove item
  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  // Update item metadata
  function updateMetadata(id: string, updates: Partial<UploadItem['metadata']>) {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, metadata: { ...item.metadata, ...updates } }
          : item
      )
    );
  }

  // Upload all items
  async function uploadAll() {
    if (items.length === 0) return;
    
    try {
      setUploading(true);
      setProgress(0);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const totalItems = items.length;
      let uploadedCount = 0;

      for (const item of items) {
        // Upload image to Supabase Storage
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('clothing-images')
          .upload(fileName, item.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('clothing-images')
          .getPublicUrl(fileName);

        // Insert into database
        const { error: dbError } = await supabase
          .from('clothing_items')
          .insert({
            user_id: user.id,
            category: item.metadata.category,
            color: item.metadata.color || 'unknown',
            season_tags: item.metadata.season_tags,
            style_tags: item.metadata.style_tags,
            tags: item.metadata.tags,
            image_url: publicUrl,
            wear_count: 0,
            is_favorite: false,
          });

        if (dbError) throw dbError;

        uploadedCount++;
        setProgress((uploadedCount / totalItems) * 100);
      }

      // Success!
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/wardrobe');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload items. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const currentItem = currentEditIndex !== null ? items[currentEditIndex] : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl mb-2">Upload Items</h1>
            <p className="text-secondary-label">
              Add items to your digital wardrobe
            </p>
          </div>
          
          <RetroButton
            variant="secondary"
            onClick={() => router.push('/wardrobe')}
          >
            Cancel
          </RetroButton>
        </div>

        {/* Upload Area */}
        <RetroWindow title="Add Photos">
          <div
            className={cn(
              'border-3 border-dashed border-border rounded-xl p-12 text-center transition-colors',
              'hover:border-primary hover:bg-accent/10 cursor-pointer'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-3">
              <div className="text-6xl">📸</div>
              <div>
                <p className="font-heading text-xl mb-1">
                  Drop photos here or click to browse
                </p>
                <p className="text-sm text-secondary-label">
                  JPG, PNG, WEBP up to 10MB each
                </p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <RetroButton variant="primary" icon={<Upload size={18} />}>
                  Choose Files
                </RetroButton>
                
                <RetroButton variant="secondary" icon={<Camera size={18} />}>
                  Take Photo
                </RetroButton>
              </div>
            </div>
          </div>
        </RetroWindow>

        {/* Items Grid */}
        {items.length > 0 && (
          <RetroWindow title={`${items.length} Item${items.length !== 1 ? 's' : ''}`}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <PapercraftCard
                        variant="default"
                        className="p-0 cursor-pointer overflow-hidden"
                        onClick={() => setCurrentEditIndex(index)}
                      >
                        <img
                          src={item.preview}
                          alt="Preview"
                          className="w-full aspect-square object-cover"
                        />
                        
                        <div className="p-2 space-y-1">
                          <p className="text-xs font-semibold capitalize">
                            {item.metadata.category}
                          </p>
                          {item.metadata.color && (
                            <p className="text-xs text-secondary-label">
                              {item.metadata.color}
                            </p>
                          )}
                        </div>
                      </PapercraftCard>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {uploading ? (
                <RetroProgressBar
                  progress={progress}
                  label="Uploading items..."
                  segments={items.length}
                />
              ) : (
                <RetroButton
                  variant="success"
                  size="lg"
                  className="w-full"
                  onClick={uploadAll}
                  disabled={items.some(i => !i.metadata.color)}
                >
                  Upload {items.length} Item{items.length !== 1 ? 's' : ''}
                </RetroButton>
              )}
            </div>
          </RetroWindow>
        )}

        {/* Edit Modal */}
        {currentItem && (
          <SystemDialog
            open={true}
            onClose={() => setCurrentEditIndex(null)}
            title="Edit Item Details"
            type="info"
            icon="✏️"
          >
            <div className="space-y-4 mt-4">
              <div>
                <img
                  src={currentItem.preview}
                  alt="Preview"
                  className="w-full aspect-square object-cover rounded-lg border-2 border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={currentItem.metadata.category}
                  onChange={(e) =>
                    updateMetadata(currentItem.id, {
                      category: e.target.value as ClothingCategory,
                    })
                  }
                  className="w-full p-2 border-3 border-border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="text"
                  value={currentItem.metadata.color}
                  onChange={(e) =>
                    updateMetadata(currentItem.id, { color: e.target.value })
                  }
                  placeholder="e.g., blue, red, black"
                  className="w-full p-2 border-3 border-border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Seasons</label>
                <div className="grid grid-cols-2 gap-2">
                  {seasons.map(season => (
                    <RetroCheckbox
                      key={season}
                      checked={currentItem.metadata.season_tags.includes(season)}
                      onChange={(checked) => {
                        const newSeasons = checked
                          ? [...currentItem.metadata.season_tags, season]
                          : currentItem.metadata.season_tags.filter(s => s !== season);
                        updateMetadata(currentItem.id, { season_tags: newSeasons });
                      }}
                      label={season.charAt(0).toUpperCase() + season.slice(1)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {styles.map(style => (
                    <RetroCheckbox
                      key={style}
                      checked={currentItem.metadata.style_tags.includes(style)}
                      onChange={(checked) => {
                        const newStyles = checked
                          ? [...currentItem.metadata.style_tags, style]
                          : currentItem.metadata.style_tags.filter(s => s !== style);
                        updateMetadata(currentItem.id, { style_tags: newStyles });
                      }}
                      label={style.charAt(0).toUpperCase() + style.slice(1)}
                    />
                  ))}
                </div>
              </div>

              <RetroButton
                variant="primary"
                onClick={() => setCurrentEditIndex(null)}
                className="w-full"
              >
                Done
              </RetroButton>
            </div>
          </SystemDialog>
        )}

        {/* Success Dialog */}
        <SystemDialog
          open={showSuccess}
          title="Success!"
          message={`${items.length} item${items.length !== 1 ? 's' : ''} uploaded successfully!`}
          type="success"
          icon="🎉"
        />
      </div>
    </div>
  );
}
