"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toaster";
import { Save, User, MapPin, Thermometer, Shuffle, Settings as SettingsIcon, HelpCircle, Lock, Info, Palette, ChevronRight } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SettingsSection = "profile" | "preferences" | "appearance" | "privacy" | "about";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [temperatureSensitivity, setTemperatureSensitivity] = useState(0);
  const [varietyDays, setVarietyDays] = useState(7);
  const [name, setName] = useState("John Doe");
  const [region, setRegion] = useState("New York, USA");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load current settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setName(data.data.name || "John Doe");
            setRegion(data.data.region || "New York, USA");
            if (data.data.preferences) {
              setTemperatureSensitivity(data.data.preferences.temperature_sensitivity || 0);
              setVarietyDays(data.data.preferences.variety_days || 7);
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = {
        name,
        region,
        preferences: {
          temperature_sensitivity: temperatureSensitivity,
          variety_days: varietyDays,
        },
      };
      
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Settings saved successfully! 🎉");
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getSensitivityLabel = (value: number) => {
    if (value <= -2) return "Very Cold";
    if (value === -1) return "Cold";
    if (value === 0) return "Neutral";
    if (value === 1) return "Warm";
    return "Very Warm";
  };

  const sections = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "preferences" as const, label: "Preferences", icon: Thermometer },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "privacy" as const, label: "Privacy", icon: Lock },
    { id: "about" as const, label: "About", icon: Info },
  ];

  return (
    <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 pb-20 md:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1 mb-6"
      >
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalize your setmyfit experience
        </p>
      </motion.div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="sticky top-20">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </motion.aside>

        {/* Right Content Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Profile Section */}
          {activeSection === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for weather and location-based recommendations
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferences Section */}
          {activeSection === "preferences" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-primary" />
                    Temperature Sensitivity
                  </CardTitle>
                  <CardDescription>
                    How do you typically feel about temperature?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-medium">Current Setting:</span>
                    <Badge variant="secondary" className="px-3 py-1">
                      {getSensitivityLabel(temperatureSensitivity)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="1"
                      value={temperatureSensitivity}
                      onChange={(e) => setTemperatureSensitivity(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Very Cold</span>
                      <span>Neutral</span>
                      <span>Very Warm</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">
                    {temperatureSensitivity < 0 && "❄️ You prefer warmer clothing."}
                    {temperatureSensitivity === 0 && "🌡️ Neutral temperature preferences."}
                    {temperatureSensitivity > 0 && "☀️ You prefer cooler clothing."}
                  </div>
                </CardContent>
              </Card>

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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="variety-days" className="text-sm font-medium">
                      Don&apos;t recommend items worn in the last:
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="variety-days"
                        type="number"
                        min="1"
                        max="30"
                        value={varietyDays}
                        onChange={(e) => setVarietyDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                        className="w-24 text-center"
                      />
                      <span className="text-sm font-medium">days</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Quick Presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {[3, 7, 14, 30].map((days) => (
                        <Button
                          key={days}
                          size="sm"
                          variant={varietyDays === days ? "default" : "outline"}
                          onClick={() => setVarietyDays(days)}
                        >
                          {days === 7 ? "1 week" : days === 14 ? "2 weeks" : days === 30 ? "1 month" : `${days} days`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize your app&apos;s look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/settings/appearance">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Palette className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Accent Color</p>
                        <p className="text-xs text-muted-foreground">
                          Personalize your experience
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
                
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">
                  💡 Change your accent color to match your style and make the app truly yours
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Section */}
          {activeSection === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Manage your data and privacy</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Privacy settings will be available soon. Your data is always kept secure and private.
                </p>
              </CardContent>
            </Card>
          )}

          {/* About Section */}
          {activeSection === "about" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  About setmyfit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Version</p>
                  <p className="text-sm text-muted-foreground">1.0.0</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">
                    Your AI-powered outfit recommendation assistant
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
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
                  Save
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
