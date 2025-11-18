"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { User, Thermometer, Shuffle, Settings as SettingsIcon, Lock, Info, Tag, Droplets, Scissors } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type SettingsSection = "profile" | "preferences" | "privacy" | "about";
type FitPreference = 'Slim' | 'Regular' | 'Oversized';

// Helper component for the preference selectors
const PreferenceSelector = ({ title, options, selected, onSelect, variant = 'default' }: { title: string, options: string[], selected: string[], onSelect: (value: string) => void, variant?: 'default' | 'destructive' }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Badge
          key={option}
          variant={selected.includes(option) ? variant : "secondary"}
          onClick={() => onSelect(option)}
          className="cursor-pointer transition-transform transform hover:scale-105"
        >
          {option}
        </Badge>
      ))}
    </div>
  </div>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("preferences");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Profile State
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");

  // Preferences State
  const [temperatureSensitivity, setTemperatureSensitivity] = useState(0);
  const [varietyDays, setVarietyDays] = useState(7);
  const [fitPreference, setFitPreference] = useState<FitPreference>('Regular');
  const [silhouette, setSilhouette] = useState<'male' | 'female' | 'other' | 'neutral'>('neutral');
  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);
  const [dislikedStyles, setDislikedStyles] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [dislikedColors, setDislikedColors] = useState<string[]>([]);
  const [preferredMaterials, setPreferredMaterials] = useState<string[]>([]);
  const [dislikedMaterials, setDislikedMaterials] = useState<string[]>([]);

  // Wardrobe Metadata State
  const [wardrobeMeta, setWardrobeMeta] = useState<{ styles: string[], colors: string[], materials: string[] }>({ styles: [], colors: [], materials: [] });

  // Load settings and metadata on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [settingsRes, metaRes] = await Promise.all([
          fetch('/api/settings/profile'),
          fetch('/api/wardrobe/meta')
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.success && data.data) {
            setName(data.data.name || "");
            setRegion(data.data.region || "");
            if (data.data.preferences) {
              const prefs = data.data.preferences;
              setTemperatureSensitivity(prefs.temperature_sensitivity || 0);
              setVarietyDays(prefs.variety_days || 7);
              setFitPreference(prefs.fit_preference || 'Regular');
              setPreferredStyles(prefs.preferred_styles || []);
              setDislikedStyles(prefs.disliked_styles || []);
              setPreferredColors(prefs.preferred_colors || []);
              setDislikedColors(prefs.disliked_colors || []);
              setPreferredMaterials(prefs.preferred_materials || []);
              setDislikedMaterials(prefs.disliked_materials || []);
              setSilhouette(prefs.preferred_silhouette || 'neutral');
            }
          }
        }

        if (metaRes.ok) {
          const data = await metaRes.json();
          if (data.success) {
            setWardrobeMeta(data.data);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error("Our AI stylist couldn’t load your details. Give the page a quick refresh.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
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
          fit_preference: fitPreference,
          preferred_silhouette: silhouette,
          preferred_styles: preferredStyles,
          disliked_styles: dislikedStyles,
          preferred_colors: preferredColors,
          disliked_colors: dislikedColors,
          preferred_materials: preferredMaterials,
          disliked_materials: dislikedMaterials,
        },
      };
      
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      const data = await response.json();
      if (data.success) {
        toast.success("Settings saved successfully! 🎉");
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Your tweaks didn’t stick. Try saving your settings again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleSelection = (list: string[], item: string) => 
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const handleSelect = (type: 'styles' | 'colors' | 'materials', preference: 'preferred' | 'disliked', value: string) => {
    if (type === 'styles') {
      if (preference === 'preferred') {
        setDislikedStyles(dislikedStyles.filter(i => i !== value));
        setPreferredStyles(toggleSelection(preferredStyles, value));
      } else {
        setPreferredStyles(preferredStyles.filter(i => i !== value));
        setDislikedStyles(toggleSelection(dislikedStyles, value));
      }
    } else if (type === 'colors') {
       if (preference === 'preferred') {
        setDislikedColors(dislikedColors.filter(i => i !== value));
        setPreferredColors(toggleSelection(preferredColors, value));
      } else {
        setPreferredColors(preferredColors.filter(i => i !== value));
        setDislikedColors(toggleSelection(dislikedColors, value));
      }
    } else if (type === 'materials') {
       if (preference === 'preferred') {
        setDislikedMaterials(dislikedMaterials.filter(i => i !== value));
        setPreferredMaterials(toggleSelection(preferredMaterials, value));
      } else {
        setPreferredMaterials(preferredMaterials.filter(i => i !== value));
        setDislikedMaterials(toggleSelection(dislikedMaterials, value));
      }
    }
  };

  const getSensitivityLabel = (value: number) => {
    if (value <= -2) return "Very Cold";
    if (value === -1) return "Cold";
    if (value === 0) return "Neutral";
    if (value === 1) return "Warm";
    return "Very Warm";
  };

  const sections = useMemo(() => [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "preferences" as const, label: "Preferences", icon: Thermometer },
    { id: "privacy" as const, label: "Privacy", icon: Lock },
    { id: "about" as const, label: "About", icon: Info },
  ], []);

  const renderPreferences = () => {
    if (isLoading) {
      return <Skeleton className="h-[500px] w-full" />;
    }
    return (
      <div className="space-y-6">
        {/* Fit Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Scissors className="h-5 w-5 text-primary" />Fit Preference</CardTitle>
            <CardDescription>How do you generally like your clothes to fit?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(['Slim', 'Regular', 'Oversized'] as FitPreference[]).map((fit) => (
                <Button key={fit} variant={fitPreference === fit ? "default" : "outline"} onClick={() => setFitPreference(fit)}>
                  {fit}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Silhouette Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Silhouette</CardTitle>
            <CardDescription>Tell us which silhouette best represents you for outfit visual generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(['male', 'female', 'other'] as const).map((s) => (
                <Button key={s} variant={silhouette === s ? 'default' : 'outline'} onClick={() => setSilhouette(s)}>
                  {s === 'other' ? 'Other / Prefer not to say' : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Style Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" />Style Preferences</CardTitle>
            <CardDescription>Select style tags from your wardrobe that you prefer or want to avoid in recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wardrobeMeta.styles.length > 0 ? (
              <>
                <PreferenceSelector title="Preferred Styles" options={wardrobeMeta.styles} selected={preferredStyles} onSelect={(val) => handleSelect('styles', 'preferred', val)} />
                <PreferenceSelector title="Disliked Styles" options={wardrobeMeta.styles} selected={dislikedStyles} onSelect={(val) => handleSelect('styles', 'disliked', val)} variant="destructive" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Add clothing items with style tags to your wardrobe to set preferences.</p>
            )}
          </CardContent>
        </Card>

        {/* Color Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-primary" />Color Preferences</CardTitle>
            <CardDescription>Highlight your favorite colors to see them more often.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PreferenceSelector title="Preferred Colors" options={wardrobeMeta.colors} selected={preferredColors} onSelect={(val) => handleSelect('colors', 'preferred', val)} />
            <PreferenceSelector title="Disliked Colors" options={wardrobeMeta.colors} selected={dislikedColors} onSelect={(val) => handleSelect('colors', 'disliked', val)} variant="destructive" />
          </CardContent>
        </Card>
        
        {/* Material Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-primary" />Material Preferences</CardTitle>
            <CardDescription>Choose materials you like or dislike for comfort and style.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wardrobeMeta.materials.length > 0 ? (
              <>
                <PreferenceSelector title="Preferred Materials" options={wardrobeMeta.materials} selected={preferredMaterials} onSelect={(val) => handleSelect('materials', 'preferred', val)} />
                <PreferenceSelector title="Disliked Materials" options={wardrobeMeta.materials} selected={dislikedMaterials} onSelect={(val) => handleSelect('materials', 'disliked', val)} variant="destructive" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Add clothing items with material information to set preferences.</p>
            )}
          </CardContent>
        </Card>

        {/* Temperature Sensitivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Thermometer className="h-5 w-5 text-primary" />Temperature Sensitivity</CardTitle>
            <CardDescription>How do you typically feel about temperature?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Current Setting:</span>
              <Badge variant="secondary" className="px-3 py-1">{getSensitivityLabel(temperatureSensitivity)}</Badge>
            </div>
            <div className="space-y-3">
              <input type="range" min="-2" max="2" step="1" value={temperatureSensitivity} onChange={(e) => setTemperatureSensitivity(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Cold</span>
                <span>Neutral</span>
                <span>Very Warm</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variety Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shuffle className="h-5 w-5 text-primary" />Variety Preference</CardTitle>
            <CardDescription>How often do you want to see different outfits?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variety-days" className="text-sm font-medium">Don&#39;t recommend items worn in the last:</Label>
              <div className="flex items-center gap-3">
                <Input id="variety-days" type="number" min="1" max="30" value={varietyDays} onChange={(e) => setVarietyDays(Math.max(1, Math.min(30, Number(e.target.value))))} className="w-24 text-center" />
                <span className="text-sm font-medium">days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 pb-24 md:pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-2 mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground font-heading">Control Center</p>
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Personalize your what2wear experience</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-1">
          <Card className="sticky top-20"><CardContent className="p-2"><nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button key={section.id} onClick={() => setActiveSection(section.id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors", activeSection === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav></CardContent></Card>
        </motion.aside>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-3 space-y-6">
          {activeSection === "profile" && (
            <Card>
              <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Update your personal details</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="region">Region</Label><Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} /></div>
              </CardContent>
            </Card>
          )}
          {activeSection === "preferences" && renderPreferences()}
          {activeSection === "privacy" && <Card><CardHeader><CardTitle>Privacy</CardTitle></CardHeader><CardContent><p>Privacy settings coming soon.</p></CardContent></Card>}
          {activeSection === "about" && <Card><CardHeader><CardTitle>About</CardTitle></CardHeader><CardContent><p>what2wear v1.0</p></CardContent></Card>}

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild><Link href="/">Cancel</Link></Button>
            <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]" variant="cta">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}