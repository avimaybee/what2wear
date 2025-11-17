/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle } from "lucide-react";
import { formatTemp, cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface HourlyData {
  hour: string;
  temp: number;
  condition: string;
}

interface HourlyForecastProps {
  location: { lat: number; lon: number };
}

const getWeatherIcon = (condition: string, isSelected: boolean) => {
  const className = cn(
    "h-6 w-6 transition-all",
    isSelected && "text-primary-foreground"
  );
  
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
    return <Sun className={className} />;
  }
  if (conditionLower.includes("rain")) {
    return <CloudRain className={className} />;
  }
  if (conditionLower.includes("snow")) {
    return <CloudSnow className={className} />;
  }
  if (conditionLower.includes("cloud")) {
    return <Cloud className={className} />;
  }
  return <CloudDrizzle className={className} />;
};

export function HourlyForecast({ location }: HourlyForecastProps) {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [selectedHour, setSelectedHour] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHourlyForecast = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/weather?lat=${location.lat}&lon=${location.lon}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();

        if (!data.success || !data.data.hourly_forecast) {
          throw new Error("No hourly forecast data available");
        }

        // Format hourly forecast data
        const forecast = data.data.hourly_forecast.slice(0, 12).map((hour: any) => ({
          hour: new Date(hour.timestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric',
            hour12: true 
          }),
          temp: hour.temperature,
          condition: hour.weather_condition || hour.condition,
        }));

        setHourlyData(forecast);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching hourly forecast:", err);
        setError(err instanceof Error ? err.message : "Failed to load forecast");
        setLoading(false);
      }
    };

    if (location) {
      fetchHourlyForecast();
    }
  }, [location]);

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hourlyData.length === 0) return;
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedHour((prev) => (prev > 0 ? prev - 1 : hourlyData.length - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedHour((prev) => (prev < hourlyData.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hourlyData.length]);

  if (loading || hourlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Hourly Forecast
          </CardTitle>
          <CardDescription>
            {loading ? "Loading forecast..." : error ? "Unable to load forecast" : "Next 12 hours"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2">Weather data may be temporarily unavailable</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 p-4 rounded-lg border min-w-[90px] snap-center">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-5 w-10" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Hourly Forecast
          </CardTitle>
          <CardDescription>Next 12 hours - Tap to see details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              className="flex gap-3 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide snap-x snap-mandatory"
              role="radiogroup"
              aria-label="Hourly weather forecast"
            >
              {hourlyData.map((hour, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedHour(idx)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.15,
                    delay: idx * 0.03,
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border min-w-[90px] snap-center transition-all duration-200 shrink-0",
                    selectedHour === idx
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border hover:bg-accent"
                  )}
                  role="radio"
                  aria-checked={selectedHour === idx}
                  aria-label={`${hour.hour}, ${formatTemp(hour.temp)}, ${hour.condition}. ${selectedHour === idx ? 'Selected' : 'Select for details'}`}
                  tabIndex={selectedHour === idx ? 0 : -1}
                >
                  <span className={cn(
                    "text-xs font-medium transition-all",
                    selectedHour === idx && "text-primary-foreground font-bold"
                  )}>
                    {hour.hour}
                  </span>
                  <motion.div
                    animate={selectedHour === idx ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {getWeatherIcon(hour.condition, selectedHour === idx)}
                  </motion.div>
                  <span className={cn(
                    "text-sm font-semibold transition-all",
                    selectedHour === idx && "text-primary-foreground font-bold text-base"
                  )}>
                    {formatTemp(hour.temp)}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* Edge fade gradients to indicate scrollable area */}
            <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-background via-background/60 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background via-background/60 to-transparent pointer-events-none" />
          </div>
          
          {/* Keyboard hint */}
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Use <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">←</kbd> <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">→</kbd> keys to navigate
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}