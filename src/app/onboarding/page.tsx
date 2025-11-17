"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Shirt,
  Cloud,
  MapPin,
  User,
  Palette,
} from "lucide-react";
import { useRouter } from "next/navigation";

const steps = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "Profile", icon: User },
  { id: 3, title: "Preferences", icon: Palette },
  { id: 4, title: "Location", icon: MapPin },
];

const styleOptions = [
  "Casual", "Business", "Formal", "Athletic", "Streetwear", 
  "Vintage", "Minimalist", "Bohemian", "Preppy"
];

const colorOptions = [
  "Black", "White", "Navy", "Grey", "Beige", "Blue", "Red", 
  "Green", "Brown", "Pink", "Yellow", "Purple"
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [temperatureSensitivity, setTemperatureSensitivity] = useState(0);
  const [_userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/sign-in");
      }
    };
    
    checkAuth();
  }, [router]);

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      // Show immediate feedback that we're requesting location
      toast("Requesting location permission... Please allow access in your browser.", {
        icon: "📍",
        duration: 3000,
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setUserLocation(coords);
          setLocationGranted(true);
          localStorage.setItem("userLocation", JSON.stringify(coords));
          toast.success("Location saved! 📍", { duration: 2000 });
        },
        (error) => {
          console.error("Location error:", error);
          
          // Show specific error message
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Location permission denied. Please enable it in your browser settings.", {
              duration: 5000,
            });
          } else if (error.code === error.TIMEOUT) {
            toast.error("Location request timed out. Please try again.", {
              duration: 3000,
            });
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error("Location information unavailable. Using default location.", {
              duration: 3000,
            });
            // Use default location as fallback
            const defaultLocation = { lat: 40.7128, lon: -74.0060 };
            setUserLocation(defaultLocation);
            setLocationGranted(true);
            localStorage.setItem("userLocation", JSON.stringify(defaultLocation));
          } else {
            toast.error("Failed to get location. Using default location.", {
              duration: 3000,
            });
            // Use default location as fallback
            const defaultLocation = { lat: 40.7128, lon: -74.0060 };
            setUserLocation(defaultLocation);
            setLocationGranted(true);
            localStorage.setItem("userLocation", JSON.stringify(defaultLocation));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !name.trim()) {
      toast("Please enter your name", { icon: "✏️" });
      return;
    }
    if (currentStep === 3 && selectedStyles.length === 0) {
      toast("Please select at least one style preference", { icon: "🎨" });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    if (!locationGranted) {
      toast("Please grant location permission", { icon: "📍" });
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Save profile
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          preferences: {
            styles: selectedStyles,
            colors: selectedColors,
            temperature_sensitivity: temperatureSensitivity,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Profile save error:", errorData);
        throw new Error(errorData.error || "Failed to save profile");
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success("Profile saved! Let's get started! 🎉", { duration: 3000 });
        
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } else {
        throw new Error(result.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile. Please try again."
      );
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground hidden sm:block">
                {step.title}
              </p>
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-5 w-full h-0.5 bg-muted -z-10" />
              )}
            </div>
          ))}
        </div>

        <Card>
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <Sparkles className="h-10 w-10 text-primary-foreground" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl">Welcome to setmyfit!</CardTitle>
                  <CardDescription className="text-base">
                    Your smart outfit recommendation app that knows the weather and your style
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-primary/5">
                      <Cloud className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Weather Smart</h3>
                      <p className="text-xs text-muted-foreground">
                        Real-time weather integration
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary/5">
                      <Shirt className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">AI Powered</h3>
                      <p className="text-xs text-muted-foreground">
                        Gemini AI recommendations
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary/5">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Personalized</h3>
                      <p className="text-xs text-muted-foreground">
                        Learns your preferences
                      </p>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 2: Profile */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle>Tell us about yourself</CardTitle>
                  <CardDescription>
                    This helps us personalize your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">What should we call you?</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-lg h-12"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>How do you feel about temperature?</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-24">
                        Always Cold
                      </span>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        value={temperatureSensitivity}
                        onChange={(e) => setTemperatureSensitivity(Number(e.target.value))}
                        className="flex-1 h-2 rounded-full appearance-none bg-muted cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground w-24 text-right">
                        Always Warm
                      </span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {temperatureSensitivity === -2 && "I'm always freezing!"}
                      {temperatureSensitivity === -1 && "I tend to feel cold"}
                      {temperatureSensitivity === 0 && "I'm just right"}
                      {temperatureSensitivity === 1 && "I tend to feel warm"}
                      {temperatureSensitivity === 2 && "I'm always hot!"}
                    </p>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle>What&apos;s your style?</CardTitle>
                  <CardDescription>
                    Select your favorite styles and colors (choose as many as you like)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Preferred Styles</Label>
                    <div className="flex flex-wrap gap-2">
                      {styleOptions.map((style) => (
                        <Badge
                          key={style}
                          variant={selectedStyles.includes(style) ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                          onClick={() => handleStyleToggle(style)}
                        >
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Favorite Colors</Label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <Badge
                          key={color}
                          variant={selectedColors.includes(color) ? "default" : "outline"}
                          className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                          onClick={() => handleColorToggle(color)}
                        >
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 4: Location */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle>Enable location</CardTitle>
                  <CardDescription>
                    We need your location to provide accurate weather-based outfit recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8 space-y-4">
                    <div className="flex justify-center">
                      <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-all ${
                        locationGranted 
                          ? "bg-green-500/10" 
                          : "bg-primary/10"
                      }`}>
                        <MapPin className={`h-10 w-10 ${
                          locationGranted ? "text-green-500" : "text-primary"
                        }`} />
                      </div>
                    </div>
                    
                    {locationGranted ? (
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-green-500">
                          ✓ Location Enabled
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You&apos;re all set! We&apos;ll use your location for weather-based recommendations.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Click the button below to grant location permission. We&apos;ll use this to get accurate weather data for your outfit recommendations.
                        </p>
                        <Button
                          size="lg"
                          onClick={requestLocation}
                          className="mx-auto"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Grant Location Permission
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-xs font-medium">Why we need location:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>&bull; Real-time weather data for your area</li>
                      <li>&bull; Accurate temperature and conditions</li>
                      <li>&bull; UV index and air quality information</li>
                      <li>&bull; Better outfit recommendations</li>
                    </ul>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <CardContent className="pt-0">
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || saving}
                className="min-w-[100px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  className="min-w-[100px]"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!locationGranted || saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <>
                      Get Started
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
