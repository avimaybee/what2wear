"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter as _useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RecommendationApiPayload, RecommendationDiagnostics, IClothingItem } from "@/lib/types";
import { WeatherWidget, WeatherData as WidgetWeatherData } from "../components/weather-widget";
import { OutfitRecommender, Outfit, ClothingItem, ClothingType } from "../components/outfit-recommendation";
import { RetroWindow } from "../components/retro-ui";
import { toast } from "../components/ui/toaster";
import { MissionControl } from "../components/mission-control";
import { SystemMsg } from "../components/system-msg";

type RecommendationApiResponse = {
  success: boolean;
  data?: RecommendationApiPayload;
  diagnostics?: RecommendationDiagnostics;
  needsWardrobe?: boolean;
  message?: string;
  error?: string;
};

const mapClothingItem = (item: IClothingItem): ClothingItem => ({
  id: item.id.toString(),
  name: item.name,
  category: item.type as ClothingType, 
  type: item.category || item.type,
  color: item.color || "Unknown",
  image_url: item.image_url,
  insulation_value: item.insulation_value || 0,
  season_tags: [],
  style_tags: [],
  material: "Unknown",
  dress_code: [],
  wear_count: 0,
  last_worn: null,
  is_favorite: false,
  created_at: new Date().toISOString(),
});

export default function HomePage() {
  const _router = _useRouter();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [recommendationData, setRecommendationData] = useState<RecommendationApiPayload | null>(null);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [_userId, setUserId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<{ message: string; ts: string }[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [lockedItems, setLockedItems] = useState<string[]>([]);
  const [allWardrobeItems, setAllWardrobeItems] = useState<ClothingItem[]>([]);

  useEffect(() => {
      if (isAuthenticated) {
          const fetchWardrobe = async () => {
              const supabase = createClient();
              const { data } = await supabase.from('clothing_items').select('*');
                  if (data && Array.isArray(data)) {
                    const typed = data as IClothingItem[];
                    setAllWardrobeItems(typed.map(mapClothingItem));
                  }
          };
          fetchWardrobe();
      }
  }, [isAuthenticated]);

  const emitClientLog = useCallback((message: string, context?: Record<string, unknown>) => {
    const entry = {
      message,
      ts: new Date().toISOString(),
    };
    setLogs(prev => [...prev.slice(-50), entry]); // Keep last 50 logs
    if (context) console.info(`[setmyfit] ${message}`, context);
    else console.info(`[setmyfit] ${message}`);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, []);

  const requestLocation = useCallback(() => {
    setError(null);
    emitClientLog('location:request:start');

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          emitClientLog('location:request:success', coords);
          setLocation(coords);
          localStorage.setItem("userLocation", JSON.stringify(coords));
        },
        (error) => {
          let errorMsg = "Location access denied";
          if (error.code === 1) errorMsg = "Location permission denied";
          if (error.code === 2) errorMsg = "Location unavailable";
          if (error.code === 3) errorMsg = "Location timeout";
          emitClientLog('location:request:error', { code: error.code, message: errorMsg });
          
          const defaultLocation = { lat: 40.7128, lon: -74.0060 };
          setLocation(defaultLocation);
          toast(`${errorMsg}. Using New York instead.`, { icon: "⚠️" });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const defaultLocation = { lat: 40.7128, lon: -74.0060 };
      setLocation(defaultLocation);
      toast("Geolocation not supported. Using New York.", { icon: "📍" });
    }
  }, [emitClientLog]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const fetchRecommendation = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setIsGenerating(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in to get outfit recommendations");
        return;
      }

      const payload = {
        ...location,
        occasion: selectedOccasion,
        lockedItems: lockedItems
      };

      const res = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data: RecommendationApiResponse = await res.json();
      
      if (data.success && data.data) {
        setRecommendationData(data.data);
      } else {
        setError(data.message || "Failed to fetch recommendation");
        if (data.needsWardrobe) {
             // Handle needs wardrobe case
        }
      }
    } catch (_err) {
      setError("An error occurred while fetching recommendation");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [location, selectedOccasion, lockedItems]);

  useEffect(() => {
    if (location && !recommendationData && isAuthenticated) {
      fetchRecommendation();
    }
  }, [location, fetchRecommendation, recommendationData, isAuthenticated]);

  // Map data to new UI types
  const weatherData: WidgetWeatherData = {
    temp: recommendationData?.weather?.temperature || 0,
    condition: recommendationData?.weather?.weather_condition || "Unknown",
    city: "Current Location", 
    humidity: recommendationData?.weather?.humidity || 0,
    wind: recommendationData?.weather?.wind_speed || 0,
  };

  const suggestedOutfit: Outfit | null = recommendationData?.recommendation ? {
    id: recommendationData.recommendation.id?.toString() || "temp-id",
    outfit_date: new Date().toISOString(),
    items: recommendationData.recommendation.outfit.map(mapClothingItem),
    reasoning: {
        weatherMatch: recommendationData.recommendation.reasoning,
        totalInsulation: 0, 
        layeringStrategy: recommendationData.recommendation.detailed_reasoning || "AI Optimized",
    }
  } : null;

  const handleToggleLock = (itemId: string) => {
      setLockedItems(prev => {
          if (prev.includes(itemId)) {
              emitClientLog(`Unlocked item: ${itemId}`);
              return prev.filter(id => id !== itemId);
          } else {
              emitClientLog(`Locked item: ${itemId}`);
              return [...prev, itemId];
          }
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* Left/Center Panel: Outfit Generator */}
        <div className="lg:col-span-2 h-full">
             <OutfitRecommender 
                items={allWardrobeItems}
                suggestedOutfit={recommendationData?.recommendation?.outfit ? {
                    id: "generated",
                    outfit_date: new Date().toISOString(),
                    items: recommendationData.recommendation.outfit.map(mapClothingItem),
                    weather_snapshot: weatherData as unknown as Record<string, unknown>,
                    reasoning: {
                        weatherMatch: recommendationData.recommendation.reasoning,
                        totalInsulation: 0,
                        layeringStrategy: recommendationData.recommendation.detailed_reasoning || "AI Optimized",
                    }
                } : null}
                isGenerating={isGenerating}
                generationProgress={0}
                onGenerate={fetchRecommendation}
                onLogOutfit={(items) => {
                    console.log("Log outfit", items);
                    emitClientLog("Outfit logged to history");
                    toast.success("Outfit logged successfully");
                }}
                onOutfitChange={(newItems) => {
                    console.log("Outfit changed", newItems);
                }}
                lockedItems={lockedItems}
                onToggleLock={handleToggleLock}
             />
        </div>

        {/* Right Panel: Widgets */}
        <div className="flex flex-col gap-4 h-full">
            
            {/* Weather Widget */}
            <div className="h-48">
                {weatherData ? (
                    <WeatherWidget data={weatherData} />
                ) : (
                    <RetroWindow title="WEATHER_LINK" className="h-full">
                        <div className="flex items-center justify-center h-full">
                            <span className="animate-pulse font-mono text-xs">CONNECTING SAT...</span>
                        </div>
                    </RetroWindow>
                )}
            </div>

            {/* System Messages */}
            <div className="flex-1">
                <SystemMsg 
                    logs={logs} 
                    location={weatherData?.city} 
                    season="Autumn" 
                    itemCount={allWardrobeItems.length}
                />
            </div>

            {/* Mission Control */}
            <div className="flex-1 min-h-[200px]">
                <MissionControl 
                    selectedOccasion={selectedOccasion}
                    onOccasionChange={(occ) => {
                        setSelectedOccasion(occ);
                        emitClientLog(`Mission profile updated: ${occ || 'General'}`);
                    }}
                    lockedCount={lockedItems.length}
                />
            </div>
        </div>
    </div>
  );
}
