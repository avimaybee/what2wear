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

const getWeatherIcon = (condition: string, isSelected: boolean) => {
  const className = cn(
    "h-6 w-6 transition-all",
    isSelected && "text-primary-foreground"
  );
  
  switch (condition) {
    case "sunny":
      return <Sun className={className} />;
    case "cloudy":
      return <Cloud className={className} />;
    case "rainy":
      return <CloudRain className={className} />;
    case "snow":
      return <CloudSnow className={className} />;
    default:
      return <CloudDrizzle className={className} />;
  }
};

export function HourlyForecast() {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [selectedHour, setSelectedHour] = useState(0);

  useEffect(() => {
    // Generate mock data on the client side to avoid hydration mismatch
    const conditions = ["sunny", "cloudy", "partly-cloudy", "rainy", "cloudy"];
    const data = Array.from({ length: 12 }, (_, i) => ({
      hour: `${(new Date().getHours() + i) % 24}:00`,
      temp: 15 + Math.random() * 5,
      condition: conditions[i % conditions.length],
    }));
    setHourlyData(data);
  }, []);

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

  if (hourlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Hourly Forecast
          </CardTitle>
          <CardDescription>Next 12 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 p-4 rounded-lg border min-w-[90px] snap-center">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
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
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
              role="radiogroup"
              aria-label="Hourly weather forecast"
            >
              {hourlyData.map((hour, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedHour(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: selectedHour === idx ? 1.05 : 1 }}
                  transition={{ 
                    duration: 0.2,
                    delay: idx * 0.05,
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border min-w-[90px] snap-center transition-all duration-200",
                    selectedHour === idx
                      ? "bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-card border-border hover:border-primary hover:shadow-md hover:scale-[1.02]"
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
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
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
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background via-background/50 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/50 to-transparent pointer-events-none" />
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