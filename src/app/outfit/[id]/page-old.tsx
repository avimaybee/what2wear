"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { RetroWindow, RetroButton, RetroProgressBar, SwapModal } from "@/components/papercraft";
import { PapercraftCard } from "@/components/papercraft";
import { StickerBadge } from "@/components/papercraft";
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
  const outfitId = params?.id as string;

  const [outfit, setOutfit] = useState<OutfitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
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

  // Fetch user's wardrobe items for swapping
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
    setProgress(10);

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

      setProgress(50);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate visual.");
      }

      const data = await res.json();
      setProgress(80);

      // For MVP, we dont yet call an actual image model; we use metadata only.
      // visual_image_url can be filled later when you connect an image generator.

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
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setProgress(0);
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleSwapItem = async (newItem: ClothingItem) => {
    if (!outfit || !itemToSwap) return;

    // Update the outfit items locally
    const updatedItems = outfit.items.map((item) =>
      item.id === itemToSwap.id ? newItem : item
    );

    // Update in database
    try {
      // Remove old item from outfit
      await supabase
        .from("outfit_items")
        .delete()
        .eq("outfit_id", outfit.id)
        .eq("clothing_item_id", itemToSwap.id);

      // Add new item to outfit
      await supabase
        .from("outfit_items")
        .insert({
          outfit_id: outfit.id,
          clothing_item_id: newItem.id,
        });

      // Update local state
      setOutfit((prev) =>
        prev
          ? {
              ...prev,
              items: updatedItems,
            }
          : prev
      );

      // Regenerate visual with new items
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
      <main className="min-h-screen bg-[var(--bg)] px-4 py-6 flex items-center justify-center">
        <RetroWindow title="Loading outfit...">
          <div className="space-y-4">
            <RetroProgressBar progress={65} label="Collecting your stickers" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Piecing your outfit card together...
            </p>
          </div>
        </RetroWindow>
      </main>
    );
  }

  if (!outfit || error) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 py-6 flex items-center justify-center">
        <RetroWindow title="Outfit not found">
          <p className="text-sm text-[var(--muted-foreground)]">
            {error || "We couldnt find that outfit. Try another one?"}
          </p>
        </RetroWindow>
      </main>
    );
  }

  const { visual_image_url, visual_metadata } = outfit;
  const hasVisual = Boolean(visual_image_url);
  const altText =
    visual_metadata?.alt_text ||
    "Outfit preview showing selected clothing items on a neutral silhouette.";

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <RetroWindow
          title="Outfit Preview"
          onClose={undefined}
        >
          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-start">
            {/* Visual preview card */}
            <PapercraftCard
              variant="elevated"
              pattern="checker"
              paperTexture
              animate
              hoverEffect="lift"
              className="relative flex flex-col items-center justify-center aspect-[4/5] bg-[var(--card)]"
            >
              {hasVisual ? (
                <div className="relative w-full h-full">
                  <Image
                    src={visual_image_url as string}
                    alt={altText}
                    fill
                    className="object-cover rounded-[18px] border-[3px] border-[var(--border-strong)] shadow-[0_10px_0_rgba(0,0,0,0.15)] bg-[var(--paper)]"
                  />
                  <div className="absolute top-3 left-3">
                    <StickerBadge text="AI preview" type="ai-generated" icon="✨" />
                  </div>
                  {visual_metadata?.provenance && (
                    <div className="absolute bottom-3 right-3">
                      <StickerBadge 
                        text={`seed ${visual_metadata.provenance.seed_hint || '5de'}`}
                        type="info" 
                        icon="📎"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                  <div className="aspect-square w-32 rounded-[26px] border-[3px] border-dashed border-[var(--border-strong)] bg-[radial-gradient(circle_at_20%_20%,var(--accent-yellow)_0,transparent_40%),radial-gradient(circle_at_80%_60%,var(--accent-blue)_0,transparent_45%),var(--paper)] shadow-[0_10px_0_rgba(0,0,0,0.12)]" />
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    No visual yet
                  </p>
                  <p className="max-w-xs text-xs text-[var(--muted-foreground)]">
                    Generate a papercraft-style preview showing your outfit on a
                    simple silhouette. Colors will match your real items.
                  </p>
                </div>
              )}
            </PapercraftCard>

            {/* Details + actions */}
            <div className="space-y-4">
              <section className="space-y-3">
                <h2 className="font-heading text-xl tracking-tight">
                  What youre wearing
                </h2>
                <div className="flex flex-wrap gap-2">
                  {outfit.items.map((item) => (
                    <PapercraftCard
                      key={item.id}
                      variant="flat"
                      paperTexture
                      hoverEffect="lift"
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      {item.image_url && (
                        <div className="relative h-10 w-10 overflow-hidden rounded-[14px] border-[2px] border-[var(--border-strong)] bg-[var(--paper)]">
                          <Image
                            src={item.image_url}
                            alt={item.name || item.category}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold uppercase tracking-wide">
                          {item.category}
                        </p>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">
                          {item.color || "colorful"}
                        </p>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        🔄
                      </div>
                    </PapercraftCard>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] italic">
                  💡 Tip: Click any item to swap it for something else
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-heading text-xl tracking-tight">Why this works</h2>
                <PapercraftCard variant="flat" paperTexture className="p-3">
                  <p className="text-sm text-[var(--foreground)]">
                    {outfit.reasoning ||
                      "Light layers, matching tones, and one fun accent piece to keep things interesting."}
                  </p>
                </PapercraftCard>
              </section>

              <section className="space-y-3">
                <h2 className="font-heading text-xl tracking-tight">Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <RetroButton
                    variant="primary"
                    size="lg"
                    disabled={generating}
                    onClick={handleGenerateVisual}
                  >
                    {generating ? "Cooking your preview..." : "Regenerate preview"}
                  </RetroButton>
                  <RetroButton variant="secondary" size="lg" disabled>
                    Save & log (soon)
                  </RetroButton>
                </div>
                {generating && (
                  <div className="pt-1">
                    <RetroProgressBar
                      progress={progress}
                      label="Drawing your outfit card"
                    />
                  </div>
                )}
              </section>
            </div>
          </div>
        </RetroWindow>

        {/* Swap Modal */}
        {itemToSwap && (
          <SwapModal
            isOpen={swapModalOpen}
            onClose={() => {
              setSwapModalOpen(false);
              setItemToSwap(null);
            }}
            currentItem={itemToSwap}
            availableItems={wardrobeItems.filter(
              (item) => item.category === itemToSwap.category
            )}
            onSwap={handleSwapItem}
          />
        )}
      </div>
    </main>
  );
}
