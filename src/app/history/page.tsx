"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { HistoryPage as HistoryPageComponent } from "@/components/history/HistoryPage";
import { Outfit, ClothingType } from "@/types/retro";
import { toast } from "@/components/ui/toaster";

export default function HistoryPage() {
  const [history, setHistory] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/outfits/history?limit=50");
      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();
      if (data.success && data.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedHistory: Outfit[] = data.data.map((h: any) => ({
          id: h.id.toString(),
          outfit_date: h.outfit_date,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: h.items.map((i: any) => ({
            id: i.id.toString(),
            name: i.name,
            category: mapDbTypeToUiCategory(i.type),
            type: i.type,
            image_url: i.image_url || "https://picsum.photos/200/300?grayscale",
            color: i.color,
            season_tags: i.season_tags || [],
            style_tags: i.style_tags || [],
            material: i.material || "Unknown",
            insulation_value: i.insulation_value || 0,
            dress_code: i.dress_code || [],
            wear_count: i.wear_count || 0,
            last_worn: i.last_worn || null,
            is_favorite: i.is_favorite || false,
            created_at: i.created_at || new Date().toISOString()
          })),
          status: 'completed',
          rating: h.feedback,
          weather_snapshot: h.weather_data
        }));
        setHistory(mappedHistory);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      toast.error("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
      try {
          const response = await fetch(`/api/outfits/${id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("Failed to delete outfit");
          
          setHistory(prev => prev.filter(h => h.id !== id));
          toast.success("Outfit log deleted.");
      } catch (err) {
          console.error("Error deleting outfit:", err);
          toast.error("Failed to delete outfit log.");
      }
  };

  const mapDbTypeToUiCategory = (dbType: string): ClothingType => {
      switch (dbType) {
          case 'Footwear': return 'Shoes';
          case 'Headwear': return 'Accessory';
          case 'Outerwear': return 'Outerwear';
          case 'Top': return 'Top';
          case 'Bottom': return 'Bottom';
          case 'Dress': return 'Dress';
          default: return 'Top';
      }
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center h-full bg-[var(--bg-primary)]">
              <div className="font-mono text-xl animate-pulse text-[var(--text)]">LOADING HISTORY...</div>
          </div>
      );
  }

  return (
      <div className="h-full p-4 md:p-8 bg-[var(--bg-primary)] min-h-screen">
        <div className="max-w-5xl mx-auto h-full">
            <HistoryPageComponent history={history} onDelete={handleDelete} />
        </div>
      </div>
  );
}
