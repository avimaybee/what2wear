'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Trash2, Heart, Calendar, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ClothingItem, ClothingCategory } from '@/types/papercraft';
import { cn } from '@/lib/utils';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Items', icon: '👔' },
  { value: 'shirt', label: 'Shirts', icon: '👔' },
  { value: 't-shirt', label: 'T-Shirts', icon: '👕' },
  { value: 'jacket', label: 'Jackets', icon: '🧥' },
  { value: 'pants', label: 'Pants', icon: '👖' },
  { value: 'shoes', label: 'Shoes', icon: '👟' },
  { value: 'accessory', label: 'Accessories', icon: '🎒' },
];

export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadWardrobeItems();
  }, []);

  async function loadWardrobeItems() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err) {
      console.error('Error loading wardrobe:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleDelete(id: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  }

  async function handleBulkDelete() {
    if (selectedItems.size === 0) return;
    
    const confirmed = confirm(`Delete ${selectedItems.size} item(s)?`);
    if (!confirmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const itemIds = Array.from(selectedItems);
      const { error: deleteError } = await supabase
        .from('clothing_items')
        .delete()
        .in('id', itemIds)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      
      setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      setIsMultiSelect(false);
    } catch (err) {
      console.error('Error bulk deleting:', err);
      alert('Failed to delete items');
    }
  }

  function toggleItemSelection(id: number) {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-2xl w-64 animate-pulse mb-4" />
            <div className="h-5 bg-gray-200 rounded-xl w-48 animate-pulse" />
          </div>
          
          {/* Grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadWardrobeItems}
            className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-2xl font-medium hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Wardrobe</h1>
            <p className="text-gray-600">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          
          <div className="flex gap-3">
            {isMultiSelect ? (
              <>
                <motion.button
                  onClick={handleBulkDelete}
                  className={cn(
                    "px-5 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all",
                    selectedItems.size > 0
                      ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                  whileTap={selectedItems.size > 0 ? { scale: 0.95 } : {}}
                  disabled={selectedItems.size === 0}
                >
                  <Trash2 size={18} />
                  <span>Delete ({selectedItems.size})</span>
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    setIsMultiSelect(false);
                    setSelectedItems(new Set());
                  }}
                  className="px-5 py-3 bg-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-300 transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={() => setIsMultiSelect(true)}
                  className="px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-medium hover:border-gray-300 hover:shadow-md transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  Select
                </motion.button>
                
                <motion.button
                  onClick={() => router.push('/wardrobe/upload')}
                  className="px-5 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-2xl font-medium flex items-center gap-2 hover:shadow-lg transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={20} />
                  <span>Add Item</span>
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by color, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORY_OPTIONS.map((category) => (
              <motion.button
                key={category.value}
                onClick={() => setSelectedCategory(category.value as any)}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium whitespace-nowrap flex items-center gap-2 transition-all",
                  selectedCategory === category.value
                    ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg"
                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300"
                )}
                whileTap={{ scale: 0.95 }}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">👕</span>
            </div>
            <h3 className="text-2xl font-semibold mb-3">
              {searchQuery || selectedCategory !== 'all' 
                ? 'No items found' 
                : 'Your wardrobe is empty'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Add your first clothing item to start getting outfit recommendations!'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <motion.button
                onClick={() => router.push('/wardrobe/upload')}
                className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-2xl font-medium inline-flex items-center gap-2 hover:shadow-lg transition-all"
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
                <span>Add Your First Item</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all cursor-pointer group relative",
                    selectedItems.has(item.id) && "ring-4 ring-orange-400"
                  )}
                  onClick={() => {
                    if (isMultiSelect) {
                      toggleItemSelection(item.id);
                    }
                  }}
                >
                  {/* Selection Checkbox */}
                  {isMultiSelect && (
                    <div className="absolute top-2 right-2 z-10">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedItems.has(item.id)
                            ? "bg-orange-400 border-orange-400"
                            : "bg-white border-gray-300"
                        )}
                      >
                        {selectedItems.has(item.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl mb-3 overflow-hidden relative">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={`${item.category} - ${item.color}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {getCategoryEmoji(item.category)}
                      </div>
                    )}
                    
                    {/* Quick Actions (non-select mode) */}
                    {!isMultiSelect && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 capitalize">
                      {item.category.replace('-', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {item.color || 'No color specified'}
                    </p>
                    
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{item.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'shirt': '👔',
    't-shirt': '👕',
    'jacket': '🧥',
    'pants': '👖',
    'shoes': '👟',
    'accessory': '🎒',
  };
  return emojiMap[category] || '👕';
}
