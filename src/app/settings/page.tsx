"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Palette, Lock, Info, Thermometer, Tag, Droplets, Scissors, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type SettingsSection = "preferences" | "appearance" | "privacy" | "about";
type FitPreference = 'Slim' | 'Regular' | 'Oversized';

const PreferenceSelector = ({ 
  title, 
  options, 
  selected, 
  onSelect, 
  variant = 'default' 
}: { 
  title: string, 
  options: string[], 
  selected: string[], 
  onSelect: (value: string) => void, 
  variant?: 'default' | 'destructive' 
}) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <motion.button
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            "px-4 py-2 rounded-xl font-medium text-sm transition-all",
            selected.includes(option)
              ? variant === 'destructive'
                ? "bg-red-500 text-white shadow-md"
                : "bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          whileTap={{ scale: 0.95 }}
        >
          {option}
        </motion.button>
      ))}
    </div>
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>("preferences");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
  const [wardrobeMeta, setWardrobeMeta] = useState<{ styles: string[], colors: string[], materials: string[] }>({ 
    styles: [], 
    colors: [], 
    materials: [] 
  });

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
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          }
        })
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
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

  const sections = [
    { id: "preferences" as const, label: "Preferences", icon: Thermometer },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "privacy" as const, label: "Privacy", icon: Lock },
    { id: "about" as const, label: "About", icon: Info },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </motion.button>
          
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">Customize your outfit recommendations</p>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] h-fit">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <motion.button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all text-left",
                      activeSection === section.id
                        ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon size={20} />
                    <span>{section.label}</span>
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeSection === "preferences" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Fit Preference */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center">
                      <Scissors size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Fit Preference</h2>
                      <p className="text-sm text-gray-600">How do you generally like your clothes to fit?</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(['Slim', 'Regular', 'Oversized'] as FitPreference[]).map((fit) => (
                      <motion.button
                        key={fit}
                        onClick={() => setFitPreference(fit)}
                        className={cn(
                          "px-6 py-3 rounded-2xl font-medium transition-all",
                          fitPreference === fit
                            ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {fit}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Silhouette Preference */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Silhouette</h2>
                      <p className="text-sm text-gray-600">Which silhouette best represents you?</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(['male', 'female', 'other'] as const).map((s) => (
                      <motion.button
                        key={s}
                        onClick={() => setSilhouette(s)}
                        className={cn(
                          "px-6 py-3 rounded-2xl font-medium transition-all",
                          silhouette === s
                            ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {s === 'other' ? 'Other / Prefer not to say' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Temperature Sensitivity */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center">
                      <Thermometer size={20} className="text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Temperature Sensitivity</h2>
                      <p className="text-sm text-gray-600">How sensitive are you to temperature?</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="1"
                      value={temperatureSensitivity}
                      onChange={(e) => setTemperatureSensitivity(Number(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-200 via-gray-200 to-red-200 rounded-full appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Very Cold</span>
                      <span className="font-semibold text-gray-900">{getSensitivityLabel(temperatureSensitivity)}</span>
                      <span>Very Warm</span>
                    </div>
                  </div>
                </div>

                {/* Style Preferences */}
                {wardrobeMeta.styles.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                        <Tag size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Style Preferences</h2>
                        <p className="text-sm text-gray-600">Select styles you prefer or want to avoid</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <PreferenceSelector 
                        title="Preferred Styles" 
                        options={wardrobeMeta.styles} 
                        selected={preferredStyles} 
                        onSelect={(val) => handleSelect('styles', 'preferred', val)} 
                      />
                      <PreferenceSelector 
                        title="Disliked Styles" 
                        options={wardrobeMeta.styles} 
                        selected={dislikedStyles} 
                        onSelect={(val) => handleSelect('styles', 'disliked', val)} 
                        variant="destructive" 
                      />
                    </div>
                  </div>
                )}

                {/* Color Preferences */}
                {wardrobeMeta.colors.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center">
                        <Palette size={20} className="text-pink-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Color Preferences</h2>
                        <p className="text-sm text-gray-600">Select colors you prefer or want to avoid</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <PreferenceSelector 
                        title="Preferred Colors" 
                        options={wardrobeMeta.colors} 
                        selected={preferredColors} 
                        onSelect={(val) => handleSelect('colors', 'preferred', val)} 
                      />
                      <PreferenceSelector 
                        title="Disliked Colors" 
                        options={wardrobeMeta.colors} 
                        selected={dislikedColors} 
                        onSelect={(val) => handleSelect('colors', 'disliked', val)} 
                        variant="destructive" 
                      />
                    </div>
                  </div>
                )}

                {/* Material Preferences */}
                {wardrobeMeta.materials.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl flex items-center justify-center">
                        <Droplets size={20} className="text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Material Preferences</h2>
                        <p className="text-sm text-gray-600">Select materials you prefer or want to avoid</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <PreferenceSelector 
                        title="Preferred Materials" 
                        options={wardrobeMeta.materials} 
                        selected={preferredMaterials} 
                        onSelect={(val) => handleSelect('materials', 'preferred', val)} 
                      />
                      <PreferenceSelector 
                        title="Disliked Materials" 
                        options={wardrobeMeta.materials} 
                        selected={dislikedMaterials} 
                        onSelect={(val) => handleSelect('materials', 'disliked', val)} 
                        variant="destructive" 
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === "appearance" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
              >
                <h2 className="text-2xl font-bold mb-4">Appearance</h2>
                <p className="text-gray-600">Theme and display settings coming soon...</p>
              </motion.div>
            )}

            {activeSection === "privacy" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
              >
                <h2 className="text-2xl font-bold mb-4">Privacy</h2>
                <p className="text-gray-600">Privacy settings coming soon...</p>
              </motion.div>
            )}

            {activeSection === "about" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
              >
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <div className="space-y-3 text-gray-600">
                  <p><strong>App:</strong> What2Wear</p>
                  <p><strong>Version:</strong> 1.0.0</p>
                  <p><strong>Description:</strong> AI-powered outfit recommendations based on weather and your wardrobe</p>
                </div>
              </motion.div>
            )}

            {/* Save Button */}
            <motion.button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-3xl font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
              whileTap={{ scale: 0.98 }}
            >
              <Save size={24} />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
