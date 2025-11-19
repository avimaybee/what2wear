"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RecommendationApiPayload, RecommendationDiagnostics, IClothingItem } from "@/lib/types";
import { WeatherWidget, WeatherData as WidgetWeatherData } from "@/components/weather-widget";
import { OutfitRecommender, Outfit, ClothingItem, ClothingType } from "@/components/outfit-recommendation";
import { RetroWindow, RetroButton } from "@/components/retro-ui";
import { toast } from "@/components/ui/toaster";

type RecommendationApiResponse = {
  success: boolean;
  data?: RecommendationApiPayload;
  diagnostics?: RecommendationDiagnostics;
  needsWardrobe?: boolean;
  message?: string;
  error?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [recommendationData, setRecommendationData] = useState<RecommendationApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const emitClientLog = useCallback((message: string, context?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    const entry = {
      message,
      context: context ?? null,
      ts: new Date().toISOString(),
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalWindow = window as any;
      globalWindow.__setmyfitLogBuffer = globalWindow.__setmyfitLogBuffer || [];
      globalWindow.__setmyfitLogBuffer.push(entry);
      if (globalWindow.__setmyfitLogBuffer.length > 200) {
        globalWindow.__setmyfitLogBuffer.shift();
      }
    } catch (_err) { }
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

      const res = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
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
    } catch (err) {
      setError("An error occurred while fetching recommendation");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [location]);

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

  const wardrobeItems: ClothingItem[] = suggestedOutfit ? suggestedOutfit.items : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Left Column: Weather & Status */}
        <div className="flex flex-col gap-6">
            <div className="h-48">
                <WeatherWidget data={weatherData} />
            </div>
            
            <RetroWindow title="SYSTEM_OPTS" className="flex-1" icon={<Settings size={16} />}>
                <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                        <span>Database Sync</span>
                        <span className="text-green-600 font-bold">ONLINE</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Version</span>
                        <span>v1.0.6-beta</span>
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-black">
                        <RetroButton variant="danger" className="w-full text-xs py-1" onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}>
                            <LogOut size={12} className="inline mr-1" /> DISCONNECT
                        </RetroButton>
                    </div>
                </div>
            </RetroWindow>
        </div>

        {/* Center Column: Outfit Generator */}
        <div className="md:col-span-2 h-full">
             <OutfitRecommender 
                items={wardrobeItems}
                suggestedOutfit={suggestedOutfit}
                isGenerating={isGenerating}
                onGenerate={fetchRecommendation}
                onLogOutfit={(items) => console.log("Log outfit", items)}
                onOutfitChange={(newItems) => {
                    console.log("Outfit changed", newItems);
                }}
             />
        </div>
    </div>
  );
}
