/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { toast } from "@/components/ui/toaster";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  ThumbsUp,
  ThumbsDown,
  Wind,
  Sun,
  Droplets,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Wand2,
  MapPin,
} from "lucide-react";
import { formatTemp, cn } from "@/lib/utils";
import { HourlyForecast } from "@/components/client/hourly-forecast";
import { createClient } from "@/lib/supabase/client";
import { WeatherAlertBanner, generateWeatherAlerts } from "@/components/ui/weather-alert-banner";
import { SwapModal } from "@/components/generate/SwapModal";
import type { IClothingItem } from "@/lib/types";

// Placeholder image as data URI (simple clothing icon)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Cpath fill='%239ca3af' d='M150 100h100v200h-100z'/%3E%3Ccircle fill='%239ca3af' cx='200' cy='100' r='40'/%3E%3Ctext x='200' y='350' font-family='system-ui' font-size='20' fill='%236b7280' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

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
  const [logSuccess, setLogSuccess] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [occasionPrompt, setOccasionPrompt] = useState("");
  const [locationName, setLocationName] = useState<string | null>(null);
  const [showFullReason, setShowFullReason] = useState(false);

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
          console.warn('NEXT_PUBLIC_OPENWEATHER_API_KEY is not set — skipping reverse geocoding');
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
        } else {
          console.warn('Reverse geocoding failed with status', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch location name:', error);
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

      setLogSuccess(true);
      
      setTimeout(() => {
        setIsLogging(false);
        toast.success("Outfit logged successfully! 🎉", {
          duration: 3000,
        });
        
        setTimeout(() => setLogSuccess(false), 600);
      }, 800);
    } catch (error) {
      console.error("Error logging outfit:", error);
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
      
      // Debug log to help troubleshoot
      console.log('Recommendation object:', recommendation);
      console.log('Recommendation ID:', recommendationId);
      
      if (!recommendationId) {
        toast.error("Unable to submit feedback - recommendation not saved");
        console.error("No recommendation ID found in:", recommendation);
        return;
      }

      // Call feedback API
      const response = await fetch(`/api/recommendation/${recommendationId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_liked: type === "up",
          reason: type === "up" ? "Loved the outfit!" : "Not my style",
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
    } catch (error) {
      console.error("Error submitting feedback:", error);
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
    } catch (error) {
      console.error("Error regenerating outfit:", error);
      toast.error("Failed to generate new outfit. Please try again.");
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
    } catch (error) {
      console.error("Error generating AI outfit:", error);
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
    } catch (error) {
      console.error("Error swapping item:", error);
      toast.error("Failed to swap item. Please try again.");
    }
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", variant: "success" as const };
    if (aqi <= 100) return { label: "Moderate", variant: "warning" as const };
    return { label: "Unhealthy", variant: "destructive" as const };
  };

  const getUVStatus = (uv: number) => {
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
          {/* Outfit Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="overflow-hidden glass-effect">
                <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl md:text-2xl">Your Perfect Look</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Curated for today — practical, comfortable, and styled for your plans.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              {/* Outfit Visual Preview */}
              {recommendation.outfit_visual_urls && recommendation.outfit_visual_urls.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="px-6 pb-4"
                >
                  <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-muted shadow-md hover:shadow-lg transition-shadow">
                    <Image
                      src={recommendation.outfit_visual_urls[0]}
                      alt="Generated outfit visual"
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                      priority
                      unoptimized
                      onError={(e) => {
                        const target = (e as React.SyntheticEvent<HTMLImageElement, Event>).currentTarget as HTMLImageElement;
                        if (target && target.src !== PLACEHOLDER_IMAGE) {
                          target.src = PLACEHOLDER_IMAGE;
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    AI-generated outfit preview
                  </p>
                </motion.div>
              )}
              {/* Detailed explanation block */}
              <div className="px-6 pb-3">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  className="rounded-lg border border-border bg-background/40 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Why this outfit?</p>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {recommendation.detailed_reasoning ? (
                      (() => {
                        const full = recommendation.detailed_reasoning as string;
                        const paragraphs = full.split('\n\n');
                        if (showFullReason) {
                          return (
                            <>
                              {paragraphs.map((para: string, i: number) => (
                                <p key={i} className={i === 0 ? 'mb-2' : 'mb-1'}>{para}</p>
                              ))}
                              <div className="pt-2">
                                <Button size="sm" variant="ghost" onClick={() => setShowFullReason(false)}>
                                  Show less
                                </Button>
                              </div>
                            </>
                          );
                        }

                        // collapsed view: show first paragraph or truncated char preview
                        const preview = paragraphs[0] || full;
                        const MAX_PREVIEW = 220;
                        const truncated = preview.length > MAX_PREVIEW ? preview.slice(0, MAX_PREVIEW).trimEnd() + '…' : preview;
                        return (
                          <>
                            <p className="mb-2">{truncated}</p>
                            {paragraphs.length > 1 && (
                              <div className="pt-1">
                                <Button size="sm" variant="link" onClick={() => setShowFullReason(true)}>
                                  Show more
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <p>{recommendation.reasoning}</p>
                    )}
                  </div>
                </motion.div>
              </div>
              <CardContent className="space-y-4">
                {/* Outfit Items - Carousel on Mobile, Grid on Desktop */}
                <div>
                  {/* Mobile Carousel (hidden on md+) */}
                  <div className="block md:hidden">
                    <Carousel
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                      plugins={[
                        Autoplay({
                          delay: 3000,
                        }),
                      ]}
                      className="w-full"
                    >
                      <CarouselContent>
                        {recommendation.outfit.map((item: any, index: number) => (
                          <CarouselItem key={item.id} className="basis-3/4">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="group relative aspect-square overflow-hidden hover:shadow-lg squircle-filter transition-all bg-muted"
                            >
                              <Image
                                src={item.image_url || PLACEHOLDER_IMAGE}
                                alt={item.name || 'Clothing item'}
                                fill
                                sizes="75vw"
                                className="object-cover transition-opacity group-hover:opacity-90"
                                priority={index === 0}
                                onError={(e) => {
                                  // Use currentTarget which correctly references the underlying <img> element
                                  const target = (e as React.SyntheticEvent<HTMLImageElement, Event>).currentTarget as HTMLImageElement;
                                  if (target && target.src !== PLACEHOLDER_IMAGE) target.src = PLACEHOLDER_IMAGE;
                                }}
                                // Always avoid the Next/Image optimizer for wardrobe images (matches wardrobe page)
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent">
                                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                                  <p className="text-white font-semibold text-base">
                                    {item.name || 'Clothing Item'}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-white/80 text-sm">{item.type || 'Unknown Type'}</p>
                                    {item.color && (
                                      <div
                                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: item.color.toLowerCase() }}
                                        title={item.color}
                                      />
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleOpenSwapModal(item)}
                                    className="w-full mt-2"
                                  >
                                    Swap Item
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="-left-2" />
                      <CarouselNext className="-right-2" />
                    </Carousel>
                  </div>

                  {/* Desktop Grid (hidden on mobile) */}
                  <div className="hidden md:grid grid-cols-4 gap-3 md:gap-4">
                    {recommendation.outfit.map((item: any, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="group relative aspect-square overflow-hidden hover:shadow-lg squircle-filter transition-all bg-muted"
                      >
                        <Image
                          src={item.image_url || PLACEHOLDER_IMAGE}
                          alt={item.name || 'Clothing item'}
                          fill
                          sizes="(max-width: 1200px) 25vw, 200px"
                          className="object-cover transition-opacity group-hover:opacity-90"
                          priority={index === 0}
                          onError={(e) => {
                            const target = (e as React.SyntheticEvent<HTMLImageElement, Event>).currentTarget as HTMLImageElement;
                            if (target && target.src !== PLACEHOLDER_IMAGE) target.src = PLACEHOLDER_IMAGE;
                          }}
                          // Always avoid the Next/Image optimizer for wardrobe images (matches wardrobe page)
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                            <p className="text-white font-semibold text-sm line-clamp-1">
                              {item.name || 'Clothing Item'}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-white/80 text-xs">{item.type || 'Unknown Type'}</p>
                              {item.color && (
                                <div
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: item.color.toLowerCase() }}
                                  title={item.color}
                                />
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenSwapModal(item)}
                              className="w-full text-xs h-8"
                            >
                              Swap
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Dress Code Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {recommendation.dress_code}
                  </Badge>
                  {recommendation.outfit[0]?.style_tags?.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Enhanced Action Button with Success Animation */}
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={handleWearOutfit}
                    disabled={isLogging}
                    variant={logSuccess ? "success" : "default"}
                    className={cn(
                      "w-full text-base font-semibold h-14 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden",
                      logSuccess && "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    )}
                    aria-busy={isLogging}
                  >
                    <AnimatePresence mode="wait">
                      {logSuccess ? (
                        <motion.div
                          key="success"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 200, 
                            damping: 15 
                          }}
                          className="flex items-center"
                        >
                          <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 mr-2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          >
                            <motion.path d="M20 6L9 17l-5-5" />
                          </motion.svg>
                          Logged!
                        </motion.div>
                      ) : isLogging ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-5 w-5 mr-2" />
                          </motion.div>
                          Processing...
                        </motion.div>
                      ) : (
                        <motion.div
                          key="default"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center"
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Wear This Outfit
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Ripple effect on success */}
                    {logSuccess && (
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                  </Button>

                  {/* Generate Another Outfit Button */}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleRegenerateOutfit}
                    disabled={isRegenerating}
                    className="w-full text-base font-semibold h-12 transition-all duration-200"
                    aria-busy={isRegenerating}
                  >
                    <motion.div
                      animate={isRegenerating ? { rotate: 360 } : { rotate: 0 }}
                      transition={
                        isRegenerating 
                          ? { duration: 1, repeat: Infinity, ease: "linear" }
                          : { duration: 0 }
                      }
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                    </motion.div>
                    {isRegenerating ? "Generating..." : "Generate Another Outfit"}
                  </Button>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="text-sm text-muted-foreground font-medium">
                      How does this look?
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant={feedback === "up" ? "default" : "outline"}
                        onClick={() => handleFeedback("up")}
                        className={cn(
                          "transition-all",
                          feedback === "up" && "shadow-lg"
                        )}
                        aria-label="I like this outfit"
                      >
                        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant={feedback === "down" ? "destructive" : "outline"}
                        onClick={() => handleFeedback("down")}
                        className={cn(
                          "transition-all",
                          feedback === "down" && "shadow-lg"
                        )}
                        aria-label="I don't like this outfit"
                      >
                        <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Occasion Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Describe Your Occasion
                </CardTitle>
                <CardDescription>
                  Tell us about your day and we&apos;ll curate the perfect outfit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <textarea
                    value={occasionPrompt}
                    onChange={(e) => setOccasionPrompt(e.target.value)}
                    placeholder="E.g., Casual brunch with friends, Important client meeting, Date night at a fancy restaurant..."
                    className="w-full min-h-[100px] px-4 py-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-sm"
                    maxLength={200}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>AI will consider weather, your wardrobe, and occasion</span>
                    <span>{occasionPrompt.length}/200</span>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateWithPrompt}
                  disabled={isGeneratingAI || !occasionPrompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  <motion.div
                    animate={isGeneratingAI ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                      isGeneratingAI 
                        ? { duration: 1, repeat: Infinity, ease: "linear" }
                        : { duration: 0 }
                    }
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                  </motion.div>
                  {isGeneratingAI ? "Curating with AI..." : "Generate AI Outfit"}
                </Button>

                {/* Weather Alerts */}
                {recommendation.weather_alerts && recommendation.weather_alerts.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Weather Alerts
                    </p>
                    <div className="space-y-3">
                      {recommendation.weather_alerts.map((alert: any, idx: number) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-4 rounded-lg border-l-4 space-y-2",
                            alert.severity === "high" && "border-destructive bg-destructive/5",
                            alert.severity === "moderate" && "border-yellow-500 bg-yellow-500/5",
                            alert.severity === "low" && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1 flex-1">
                              <p className="text-sm font-semibold">{alert.message}</p>
                              {alert.recommendation && (
                                <p className="text-xs text-muted-foreground">
                                  {alert.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Hourly Forecast */}
          <HourlyForecast location={location} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:space-y-8">
          {/* Current Weather */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden glass-effect">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {locationName || 'Weather Now'}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLocationChange}
                    className="h-8"
                  >
                    Change
                  </Button>
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