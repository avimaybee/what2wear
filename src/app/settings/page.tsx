"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toaster";
import { Save, User, MapPin, Thermometer, Shuffle, Settings as SettingsIcon, HelpCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  // Mock initial settings - In production, fetch from GET /api/settings/profile
  const [temperatureSensitivity, setTemperatureSensitivity] = useState(0);
  const [varietyDays, setVarietyDays] = useState(7);
  const [name, setName] = useState("John Doe");
  const [region, setRegion] = useState("New York, USA");
  const [isSaving, setIsSaving] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Calculate slider thumb position for dynamic label
  useEffect(() => {
    if (sliderRef.current) {
      const min = -2;
      const max = 2;
      const value = temperatureSensitivity;
      const percentage = ((value - min) / (max - min)) * 100;
      setSliderPosition(percentage);
    }
  }, [temperatureSensitivity]);

  const handleSave = async () => {
    setIsSaving(true);
    // In production, this would call PUT /api/settings/profile
    const settings = {
      name,
      region,
      preferences: {
        temperature_sensitivity: temperatureSensitivity,
        variety_days: varietyDays,
      },
    };
    console.log("Saving settings:", settings);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    
    toast.success("Settings saved successfully! Your preferences have been updated. 🎉");
  };

  const getSensitivityLabel = (value: number) => {
    if (value <= -2) return "Very Cold";
    if (value === -1) return "Cold";
    if (value === 0) return "Neutral";
    if (value === 1) return "Warm";
    return "Very Warm";
  };

  return (
    <div className="container max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Personalize your setmyfit experience
        </p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Information
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex" aria-label="Profile help">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent showArrow>
                    <p className="max-w-xs">Your profile information helps personalize outfit recommendations based on your location and preferences.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="transition-all focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Region
                </div>
              </Label>
              <Input
                id="region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., New York, USA"
                className="transition-all focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Used for weather and location-based recommendations
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Temperature Sensitivity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-primary" />
              Temperature Sensitivity
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex" aria-label="Temperature sensitivity help">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent showArrow>
                    <p className="max-w-xs">Tell us if you prefer warmer or cooler clothing. This adjusts outfit recommendations to match your comfort level.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              How do you typically feel about temperature?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Current Setting:</span>
                <motion.div
                  key={temperatureSensitivity}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge variant="secondary" className="text-base px-4 py-1.5 font-semibold">
                    {getSensitivityLabel(temperatureSensitivity)}
                  </Badge>
                </motion.div>
              </div>

              {/* Enhanced Slider with Dynamic Label */}
              <div className="space-y-3">
                <div className="relative pt-8 pb-2">
                  {/* Dynamic floating label above thumb */}
                  <motion.div
                    className="absolute top-0 -translate-x-1/2 pointer-events-none"
                    animate={{ 
                      left: `${sliderPosition}%`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <motion.div
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg whitespace-nowrap"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getSensitivityLabel(temperatureSensitivity)}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary" />
                    </motion.div>
                  </motion.div>

                  <input
                    ref={sliderRef}
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={temperatureSensitivity}
                    onChange={(e) => setTemperatureSensitivity(Number(e.target.value))}
                    className={cn(
                      "w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary",
                      "[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full",
                      "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer",
                      "[&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:shadow-lg",
                      "hover:[&::-webkit-slider-thumb]:bg-primary/90 transition-all",
                      // Ensure 44x44px touch target
                      "[&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10",
                      "touch-pan-x"
                    )}
                    style={{
                      minHeight: "44px", // WCAG touch target minimum
                      padding: "16px 0",
                    }}
                    aria-label="Temperature sensitivity"
                    aria-valuemin={-2}
                    aria-valuemax={2}
                    aria-valuenow={temperatureSensitivity}
                    aria-valuetext={getSensitivityLabel(temperatureSensitivity)}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                  <span>Very Cold</span>
                  <span>Neutral</span>
                  <span>Very Warm</span>
                </div>
              </div>

              <motion.div
                key={`desc-${temperatureSensitivity}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border border-border"
              >
                {temperatureSensitivity < 0 && "❄️ You prefer warmer clothing. Recommendations will include more insulation and layers."}
                {temperatureSensitivity === 0 && "🌡️ You have neutral temperature preferences. Recommendations follow standard guidelines."}
                {temperatureSensitivity > 0 && "☀️ You prefer cooler clothing. Recommendations will include lighter, breathable layers."}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Variety Preference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-primary" />
              Variety Preference
            </CardTitle>
            <CardDescription>
              How often do you want to see different outfits?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="variety-days" className="text-sm font-medium">
                Don&apos;t recommend items worn in the last:
              </Label>
              <div className="flex items-center gap-4">
                <motion.div
                  key={varietyDays}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id="variety-days"
                    type="number"
                    min="1"
                    max="30"
                    value={varietyDays}
                    onChange={(e) => setVarietyDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-28 text-center text-lg font-bold transition-all focus:ring-2 focus:ring-ring"
                  />
                </motion.div>
                <span className="text-base font-medium">days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Higher values ensure more variety in your daily recommendations (1-30 days)
              </p>
            </div>

            {/* Quick Presets with proper touch targets */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Quick Presets:</p>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Button
                  size="lg"
                  variant={varietyDays === 3 ? "default" : "outline"}
                  onClick={() => setVarietyDays(3)}
                  className="transition-all min-h-[44px] min-w-[44px]"
                  aria-pressed={varietyDays === 3}
                >
                  3 days
                </Button>
                <Button
                  size="lg"
                  variant={varietyDays === 7 ? "default" : "outline"}
                  onClick={() => setVarietyDays(7)}
                  className="transition-all min-h-[44px] min-w-[44px]"
                  aria-pressed={varietyDays === 7}
                >
                  1 week
                </Button>
                <Button
                  size="lg"
                  variant={varietyDays === 14 ? "default" : "outline"}
                  onClick={() => setVarietyDays(14)}
                  className="transition-all min-h-[44px] min-w-[44px]"
                  aria-pressed={varietyDays === 14}
                >
                  2 weeks
                </Button>
                <Button
                  size="lg"
                  variant={varietyDays === 30 ? "default" : "outline"}
                  onClick={() => setVarietyDays(30)}
                  className="transition-all min-h-[44px] min-w-[44px]"
                  aria-pressed={varietyDays === 30}
                >
                  1 month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sticky Save Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="sticky bottom-20 md:bottom-6 z-40 flex justify-end gap-3 p-4 rounded-lg border border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-lg"
      >
        <Button variant="outline" asChild size="lg">
          <Link href="/">Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="min-w-[140px]">
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Save className="h-4 w-4 mr-2" />
              </motion.div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
