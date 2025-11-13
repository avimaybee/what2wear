/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { toast } from "@/components/ui/toaster";
import {
  Wind,
  Sun,
  Droplets,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { formatTemp } from "@/lib/utils";
import { HourlyForecast } from "@/components/client/hourly-forecast";
import { createClient } from "@/lib/supabase/client";
import { WeatherAlertBanner, generateWeatherAlerts } from "@/components/ui/weather-alert-banner";
import { SwapModal } from "@/components/generate/SwapModal";
import { OutfitHero, OutfitGallery } from "@/components/outfit";
import { NaturalLanguageHandler } from "@/components/assistant/NaturalLanguageHandler";
import LocationSelector from "@/components/LocationSelector";
import TemplateDisplay from "@/components/TemplateDisplay";
import type { IClothingItem } from "@/lib/types";

interface DashboardClientProps {
  recommendationData: any; // Data from /api/recommendation - dynamic structure
  location: { lat: number; lon: number };
  onLocationChange: () => void;
  onRefresh: () => void;
}

export const DashboardClient = ({ 
  recommendationData,
  location,
  onLocationChange,
  onRefresh,
}: DashboardClientProps) => {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [occasionPrompt, setOccasionPrompt] = useState("");
  const [locationName, setLocationName] = useState<string | null>(null);
  const [_showLocationSelector, setShowLocationSelector] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(location);

  // Swap modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapItemInFocus, setSwapItemInFocus] = useState<IClothingItem | null>(null);
  const [_swappedOutfit, setSwappedOutfit] = useState<IClothingItem[] | null>(null);

  // Handle location selection
  const handleLocationSelect = (newLocation: { lat: number; lon: number; name: string }) => {
    setCurrentLocation(newLocation);
    setLocationName(newLocation.name);
    setShowLocationSelector(false);
    onLocationChange?.();
  };

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
        toast.error("Please sign in to log outfits");
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
        throw new Error("Failed to log outfit");
      }

      // Show success toast after a brief delay to let UI update
      setTimeout(() => {
        setIsLogging(false);
        toast.success("Outfit logged successfully! 🎉", { duration: 3000 });
      }, 800);
    } catch (_error) {
      toast.error("Failed to log outfit. Please try again.");
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
        toast.error("Please sign in to provide feedback");
        return;
      }

      if (feedback === type) {
        setFeedback(null);
        toast("Feedback removed", { icon: "👋" });
        return;
      }

      const recommendationId = recommendation?.id;
      
      if (!recommendationId) {
        toast.error("Cannot provide feedback: recommendation ID missing");
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
          ? "Thanks! We'll suggest similar outfits." 
          : "Got it! We'll adjust future recommendations.",
        { icon: type === "up" ? "👍" : "👎" }
      );
    } catch (_error) {
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  const handleRegenerateOutfit = async () => {
    setIsRegenerating(true);
    
    try {
      // Call the refresh function passed from parent
      await onRefresh();
      
      toast.success("New outfit generated! 🎨", {
        duration: 3000,
      });
    } catch (_error) {
      toast.error("Failed to regenerate outfit. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateWithPrompt = async () => {
    if (!occasionPrompt.trim()) {
      toast("Please describe your occasion first", { icon: "✏️" });
      return;
    }

    setIsGeneratingAI(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please sign in to use AI recommendations");
        setIsGeneratingAI(false);
        return;
      }

      const response = await fetch("/api/recommendation/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          occasion: occasionPrompt,
          season: "current",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI outfit");
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(`AI outfit curated for: "${occasionPrompt}" 🎯`, {
          duration: 3000,
        });
        setOccasionPrompt("");
        
        // Refresh the page to show new recommendation
        await onRefresh();
      } else {
        throw new Error(data.error || "Failed to generate outfit");
      }
    } catch (_error) {
      toast.error("Failed to generate AI outfit. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleOpenSwapModal = (item: IClothingItem) => {
    setSwapItemInFocus(item);
    setSwapModalOpen(true);
  };

  const handleSwapItem = async (selectedItem: IClothingItem) => {
    if (!swapItemInFocus || !recommendation?.outfit) {
      toast.error("Unable to swap item. Please try again.");
      return;
    }

    try {
      // Create new outfit with swapped item
      const newOutfit = recommendation.outfit.map((item: IClothingItem) =>
        item.id === swapItemInFocus.id ? selectedItem : item
      );

      setSwappedOutfit(newOutfit);

      toast.success("Item swapped! Full-resolution outfit is being generated...", {
        duration: 3000,
      });

      // Refresh to show updated outfit
      await onRefresh();
    } catch (_error) {
      toast.error("Failed to swap item. Please try again.");
    }
  };

  // Style Assistant handlers


  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", variant: "success" as const };
    if (aqi <= 100) return { label: "Moderate", variant: "warning" as const };
    return { label: "Unhealthy", variant: "destructive" as const };
  };  const getUVStatus = (uv: number) => {
    if (uv <= 2) return { label: "Low", variant: "success" as const };
    if (uv <= 5) return { label: "Moderate", variant: "warning" as const };
    if (uv <= 7) return { label: "High", variant: "warning" as const };
    return { label: "Very High", variant: "destructive" as const };
  };

  // Safely get status with null checks
  const aqiStatus = weather ? getAQIStatus(weather.air_quality_index || 0) : { label: "Unknown", variant: "default" as const };
  const uvStatus = weather ? getUVStatus(weather.uv_index || 0) : { label: "Unknown", variant: "default" as const };

  // Generate weather alerts only if weather data exists
  const weatherAlerts = weather ? generateWeatherAlerts(weather) : [];
  
  // If no recommendation data, show empty state
  if (!recommendation || !weather) {
    return (
      <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Sparkles className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Building Your First Outfit</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We need a few more clothing items in your wardrobe to create personalized outfit recommendations. Add at least 5-7 items to get started!
            </p>
            <div className="flex gap-3 justify-center pt-4">
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
              visualUrl={recommendation.outfit_visual_urls?.[0]}
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

          {/* Outfit Gallery - If multiple visuals exist */}
          {recommendation.outfit_visual_urls && recommendation.outfit_visual_urls.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <OutfitGallery
                variants={recommendation.outfit_visual_urls.map((url: string, idx: number) => ({
                  id: `variant-${idx}`,
                  imageUrl: url,
                  style: recommendation.style_preset,
                  seed: recommendation.seed,
                }))}
              />
            </motion.div>
          )}

          {/* Unified Natural Language Handler - Outfit Modifier Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <NaturalLanguageHandler
              mode="outfit_modifier"
              outfitItems={recommendation?.outfit || []}
              onProcessInput={async (input, parsedAction) => {
                if (!parsedAction || parsedAction.type === 'unknown') return;

                try {
                  switch (parsedAction.type) {
                    case 'swap':
                      if (!parsedAction.params.itemType) {
                        toast.error('Please specify which item to swap');
                        return;
                      }
                      // Find matching item in current outfit
                      const targetItem = recommendation?.outfit?.find(
                        (item: IClothingItem) => item.type.toLowerCase() === parsedAction.params.itemType?.toLowerCase()
                      );
                      if (targetItem) {
                        handleOpenSwapModal(targetItem);
                      }
                      break;
                    case 'regenerate':
                      await handleRegenerateOutfit();
                      break;
                    case 'style_change':
                      setOccasionPrompt(`${parsedAction.params.targetStyle} style outfit`);
                      await handleGenerateWithPrompt();
                      break;
                  }
                } catch (_error) {
                  toast.error('Failed to process request');
                }
              }}
              isProcessing={isRegenerating}
            />
          </motion.div>

          {/* Unified Natural Language Handler - Occasion Planner Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <NaturalLanguageHandler
              mode="occasion_planner"
              onProcessInput={async (input) => {
                setOccasionPrompt(input);
                // Call AI generation with the occasion
                try {
                  setIsGeneratingAI(true);
                  const supabase = createClient();
                  const { data: { session } } = await supabase.auth.getSession();

                  if (!session) {
                    toast.error("Please sign in to use AI recommendations");
                    return;
                  }

                  const response = await fetch("/api/recommendation/ai", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      lat: location.lat,
                      lon: location.lon,
                      occasion: input,
                      season: "current",
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to generate AI outfit");
                  }

                  const data = await response.json();
                  
                  if (data.success) {
                    toast.success(`AI outfit curated for: "${input}" 🎯`, {
                      duration: 3000,
                    });
                    // Refresh the page to show new recommendation
                    await onRefresh();
                  } else {
                    throw new Error(data.error || "Failed to generate outfit");
                  }
                } catch (_error) {
                  toast.error("Failed to generate AI outfit. Please try again.");
                } finally {
                  setIsGeneratingAI(false);
                }
              }}
              isProcessing={isGeneratingAI}
              placeholder="E.g., Casual brunch with friends, Important client meeting..."
              submitLabel="Generate AI Outfit"
              suggestions={['Casual brunch', 'Job interview', 'Date night', 'Gym workout']}
            />
          </motion.div>

          {/* Hourly Forecast */}
          <HourlyForecast location={location} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:space-y-8">
          {/* Location Selector */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Card className="overflow-hidden glass-effect">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Your Location</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  currentLocation={currentLocation}
                  currentLocationName={locationName || undefined}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Outfit Templates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            <Card className="overflow-hidden glass-effect">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Outfit Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateDisplay onSelectTemplate={(templateId) => {
                  toast(`Selected template: ${templateId}`, { icon: "⚡" });
                }} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Weather */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden glass-effect">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sun className="h-4 w-4 text-primary" />
                    {locationName || 'Weather Now'}
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  {weather.weather_condition || "Current conditions"}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Feels Like - Prominent */}
                <div className="text-center py-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg" />
                  <div className="relative">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Feels Like
                    </p>
                    <p className="text-6xl font-bold text-primary tracking-tight">
                      {formatTemp(weather.feels_like)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Actual: {formatTemp(weather.temperature)}
                    </p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-3">
                  <MetricCard
                    icon={Wind}
                    label="Air Quality"
                    value={weather.air_quality_index || 0}
                    status={aqiStatus.label}
                    statusVariant={aqiStatus.variant}
                    description="Current air quality index"
                  />
                  <MetricCard
                    icon={Sun}
                    label="UV Index"
                    value={weather.uv_index || 0}
                    status={uvStatus.label}
                    statusVariant={uvStatus.variant}
                    description={
                      (weather.uv_index || 0) > 5
                        ? "Consider sun protection"
                        : "UV protection optional"
                    }
                  />
                  <MetricCard
                    icon={Droplets}
                    label="Pollen"
                    value={(weather.pollen_count || 0).toFixed(1)}
                    status="Low"
                    statusVariant="success"
                    description="Pollen count today"
                  />
                </div>
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
        recommendationId={recommendation?.id || ''}
        outfitItems={recommendation?.outfit || []}
      />
    </div>
  );
};