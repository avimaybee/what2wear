"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  // Mock initial settings - In production, fetch from GET /api/settings/profile
  const [temperatureSensitivity, setTemperatureSensitivity] = useState(0);
  const [varietyDays, setVarietyDays] = useState(7);
  const [name, setName] = useState("John Doe");
  const [region, setRegion] = useState("New York, USA");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // In production, this would call PUT /api/settings/profile
    const settings = {
      name,
      region,
      preferences: {
        temperature_sensitivity: temperatureSensitivity,
        variety_days: varietyDays,
      },
    };
    console.log("Saving settings:", settings);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Settings saved successfully!");
  };

  const getSensitivityLabel = (value: number) => {
    if (value <= -2) return "Very Cold";
    if (value === -1) return "Cold";
    if (value === 0) return "Neutral";
    if (value === 1) return "Warm";
    return "Very Warm";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-1">Settings</h1>
        <p className="text-foreground-secondary">Personalize your setmyfit experience</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <p className="text-xs text-foreground-secondary">
              Used for weather and location-based recommendations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Sensitivity */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature Sensitivity</CardTitle>
          <CardDescription>
            How do you typically feel about temperature?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">Current Setting:</span>
              <Badge className="text-base px-4 py-1">
                {getSensitivityLabel(temperatureSensitivity)}
              </Badge>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="-2"
                max="2"
                step="1"
                value={temperatureSensitivity}
                onChange={(e) => setTemperatureSensitivity(Number(e.target.value))}
                className="w-full h-2 bg-card rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-foreground-secondary">
                <span>Very Cold</span>
                <span>Neutral</span>
                <span>Very Warm</span>
              </div>
            </div>

            <p className="text-sm text-foreground-secondary bg-card p-3 rounded-md border border-border">
              {temperatureSensitivity < 0 && "You prefer warmer clothing. Recommendations will include more insulation."}
              {temperatureSensitivity === 0 && "You have neutral temperature preferences. Recommendations follow standard guidelines."}
              {temperatureSensitivity > 0 && "You prefer cooler clothing. Recommendations will include lighter layers."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Variety Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Variety Preference</CardTitle>
          <CardDescription>
            How often do you want to see different outfits?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variety-days">
              Don&apos;t recommend items worn in the last:
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="variety-days"
                type="number"
                min="1"
                max="30"
                value={varietyDays}
                onChange={(e) => setVarietyDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                className="w-24 text-center font-semibold"
              />
              <span className="text-foreground">days</span>
            </div>
            <p className="text-xs text-foreground-secondary">
              Higher values ensure more variety in your daily recommendations (1-30 days)
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground-secondary">Quick Presets:</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={varietyDays === 3 ? "secondary" : "outline"}
                onClick={() => setVarietyDays(3)}
              >
                3 days
              </Button>
              <Button
                size="sm"
                variant={varietyDays === 7 ? "secondary" : "outline"}
                onClick={() => setVarietyDays(7)}
              >
                1 week
              </Button>
              <Button
                size="sm"
                variant={varietyDays === 14 ? "secondary" : "outline"}
                onClick={() => setVarietyDays(14)}
              >
                2 weeks
              </Button>
              <Button
                size="sm"
                variant={varietyDays === 30 ? "secondary" : "outline"}
                onClick={() => setVarietyDays(30)}
              >
                1 month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/">Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
