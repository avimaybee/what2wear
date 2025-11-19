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
import { cn } from "@/lib/utils";
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
      toast("Pick at least one vibe so our AI stylist knows your lane.", { icon: "🎨" });
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
    <div className="min-h-screen papercraft-grid-bg flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-8"
      >
        {/* Progress Steps */}
        <div className="relative mb-2">
          <div className="absolute inset-x-[10%] top-6 h-[3px] bg-[repeating-linear-gradient(90deg,hsl(220_13%_70%),hsl(220_13%_70%)_8px,transparent_8px,transparent_16px)] pointer-events-none" />
          <div className="relative flex justify-between gap-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`h-12 w-12 rounded-[1.2rem] border-[3px] flex items-center justify-center bg-card shadow-md transition-all duration-200 ${
                currentStep > step.id
                  ? "border-primary bg-primary text-primary-foreground translate-y-[2px] shadow-lg"
                  : currentStep === step.id
                  ? "border-accent bg-secondary text-accent-foreground -translate-y-[1px] shadow-lg"
                  : "border-border text-muted-foreground"}
                `}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <p className="text-[10px] font-medium text-muted-foreground hidden sm:block tracking-wide">
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden border-[2.5px] border-[hsl(210_10%_85%)] shadow-[0_10px_30px_rgba(15,23,42,0.10)] bg-[hsl(40_50%_99%)] rounded-[26px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(6_100%_88%)/40%,transparent_60%),radial-gradient(circle_at_bottom_right,hsl(177_79%_80%)/35%,transparent_65%)]" />
          <div className="pointer-events-none absolute inset-[10px] border border-dashed border-[hsl(210_14%_82%)/80%] rounded-[20px]" />
          <AnimatePresence mode="wait" initial={false}>
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader className="relative z-10 text-center space-y-4 pb-2">
                  <div className="flex justify-center">
                    <motion.div
                      className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-10 w-10 text-primary-foreground" />
                    </motion.div>
                  </div>
                  <CardTitle className="text-3xl tracking-tight">Meet your AI stylist.</CardTitle>
                  <CardDescription className="text-base max-w-xl mx-auto">
                    Our AI stylist checks the weather, learns your vibe, and serves up fits that actually feel like you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[{
                      icon: Cloud,
                      title: "Weather Smart",
                      body: "Real-time local forecasts",
                    }, {
                      icon: Shirt,
                      title: "AI Powered",
                      body: "Smart outfit generation",
                    }, {
                      icon: Sparkles,
                      title: "Personalized",
                      body: "Learns your preferences",
                    }].map(({ icon: Icon, title, body }, index) => (
                      <motion.div
                        key={title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="text-center p-4 rounded-2xl bg-[hsl(40_50%_99%)] border border-[hsl(210_14%_82%)] shadow-sm"
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <h3 className="font-semibold mb-1 text-sm">{title}</h3>
                        <p className="text-xs text-muted-foreground">{body}</p>
                      </motion.div>
                    ))}
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
                <CardHeader className="relative z-10">
                  <CardTitle>Tell us about yourself</CardTitle>
                  <CardDescription>This helps us personalize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6 pb-8">
                  <div className="space-y-2">
                    <Label htmlFor="name">What should we call you?</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        "text-lg h-12 rounded-2xl border-[2.5px] border-[hsl(210_10%_85%)] bg-[hsl(40_50%_99%)] shadow-inner placeholder:text-muted-foreground/70",
                        !name.trim() && currentStep === 2
                          ? "border-primary/80 focus-visible:ring-primary"
                          : "focus-visible:ring-accent"
                      )}
                      autoFocus
                    />
                    {!name.trim() && currentStep === 2 && (
                      <p className="text-[11px] text-primary font-medium flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                        A name helps us label outfits and recommendations.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>How do you feel about temperature?</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-xs md:text-sm text-muted-foreground w-24">
                        Always Cold
                      </span>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        value={temperatureSensitivity}
                        onChange={(e) => setTemperatureSensitivity(Number(e.target.value))}
                        className="flex-1 h-2 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary"
                      />
                      <span className="text-xs md:text-sm text-muted-foreground w-24 text-right">
                        Always Warm
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <p className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-[11px] text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {temperatureSensitivity === -2 && "I'm always freezing"}
                        {temperatureSensitivity === -1 && "I tend to feel cold"}
                        {temperatureSensitivity === 0 && "I'm pretty neutral"}
                        {temperatureSensitivity === 1 && "I tend to run warm"}
                        {temperatureSensitivity === 2 && "I'm always overheating"}
                      </p>
                    </div>
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
                <CardHeader className="relative z-10">
                  <CardTitle>What&apos;s your style?</CardTitle>
                  <CardDescription>
                    Select your favorite styles and colors (choose as many as you like)
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6 pb-8">
                  <div className="space-y-3">
                    <Label>Preferred Styles</Label>
                    <div className="flex flex-wrap gap-2">
                      {styleOptions.map((style) => (
                        <Badge
                          key={style}
                          variant={selectedStyles.includes(style) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer rounded-2xl px-4 py-2 text-sm transition-all border-[2px] border-[hsl(210_12%_82%)] bg-[hsl(40_50%_99%)] shadow-sm hover:-translate-y-[1px] hover:shadow-md",
                            selectedStyles.includes(style) &&
                              "bg-primary text-primary-foreground border-primary shadow-md hover:shadow-lg"
                          )}
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
                          className={cn(
                            "cursor-pointer rounded-2xl px-4 py-2 text-sm transition-all border-[2px] border-[hsl(210_12%_82%)] bg-[hsl(40_50%_99%)] shadow-sm hover:-translate-y-[1px] hover:shadow-md",
                            selectedColors.includes(color) &&
                              "bg-secondary text-secondary-foreground border-accent shadow-md hover:shadow-lg"
                          )}
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
                <CardHeader className="relative z-10">
                  <CardTitle>Enable location</CardTitle>
                  <CardDescription>
                    We need your location to provide accurate weather-based outfit recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6 pb-8">
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
                        <p className="text-xs text-muted-foreground">
                          You can always update this later from Settings.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Click the button below to grant location permission. We&apos;ll use this to get accurate weather data for your outfit recommendations.
                        </p>
                        <div className="flex flex-col gap-3 items-center">
                          <Button
                            size="lg"
                            onClick={requestLocation}
                            className="mx-auto"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Grant Location Permission
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Use default location (New York) if skipped
                              const defaultLocation = { lat: 40.7128, lon: -74.0060 };
                              setUserLocation(defaultLocation);
                              setLocationGranted(true);
                              localStorage.setItem("userLocation", JSON.stringify(defaultLocation));
                              toast.info("Using default location (New York). You can change this in settings.");
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Skip for now
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/50 border border-[hsl(210_14%_82%)] shadow-sm space-y-2">
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
          <CardContent className="relative z-10 pt-4">
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || saving}
                className="min-w-[108px] rounded-2xl border-[2.5px] shadow-sm hover:-translate-y-[1px] hover:shadow-md"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  className="min-w-[108px] rounded-2xl border-[2.5px] border-primary shadow-[3px_3px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[1px] hover:shadow-md"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!locationGranted || saving}
                  className="min-w-[132px] rounded-2xl border-[2.5px] border-primary shadow-[3px_3px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[1px] hover:shadow-md"
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
