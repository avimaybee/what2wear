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

export function AppearanceSettings() {
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
    return <div className="space-y-4">
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Accent Color
          </CardTitle>
          <CardDescription>
            Choose a color theme that matches your style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Color Display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10">
            <div 
              className="w-12 h-12 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background flex-shrink-0"
              style={{ backgroundColor: `oklch(${selectedAccent})` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Current Color</p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                oklch({selectedAccent})
              </p>
            </div>
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_COLORS.map((color) => {
              const isSelected = selectedAccent === color.value;
              
              return (
                <motion.button
                  key={color.name}
                  onClick={() => handleColorSelect(color.value)}
                  className={cn(
                    "relative group p-3 rounded-lg border-2 transition-all",
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
                      className="w-12 h-12 rounded-full border-4 border-white/20 shadow-lg"
                      style={{ backgroundColor: `oklch(${color.value})` }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-medium truncate w-full">{color.name}</p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1"
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Preview Elements */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase">Preview</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Primary Button</Button>
              <Button size="sm" variant="outline">Outline</Button>
              <Badge>Badge</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "Saving..." : "Save Color"}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
