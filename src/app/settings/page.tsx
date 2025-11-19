"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SettingsPage as SettingsPageComponent } from "@/components/settings/SettingsPage";
import { UserPreferences } from "@/types/retro";
import { toast } from "@/components/ui/toaster";
import { MainLayout } from "@/components/layout/MainLayout";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
          router.push('/auth/sign-in');
          return;
      }

      const response = await fetch("/api/settings/profile");
      if (!response.ok) throw new Error("Failed to fetch settings");

      const data = await response.json();
      if (data.success && data.data && data.data.preferences) {
        const prefs = data.data.preferences;
        setPreferences({
            styles: prefs.preferred_styles || [],
            colors: prefs.preferred_colors || [],
            temperature_sensitivity: prefs.temperature_sensitivity || 0,
            variety_days: prefs.variety_days || 7
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (newPrefs: Partial<UserPreferences>) => {
      try {
          // Optimistic update
          setPreferences(prev => ({ ...prev, ...newPrefs }));

          const payload = {
              preferences: {
                  preferred_styles: newPrefs.styles !== undefined ? newPrefs.styles : preferences.styles,
                  preferred_colors: newPrefs.colors !== undefined ? newPrefs.colors : preferences.colors,
                  temperature_sensitivity: newPrefs.temperature_sensitivity !== undefined ? newPrefs.temperature_sensitivity : preferences.temperature_sensitivity,
                  variety_days: newPrefs.variety_days !== undefined ? newPrefs.variety_days : preferences.variety_days
              }
          };

          const response = await fetch("/api/settings/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Failed to update settings");

          toast.success("Settings updated.");
      } catch (err) {
          console.error("Error updating settings:", err);
          toast.error("Failed to update settings.");
          fetchSettings(); // Revert on error
      }
  };

  const handleLogout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/auth/sign-in');
  };

  if (loading) {
      return (
          <MainLayout>
              <div className="flex items-center justify-center h-full">
                  <div className="font-mono text-xl animate-pulse">LOADING SETTINGS...</div>
              </div>
          </MainLayout>
      );
  }

  return (
    <MainLayout>
      <SettingsPageComponent 
        preferences={preferences} 
        onUpdate={handleUpdate} 
        onLogout={handleLogout}
      />
    </MainLayout>
  );
}
