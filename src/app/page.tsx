"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Cloud, Wind, Sun, Droplets, AlertTriangle } from "lucide-react";
import { formatTemp } from "@/lib/utils";
import type { IRecommendation } from "@/types";
import { HourlyForecast } from "@/components/client/hourly-forecast";

// Mock data for demonstration - In production, this would come from API calls
const mockRecommendation: IRecommendation = {
  id: "rec-1",
  outfit: [
    {
      id: 1,
      user_id: "user-1",
      name: "Navy Blazer",
      type: "Outerwear" as const,
      material: "Wool" as const,
      insulation_value: 7,
      last_worn_date: "2025-10-10T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop",
      color: "Navy",
      season_tags: ["Fall", "Winter"],
      style_tags: ["Business", "Formal"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
    {
      id: 2,
      user_id: "user-1",
      name: "White Oxford Shirt",
      type: "Top" as const,
      material: "Cotton" as const,
      insulation_value: 3,
      last_worn_date: "2025-10-12T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop",
      color: "White",
      season_tags: ["All Season"],
      style_tags: ["Business", "Classic"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
    {
      id: 3,
      user_id: "user-1",
      name: "Charcoal Trousers",
      type: "Bottom" as const,
      material: "Wool" as const,
      insulation_value: 4,
      last_worn_date: "2025-10-11T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop",
      color: "Charcoal",
      season_tags: ["All Season"],
      style_tags: ["Business", "Classic"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
    {
      id: 4,
      user_id: "user-1",
      name: "Brown Leather Shoes",
      type: "Footwear" as const,
      material: "Leather" as const,
      insulation_value: 2,
      last_worn_date: "2025-10-09T00:00:00.000Z",
      image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=400&fit=crop",
      color: "Brown",
      season_tags: ["All Season"],
      style_tags: ["Business", "Classic"],
      dress_code: ["Business Casual" as const, "Formal" as const],
      created_at: "2025-01-01T00:00:00.000Z",
    },
  ],
  reasoning: "Optimal outfit for today's business meeting. Temperature is cool with light wind, requiring a moderate layer. UV index is low, minimal sun protection needed.",
  constraint_alerts: ["Business Meeting at 2 PM", "Moderate UV Index"],
  temp_feels_like: 16.5,
  aqi: 45,
  uv_index: 4,
  pollen_count: 3.2,
  dress_code: "Business Casual" as const,
  weather_alerts: [
    {
      type: "UV" as const,
      severity: "moderate" as const,
      message: "Moderate UV index detected",
      recommendation: "Consider wearing sunglasses for extended outdoor exposure.",
    },
  ],
};

export default function HomePage() {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleWearOutfit = async () => {
    // In production, this would call POST /api/outfit/log
    const itemIds = mockRecommendation.outfit.map((item) => item.id);
    console.log("Logging outfit:", itemIds);
    alert("Outfit logged successfully!");
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    // In production, this would call POST /api/recommendation/[id]/feedback
    console.log(`Feedback: ${type}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">What2Wear</h1>
            <p className="text-foreground-secondary">Your AI-powered outfit companion</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/wardrobe">Wardrobe</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">Settings</Link>
            </Button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Card - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Outfit Recommendation Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-background-secondary">
                <CardTitle className="text-3xl">Today&apos;s Outfit</CardTitle>
                <CardDescription>{mockRecommendation.reasoning}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Outfit Items Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {mockRecommendation.outfit.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-background-secondary border border-border hover:border-primary transition-all"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-semibold text-sm">{item.name}</p>
                          <p className="text-white/70 text-xs">{item.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button size="lg" onClick={handleWearOutfit} className="w-full text-lg">
                    Wear This Outfit
                  </Button>
                  
                  {/* Feedback Section */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <span className="text-sm text-foreground-secondary">How does this look?</span>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant={feedback === "up" ? "default" : "outline"}
                        onClick={() => handleFeedback("up")}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={feedback === "down" ? "default" : "outline"}
                        onClick={() => handleFeedback("down")}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Context Card */}
            <Card>
              <CardHeader>
                <CardTitle>Context & Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dress Code */}
                <div>
                  <p className="text-sm text-foreground-secondary mb-2">Dress Code</p>
                  <Badge variant="default" className="text-base px-4 py-2">
                    {mockRecommendation.dress_code}
                  </Badge>
                </div>

                {/* Constraint Alerts */}
                {mockRecommendation.constraint_alerts.length > 0 && (
                  <div>
                    <p className="text-sm text-foreground-secondary mb-2">Today&apos;s Schedule</p>
                    <div className="flex flex-wrap gap-2">
                      {mockRecommendation.constraint_alerts.map((alert, idx) => (
                        <Badge key={idx} variant="outline" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {alert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weather Alerts */}
                {mockRecommendation.weather_alerts && mockRecommendation.weather_alerts.length > 0 && (
                  <div>
                    <p className="text-sm text-foreground-secondary mb-2">Weather Alerts</p>
                    <div className="space-y-2">
                      {mockRecommendation.weather_alerts.map((alert, idx) => {
                        const isHigh = alert.severity === "high";
                        const isModerate = alert.severity === "moderate";
                        const severityStyles = 
                          isHigh
                            ? "bg-red-500/10 border-red-500/30" 
                            : isModerate
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-blue-500/10 border-blue-500/30";
                        
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-md border ${severityStyles}`}
                          >
                            <p className="text-sm font-medium">{alert.message}</p>
                            {alert.recommendation && (
                              <p className="text-xs text-foreground-secondary mt-1">
                                {alert.recommendation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hourly Timeline */}
            <HourlyForecast />
          </div>

          {/* Weather Card - Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weather Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Feels Like Temperature */}
                <div className="text-center py-4">
                  <p className="text-sm text-foreground-secondary mb-2">Feels Like</p>
                  <p className="text-6xl font-bold text-primary">
                    {formatTemp(mockRecommendation.temp_feels_like)}
                  </p>
                </div>

                {/* Weather Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  {/* AQI */}
                  <div className="flex flex-col items-center p-4 rounded-lg bg-background-secondary">
                    <Wind className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs text-foreground-secondary">AQI</p>
                    <p className="text-2xl font-bold mt-1">{mockRecommendation.aqi}</p>
                    <p className="text-xs text-green-400 mt-1">Good</p>
                  </div>

                  {/* UV Index */}
                  <div className="flex flex-col items-center p-4 rounded-lg bg-background-secondary">
                    <Sun className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs text-foreground-secondary">UV Index</p>
                    <p className="text-2xl font-bold mt-1">{mockRecommendation.uv_index}</p>
                    <p className="text-xs text-yellow-400 mt-1">Moderate</p>
                  </div>

                  {/* Pollen */}
                  <div className="flex flex-col items-center p-4 rounded-lg bg-background-secondary col-span-2">
                    <Droplets className="h-6 w-6 text-primary mb-2" />
                    <p className="text-xs text-foreground-secondary">Pollen Count</p>
                    <p className="text-2xl font-bold mt-1">{mockRecommendation.pollen_count.toFixed(1)}</p>
                    <p className="text-xs text-green-400 mt-1">Low</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
