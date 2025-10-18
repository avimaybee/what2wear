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
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {hourlyData.map((hour, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedHour(idx)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border min-w-[90px] snap-center transition-all",
                    selectedHour === idx
                      ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                      : "bg-card border-border hover:border-primary hover:shadow-md"
                  )}
                  aria-label={`Weather at ${hour.hour}: ${formatTemp(hour.temp)}`}
                  aria-pressed={selectedHour === idx}
                >
                  <span className={cn(
                    "text-xs font-medium",
                    selectedHour === idx && "text-primary-foreground"
                  )}>
                    {hour.hour}
                  </span>
                  {getWeatherIcon(hour.condition, selectedHour === idx)}
                  <span className={cn(
                    "text-sm font-semibold",
                    selectedHour === idx && "text-primary-foreground"
                  )}>
                    {formatTemp(hour.temp)}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* Fade gradient on edges for better UX */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}