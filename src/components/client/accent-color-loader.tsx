"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_ACCENT = "0.65 0.19 35"; // Warm Coral

/**
 * Accent Color Loader
 * 
 * Loads and applies the user's saved accent color preference globally
 * This component should be included in the root layout
 */
export function AccentColorLoader() {
  useEffect(() => {
    async function loadAndApplyAccent() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Apply default for non-authenticated users
          applyAccentColor(DEFAULT_ACCENT);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        const accentColor = profile?.preferences?.accent_color || DEFAULT_ACCENT;
        applyAccentColor(accentColor);
      } catch (error) {
        console.error('Failed to load accent color:', error);
        applyAccentColor(DEFAULT_ACCENT);
      }
    }

    loadAndApplyAccent();
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Apply accent color to CSS custom properties
 */
function applyAccentColor(color: string) {
  const root = document.documentElement;
  root.style.setProperty('--primary', `oklch(${color})`);
  root.style.setProperty('--ring', `oklch(${color})`);
  root.style.setProperty('--sidebar-primary', `oklch(${color})`);
  root.style.setProperty('--sidebar-ring', `oklch(${color})`);
}
