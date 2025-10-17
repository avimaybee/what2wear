"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Wind, Sun, Droplets, AlertTriangle } from "lucide-react";
import { formatTemp } from "@/lib/utils";
import type { IRecommendation } from "@/types";
import { HourlyForecast } from "@/components/client/hourly-forecast";

interface DashboardClientProps {
  recommendation: IRecommendation;
}

export const DashboardClient = ({ recommendation }: DashboardClientProps) => {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleWearOutfit = async () => {
    const itemIds = recommendation.outfit.map((item) => item.id);
    console.log("Logging outfit:", itemIds);
    alert("Outfit logged successfully!");
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    console.log(`Feedback: ${type}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-foreground-secondary">Your AI-powered outfit companion</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-3xl">Today&apos;s Outfit</CardTitle>
              <CardDescription>{recommendation.reasoning}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {recommendation.outfit.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
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
              <div className="flex flex-col gap-3">
                <Button size="lg" onClick={handleWearOutfit} className="w-full text-lg">
                  Wear This Outfit
                </Button>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <span className="text-sm text-foreground-secondary">How does this look?</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant={feedback === "up" ? "secondary" : "outline"}
                      onClick={() => handleFeedback("up")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={feedback === "down" ? "secondary" : "outline"}
                      onClick={() => handleFeedback("down")}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Context & Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary mb-2">Dress Code</p>
                <Badge className="text-base px-4 py-2">
                  {recommendation.dress_code}
                </Badge>
              </div>
              {recommendation.constraint_alerts.length > 0 && (
                <div>
                  <p className="text-sm text-foreground-secondary mb-2">Today&apos;s Schedule</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.constraint_alerts.map((alert, idx) => (
                      <Badge key={idx} variant="outline" className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        {alert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {recommendation.weather_alerts && recommendation.weather_alerts.length > 0 && (
                <div>
                  <p className="text-sm text-foreground-secondary mb-2">Weather Alerts</p>
                  <div className="space-y-2">
                    {recommendation.weather_alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md border border-secondary/50 bg-secondary/20"
                      >
                        <p className="text-sm font-medium text-foreground">{alert.message}</p>
                        {alert.recommendation && (
                          <p className="text-xs text-foreground-secondary mt-1">
                            {alert.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <HourlyForecast />
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Weather Now</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <p className="text-sm text-foreground-secondary mb-2">Feels Like</p>
                <p className="text-6xl font-bold text-primary">
                  {formatTemp(recommendation.temp_feels_like)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg">
                  <Wind className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-foreground-secondary">AQI</p>
                  <p className="text-2xl font-bold mt-1">{recommendation.aqi}</p>
                  <p className="text-xs text-foreground-secondary mt-1">Good</p>
                </div>
                <div className="p-4 rounded-lg">
                  <Sun className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-foreground-secondary">UV Index</p>
                  <p className="text-2xl font-bold mt-1">{recommendation.uv_index}</p>
                  <p className="text-xs text-foreground-secondary mt-1">Moderate</p>
                </div>
                <div className="p-4 rounded-lg col-span-2">
                  <Droplets className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-foreground-secondary">Pollen Count</p>
                  <p className="text-2xl font-bold mt-1">{recommendation.pollen_count.toFixed(1)}</p>
                  <p className="text-xs text-foreground-secondary mt-1">Low</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};