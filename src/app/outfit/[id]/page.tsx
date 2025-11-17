"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, Heart, Share2, Sparkles, Calendar, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ClothingItem {
  id: string;
  name?: string;
  category: string;
  color?: string;
  season_tags?: string[];
  image_url?: string;
}

interface OutfitDetail {
  id: string;
  created_at: string;
  reasoning?: string;
  visual_image_url?: string | null;
  visual_metadata?: any;
  items: ClothingItem[];
  user_id?: string;
}

export default function OutfitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const outfitId = params?.id as string;

  const [outfit, setOutfit] = useState<OutfitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [itemToSwap, setItemToSwap] = useState<ClothingItem | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);

  useEffect(() => {
    if (!outfitId) return;

    const fetchOutfit = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("outfits")
        .select(
          `id, created_at, reasoning, visual_image_url, visual_metadata, user_id,
           outfit_items ( clothing_items ( id, name, category, color, season_tags, image_url ) )`
        )
        .eq("id", outfitId)
        .single();

      if (error) {
        console.error(error);
        setError("Could not load outfit.");
        setLoading(false);
        return;
      }

      const items: ClothingItem[] =
        (data.outfit_items as unknown as { clothing_items: ClothingItem }[])?.map((oi) => oi.clothing_items) ?? [];

      setOutfit({
        id: data.id,
        created_at: data.created_at,
        reasoning: data.reasoning ?? undefined,
        visual_image_url: data.visual_image_url ?? null,
        visual_metadata: data.visual_metadata ?? undefined,
        items,
        user_id: data.user_id ?? undefined,
      });
      setLoading(false);
    };

    fetchOutfit();
  }, [outfitId]);

  useEffect(() => {
    if (!outfit?.user_id) return;

    const fetchWardrobeItems = async () => {
      const { data, error } = await supabase
        .from("clothing_items")
        .select("id, name, category, color, season_tags, image_url")
        .eq("user_id", outfit.user_id);

      if (!error && data) {
        setWardrobeItems(data as ClothingItem[]);
      }
    };

    fetchWardrobeItems();
  }, [outfit?.user_id]);

  const handleGenerateVisual = async () => {
    if (!outfit) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/outfit/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outfitId: outfit.id,
          items: outfit.items,
          gender: outfit.visual_metadata?.gender ?? "neutral",
          styleNote: outfit.reasoning,
          seed: outfit.visual_metadata?.seed_hint,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate visual.");
      }

      const data = await res.json();

      setOutfit((prev) =>
        prev
          ? {
              ...prev,
              visual_metadata: {
                ...(prev.visual_metadata || {}),
                ...data,
              },
            }
          : prev
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSwapItem = async (newItem: ClothingItem) => {
    if (!outfit || !itemToSwap) return;

    const updatedItems = outfit.items.map((item) =>
      item.id === itemToSwap.id ? newItem : item
    );

    try {
      await supabase
        .from("outfit_items")
        .delete()
        .eq("outfit_id", outfit.id)
        .eq("clothing_item_id", itemToSwap.id);

      await supabase
        .from("outfit_items")
        .insert({
          outfit_id: outfit.id,
          clothing_item_id: newItem.id,
        });

      setOutfit((prev) =>
        prev
          ? {
              ...prev,
              items: updatedItems,
            }
          : prev
      );

      setSwapModalOpen(false);
      setItemToSwap(null);

      await handleGenerateVisual();
    } catch (err) {
      console.error("Failed to swap item:", err);
      throw err;
    }
  };

  const handleItemClick = (item: ClothingItem) => {
    setItemToSwap(item);
    setSwapModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 bg-gray-200 rounded-2xl w-32 animate-pulse mb-8" />
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-[4/5] bg-gray-200 rounded-3xl animate-pulse" />
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded-2xl w-3/4 animate-pulse" />
              <div className="h-32 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-48 bg-gray-200 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!outfit || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Outfit not found</h2>
          <p className="text-gray-600 mb-6">
            {error || "We couldn't find that outfit. Try another one?"}
          </p>
          <button
            onClick={() => router.push('/history')}
            className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-2xl font-medium hover:shadow-lg transition-all"
          >
            View All Outfits
          </button>
        </div>
      </div>
    );
  }

  const { visual_image_url, visual_metadata } = outfit;
  const hasVisual = Boolean(visual_image_url);
  const altText =
    visual_metadata?.alt_text ||
    "Outfit preview showing selected clothing items";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </motion.button>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Visual Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
          >
            <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 to-pink-50">
              {hasVisual ? (
                <>
                  <Image
                    src={visual_image_url as string}
                    alt={altText}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1.5">
                      <Sparkles size={14} className="text-orange-500" />
                      <span>AI Generated</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full flex items-center justify-center">
                    <Sparkles size={48} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">No visual yet</h3>
                  <p className="text-gray-600 max-w-xs">
                    Generate a preview showing your outfit with AI-powered styling
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Header Info */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Calendar size={16} />
                <span>{new Date(outfit.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-4">Your Outfit</h1>
              
              {outfit.reasoning && (
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Why this works</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {outfit.reasoning}
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <h2 className="text-xl font-semibold mb-4">What you're wearing</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {outfit.items.map((item) => (
                  <motion.div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-white mb-3">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name || item.category}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {getCategoryEmoji(item.category)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <RefreshCw className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-sm capitalize mb-1">
                      {item.category.replace('-', ' ')}
                    </h3>
                    <p className="text-xs text-gray-600 capitalize">
                      {item.color || 'No color specified'}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              <p className="text-sm text-gray-500 text-center">
                💡 Click any item to swap it for something else
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] space-y-3">
              <motion.button
                onClick={handleGenerateVisual}
                disabled={generating}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.98 }}
              >
                {generating ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Regenerate Preview</span>
                  </>
                )}
              </motion.button>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  className="px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-medium hover:border-gray-300 hover:shadow-md transition-all flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <Heart size={18} />
                  <span>Save</span>
                </motion.button>
                
                <motion.button
                  className="px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-medium hover:border-gray-300 hover:shadow-md transition-all flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Swap Modal */}
      <AnimatePresence>
        {swapModalOpen && itemToSwap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSwapModalOpen(false);
              setItemToSwap(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Swap Item</h2>
                  <p className="text-gray-600">
                    Choose a replacement for your {itemToSwap.category}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSwapModalOpen(false);
                    setItemToSwap(null);
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Current Item */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Current</h3>
                <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-20 h-20 relative rounded-xl overflow-hidden bg-white">
                    {itemToSwap.image_url ? (
                      <Image
                        src={itemToSwap.image_url}
                        alt={itemToSwap.name || itemToSwap.category}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {getCategoryEmoji(itemToSwap.category)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold capitalize">
                      {itemToSwap.category.replace('-', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {itemToSwap.color || 'No color specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Available Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose from your wardrobe</h3>
                <div className="grid grid-cols-3 gap-3">
                  {wardrobeItems
                    .filter((item) => item.category === itemToSwap.category && item.id !== itemToSwap.id)
                    .map((item) => (
                      <motion.div
                        key={item.id}
                        onClick={() => handleSwapItem(item)}
                        className="bg-gray-50 rounded-2xl p-3 cursor-pointer hover:shadow-lg hover:bg-gradient-to-br hover:from-orange-50 hover:to-pink-50 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="aspect-square relative rounded-xl overflow-hidden bg-white mb-2">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name || item.category}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {getCategoryEmoji(item.category)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium capitalize truncate">
                          {item.color || item.category}
                        </p>
                      </motion.div>
                    ))}
                </div>

                {wardrobeItems.filter((item) => item.category === itemToSwap.category && item.id !== itemToSwap.id).length === 0 && (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center">
                    <p className="text-gray-600">
                      No other {itemToSwap.category}s in your wardrobe
                    </p>
                    <button
                      onClick={() => router.push('/wardrobe/upload')}
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      Add More Items
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
