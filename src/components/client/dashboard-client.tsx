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
  Calendar,
} from "lucide-react";
import { formatTemp, cn } from "@/lib/utils";
import type { IRecommendation } from "@/types";
import { HourlyForecast } from "@/components/client/hourly-forecast";

interface DashboardClientProps {
  recommendation: IRecommendation;
}

export const DashboardClient = ({ recommendation }: DashboardClientProps) => {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const handleWearOutfit = async () => {
    setIsLogging(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    setLogSuccess(true);
    
    // Show success animation then reset
    setTimeout(() => {
      setIsLogging(false);
      toast.success("Outfit logged successfully! 🎉", {
        duration: 3000,
      });
      
      // Reset success state after animation
      setTimeout(() => setLogSuccess(false), 600);
    }, 800);
  };

  const handleFeedback = (type: "up" | "down") => {
    if (feedback === type) {
      setFeedback(null);
      toast("Feedback removed", { icon: "👋" });
    } else {
      setFeedback(type);
      toast.success(
        type === "up" 
          ? "Thanks! We'll suggest similar outfits." 
          : "Got it! We'll adjust future recommendations.",
        { icon: type === "up" ? "👍" : "👎" }
      );
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

  const aqiStatus = getAQIStatus(recommendation.aqi);
  const uvStatus = getUVStatus(recommendation.uv_index);

  return (
    <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Today&apos;s Outfit
          </h1>
        </div>
        <p className="text-muted-foreground">
          Curated just for you based on weather and your schedule
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Outfit Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl md:text-3xl">Your Perfect Look</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {recommendation.reasoning}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        {recommendation.outfit.map((item, index) => (
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
                                className="object-cover transition-transform group-hover:scale-105"
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
                    {recommendation.outfit.map((item, index) => (
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
                          className="object-cover transition-transform group-hover:scale-105"
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
                  {recommendation.outfit[0]?.style_tags?.slice(0, 3).map((tag) => (
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
                        <ThumbsUp className="h-4 w-4" />
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
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Context & Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Today&apos;s Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Schedule */}
                {recommendation.constraint_alerts.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Schedule
                    </p>
                    <div className="space-y-2">
                      {recommendation.constraint_alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium">{alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weather Alerts */}
                {recommendation.weather_alerts && recommendation.weather_alerts.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Weather Alerts
                    </p>
                    <div className="space-y-3">
                      {recommendation.weather_alerts.map((alert, idx) => (
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
          <HourlyForecast />
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:space-y-8">
          {/* Current Weather */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Weather Now</CardTitle>
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
                      {formatTemp(recommendation.temp_feels_like)}
                    </p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-3">
                  <MetricCard
                    icon={Wind}
                    label="Air Quality"
                    value={recommendation.aqi}
                    status={aqiStatus.label}
                    statusVariant={aqiStatus.variant}
                    description="Current air quality index"
                  />
                  <MetricCard
                    icon={Sun}
                    label="UV Index"
                    value={recommendation.uv_index}
                    status={uvStatus.label}
                    statusVariant={uvStatus.variant}
                    description={
                      recommendation.uv_index > 5
                        ? "Consider sun protection"
                        : "UV protection optional"
                    }
                  />
                  <MetricCard
                    icon={Droplets}
                    label="Pollen"
                    value={recommendation.pollen_count.toFixed(1)}
                    status="Low"
                    statusVariant="success"
                    description="Low pollen count today"
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