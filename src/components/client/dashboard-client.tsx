/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import {
  Wind,
  Sun,
  Droplets,
  Sparkles,
  RefreshCw,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { formatTemp } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { WeatherAlertBanner, generateWeatherAlerts } from "@/components/ui/weather-alert-banner";
import { SwapModal } from "@/components/generate/SwapModal";
import { OutfitHero } from "@/components/outfit";
import type { IClothingItem } from "@/lib/types";

interface DashboardClientProps {
  recommendationData: any; // Data from /api/recommendation - dynamic structure
  location: { lat: number; lon: number };
  onRefresh: () => void;
  onAutoDetectLocation?: () => void;
}

export const DashboardClient = ({ 
  recommendationData,
  location,
  onRefresh,
  onAutoDetectLocation,
}: DashboardClientProps) => {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);

  // Swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapItemInFocus, setSwapItemInFocus] = useState<IClothingItem | null>(null);
  const [_swappedOutfit, setSwappedOutfit] = useState<IClothingItem[] | null>(null);

  // Safely destructure with fallbacks
  const { recommendation = null, weather = null } = recommendationData || {};

  // Fetch location name using reverse geocoding
  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';
        if (!apiKey) {
          return;
        }

        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${location.lat}&lon=${location.lon}&limit=1&appid=${apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const city = data[0].name;
            const state = data[0].state;
            const country = data[0].country;
            setLocationName(state ? `${city}, ${state}` : `${city}, ${country}`);
          }
        }
      } catch (_error) {
        // Silently fail - location name is nice to have but not critical
      }
    };

    if (location) {
      fetchLocationName();
    }
  }, [location]);

  const handleWearOutfit = async () => {
    setIsLogging(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Sign in so our AI stylist can remember today’s fit.");
        setIsLogging(false);
        return;
      }

      const response = await fetch("/api/outfit/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_ids: recommendation.outfit.map((item: any) => item.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to log outfit:", errorData);
        throw new Error(errorData.error || "Failed to log outfit");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to log outfit");
      }

      // Show success toast after a brief delay to let UI update
      setTimeout(() => {
        setIsLogging(false);
        toast.success("Outfit logged successfully! 🎉", { duration: 3000 });
      }, 800);
    } catch (error) {
      console.error("Error logging outfit:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to log outfit. Please try again.";
      toast.error(errorMessage);
      setIsLogging(false);
    }
  };

  const handleFeedback = async (
    type: "up" | "down"
  ) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Sign in so your stylist can learn from your ratings.");
        return;
      }

      if (feedback === type) {
        setFeedback(null);
        toast("Feedback removed", { icon: "👋" });
        return;
      }

      const recommendationId = recommendation?.id;
      
      if (!recommendationId) {
        toast.error("Your stylist lost track of this look. Try refreshing.");
        return;
      }

      // Call feedback API with outfit details for learning
      const response = await fetch(`/api/recommendation/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recommendationId,
          isLiked: type === "up",
          reason: type === "up" ? "Loved the outfit!" : "Not my style",
          outfitItems: recommendation?.outfit || [],
          weather: {
            temperature: typeof document !== 'undefined' 
              ? (document as any).__weatherData?.temperature || 20
              : 20,
            condition: typeof document !== 'undefined'
              ? (document as any).__weatherData?.condition || 'Unknown'
              : 'Unknown',
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setFeedback(type);
      toast.success(
        type === "up" 
          ? "Our AI stylist is noting that vibe—more like this coming up."
          : "Got it, we’ll steer your stylist away from looks like this.",
        { icon: type === "up" ? "👍" : "👎" }
      );
    } catch (_error) {
      toast.error("Stylist couldn’t save that note. Try again in a moment.");
    }
  };

  const handleRegenerateOutfit = async () => {
    setIsRegenerating(true);
    
    try {
      // Call the refresh function passed from parent
      await onRefresh();
      
      toast.success("Fresh fit unlocked! Our AI stylist just pulled a new look. 🎨", {
        duration: 3000,
      });
    } catch (_error) {
      toast.error("Stylist couldn’t pull a new look. Try again in a sec.");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Swap modal handlers
  const _handleOpenSwapModal = (item: IClothingItem) => {
    setSwapItemInFocus(item);
    setSwapModalOpen(true);
  };

  const handleSwapItem = async (selectedItem: IClothingItem) => {
    if (!swapItemInFocus || !recommendation?.outfit) {
      toast.error("Stylist couldn’t swap that piece just now. Try again.");
      return;
    }

    try {
      // Create new outfit with swapped item
      const newOutfit = recommendation.outfit.map((item: IClothingItem) =>
        item.id === swapItemInFocus.id ? selectedItem : item
      );

      setSwappedOutfit(newOutfit);

      toast.success("Item swapped! Our AI stylist is reworking your full look...", {
        duration: 3000,
      });

      // Refresh to show updated outfit
      await onRefresh();
    } catch (_error) {
      toast.error("Swap didn’t go through. Your stylist hit a snag.");
    }
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "text-green-600" };
    if (aqi <= 100) return { label: "Moderate", color: "text-yellow-600" };
    return { label: "Unhealthy", color: "text-red-600" };
  };

  const getUVStatus = (uv: number) => {
    if (uv <= 2) return { label: "Low", color: "text-green-600" };
    if (uv <= 5) return { label: "Moderate", color: "text-yellow-600" };
    if (uv <= 7) return { label: "High", color: "text-orange-600" };
    return { label: "Very High", color: "text-red-600" };
  };

  const aqiStatus = weather ? getAQIStatus(weather.air_quality_index || 0) : { label: "N/A", color: "text-muted-foreground" };
  const uvStatus = weather ? getUVStatus(weather.uv_index || 0) : { label: "N/A", color: "text-muted-foreground" };

  // Generate weather alerts - only show critical severity
  const weatherAlerts = weather ? generateWeatherAlerts(weather).filter(alert => alert.severity === 'critical') : [];
  
  // If no recommendation data, show empty state
  if (!recommendation || !weather) {
    return (
      <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Card className="relative overflow-hidden border-2 border-border bg-card rounded-[1.25rem] text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(6_100%_88%)/40%,transparent_55%),radial-gradient(circle_at_bottom_right,hsl(177_79%_80%)/35%,transparent_55%)] opacity-70 mix-blend-multiply" />
          <div className="space-y-4">
            <div className="flex justify-center">
              <Sparkles className="relative z-10 h-16 w-16 text-accent" />
            </div>
            <h2 className="relative z-10 text-3xl font-semibold tracking-[0.08em] uppercase font-[family-name:var(--font-heading)]">
              Building Your First Outfit
            </h2>
            <p className="relative z-10 text-muted-foreground max-w-md mx-auto text-sm md:text-base">
              We need a few more clothing items in your wardrobe to create personalized outfit recommendations. Add at least 5-7 items to get started!
            </p>
            <div className="relative z-10 flex gap-3 justify-center pt-4">
              <Button onClick={() => window.location.href = '/wardrobe'}>
                Add Clothing Items
              </Button>
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Today&apos;s Outfit
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Curated just for you based on weather and your schedule
        </p>
      </motion.div>

      {/* Weather Alerts */}
      <WeatherAlertBanner alerts={weatherAlerts} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Outfit Hero - Main Visual and Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <OutfitHero
              outfitItems={recommendation.outfit || []}
              detailedReasoning={recommendation.detailed_reasoning || recommendation.reasoning}
              onItemClick={(item) => {
                setSwapItemInFocus(item);
                setSwapModalOpen(true);
              }}
              onLogOutfit={handleWearOutfit}
              onRegenerate={handleRegenerateOutfit}
              onLikeClick={() => handleFeedback("up")}
              onDislikeClick={() => handleFeedback("down")}
              isLiked={feedback === "up"}
              isDisliked={feedback === "down"}
              isLoggingOutfit={isLogging}
              isRegenerating={isRegenerating}
            />
          </motion.div>

          {/* Outfit Gallery removed - AI visual generation disabled */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:space-y-8">
          {/* Current Weather */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Weather Card - Papercraft style with border */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base font-medium">
                      {locationName || weather.location || "Location"}
                    </CardTitle>
                  </div>
                  {onAutoDetectLocation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onAutoDetectLocation}
                      className="h-8 text-xs"
                    >
                      Auto-detect
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {Math.round(weather.temperature)}°
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {weather.weather_condition}
                  </span>
                </div>
                
                {/* Compact Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Droplets className="h-3 w-3" />
                      <span className="text-xs">Humidity</span>
                    </div>
                    <p className="text-sm font-medium">{weather.humidity}%</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Wind className="h-3 w-3" />
                      <span className="text-xs">Wind</span>
                    </div>
                    <p className="text-sm font-medium">{Math.round(weather.wind_speed)} km/h</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Sun className="h-3 w-3" />
                      <span className="text-xs">UV</span>
                    </div>
                    <p className={`text-sm font-medium ${uvStatus.color}`}>{weather.uv_index || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">AQI</p>
                    <p className={`text-sm font-medium ${aqiStatus.color}`}>{weather.air_quality_index || 0}</p>
                  </div>
                </div>
                
                {weatherAlerts.length > 0 && (
                  <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">
                      {weatherAlerts[0].message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Swap Modal */}
      <SwapModal
        isOpen={swapModalOpen}
        onClose={() => {
          setSwapModalOpen(false);
          setSwapItemInFocus(null);
        }}
        currentItem={swapItemInFocus}
        onItemSelected={handleSwapItem}
      />
    </div>
  );
};