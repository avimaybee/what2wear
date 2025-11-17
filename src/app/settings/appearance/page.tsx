"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { Check, Palette, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Preset accent colors in OKLCH format (matching our design system)
const PRESET_COLORS = [
  {
    name: "Warm Coral",
    value: "0.65 0.19 35",
    description: "Default warm peach tone"
  },
  {
    name: "Ocean Blue",
    value: "0.60 0.18 240",
    description: "Cool professional blue"
  },
  {
    name: "Forest Green",
    value: "0.58 0.16 150",
    description: "Natural earthy green"
  },
  {
    name: "Sunset Orange",
    value: "0.68 0.20 50",
    description: "Vibrant sunset orange"
  },
  {
    name: "Royal Purple",
    value: "0.55 0.20 300",
    description: "Elegant deep purple"
  },
  {
    name: "Rose Pink",
    value: "0.70 0.18 10",
    description: "Soft romantic pink"
  },
  {
    name: "Emerald",
    value: "0.62 0.19 165",
    description: "Rich emerald green"
  },
  {
    name: "Amber",
    value: "0.72 0.18 70",
    description: "Warm golden amber"
  }
];

const DEFAULT_ACCENT = "0.65 0.19 35"; // Warm Coral

export default function AppearancePage() {
  const [selectedAccent, setSelectedAccent] = useState(DEFAULT_ACCENT);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's saved accent color
  useEffect(() => {
    async function loadPreferences() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (profile?.preferences?.accent_color) {
          setSelectedAccent(profile.preferences.accent_color);
          applyAccentColor(profile.preferences.accent_color);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, []);

  // Apply accent color to CSS variables
  const applyAccentColor = (color: string) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', `oklch(${color})`);
    root.style.setProperty('--ring', `oklch(${color})`);
    root.style.setProperty('--sidebar-primary', `oklch(${color})`);
    root.style.setProperty('--sidebar-ring', `oklch(${color})`);
  };

  const handleColorSelect = (color: string) => {
    setSelectedAccent(color);
    applyAccentColor(color);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Sign in so our AI stylist can remember your look.");
        setIsSaving(false);
        return;
      }

      // Get existing preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const currentPreferences = profile?.preferences || {};
      
      // Update preferences with new accent color
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPreferences,
            accent_color: selectedAccent
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Accent color saved! 🎨");
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error("Your new accent color didn’t save—your stylist hit a snag.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedAccent(DEFAULT_ACCENT);
    applyAccentColor(DEFAULT_ACCENT);
    toast("Reset to default accent color");
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8 pb-20 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Palette className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Appearance</h1>
        </div>
        <p className="text-muted-foreground">
          Customize your accent color to personalize your experience
        </p>
      </motion.div>

      {/* Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              See how your chosen accent color looks across the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Primary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge>Badge</Badge>
              <Badge variant="outline">Outline Badge</Badge>
            </div>

            <div className="p-4 rounded-lg border border-border bg-accent/10">
              <p className="text-sm">
                Accent background element with your custom color
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div 
                className="w-12 h-12 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
                style={{ backgroundColor: `oklch(${selectedAccent})` }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Current Accent Color</p>
                <p className="text-xs text-muted-foreground font-mono">
                  oklch({selectedAccent})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Color Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Choose Accent Color</CardTitle>
            <CardDescription>
              Select from preset colors designed to work harmoniously with the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {PRESET_COLORS.map((color) => {
                const isSelected = selectedAccent === color.value;
                
                return (
                  <motion.button
                    key={color.name}
                    onClick={() => handleColorSelect(color.value)}
                    className={cn(
                      "relative group p-4 rounded-lg border-2 transition-all",
                      "hover:shadow-md hover:scale-105 active:scale-95",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isSelected 
                        ? "border-primary shadow-lg scale-105" 
                        : "border-border hover:border-primary/50"
                    )}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg"
                        style={{ backgroundColor: `oklch(${color.value})` }}
                      />
                      <div className="text-center">
                        <p className="text-sm font-medium">{color.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {color.description}
                        </p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
                size="lg"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-6"
      >
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Palette className="h-5 w-5 text-accent-foreground/70 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">About Accent Colors</p>
                <p className="text-xs text-muted-foreground">
                  Your accent color is used throughout the app for buttons, links, highlights, 
                  and other interactive elements. We use the OKLCH color space to ensure 
                  consistent brightness and saturation across different colors, maintaining 
                  accessibility and visual harmony.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
