/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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

  const { recommendation, weather } = recommendationData;

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
      if (!recommendationId) {
        toast.error("No recommendation available");
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

  const aqiStatus = getAQIStatus(weather.air_quality_index || 0);
  const uvStatus = getUVStatus(weather.uv_index || 0);

  // Generate weather alerts
  const weatherAlerts = generateWeatherAlerts(weather);

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
                <CardTitle className="text-xl md:text-2xl">Your Perfect Look</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {recommendation.reasoning}
                </CardDescription>
              </CardHeader>
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
                              className="group relative aspect-square overflow-hidden hover:shadow-lg squircle-filter transition-all"
                            >
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                sizes="75vw"
                                className="object-cover transition-opacity group-hover:opacity-90"
                                priority={index === 0}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent">
                                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
                                  <p className="text-white font-semibold text-base">
                                    {item.name}
                                  </p>
                                  <p className="text-white/80 text-sm">{item.type}</p>
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
                        className="group relative aspect-square overflow-hidden hover:shadow-lg squircle-filter transition-all"
                      >
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          sizes="(max-width: 1200px) 25vw, 200px"
                          className="object-cover transition-opacity group-hover:opacity-90"
                          priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                            <p className="text-white font-semibold text-sm line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-white/80 text-xs">{item.type}</p>
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
                  <CardTitle className="text-lg">Weather Now</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLocationChange}
                    className="h-8"
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
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
    </div>
  );
};