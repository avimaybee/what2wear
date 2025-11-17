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
    export {};
    root.style.setProperty('--sidebar-ring', `oklch(${color})`);
