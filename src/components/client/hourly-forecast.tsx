"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { formatTemp } from "@/lib/utils";

interface HourlyData {
  hour: string;
  temp: number;
  condition: string;
}

export function HourlyForecast() {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [selectedHour, setSelectedHour] = useState(0);

  useEffect(() => {
    // Generate mock data on the client side to avoid hydration mismatch
    const data = Array.from({ length: 12 }, (_, i) => ({
      hour: `${(new Date().getHours() + i) % 24}:00`,
      temp: 15 + Math.random() * 5,
      condition: i % 3 === 0 ? "sunny" : i % 3 === 1 ? "cloudy" : "partly-cloudy",
    }));
    setHourlyData(data);
  }, []);

  if (hourlyData.length === 0) {
    // You can render a skeleton loader here while waiting for the data
    return (
        <Card>
            <CardHeader>
                <CardTitle>Hourly Forecast</CardTitle>
                <CardDescription>Next 12 hours</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 p-3 rounded-lg border min-w-[80px] bg-card animate-pulse">
                            <div className="h-4 bg-background-tertiary rounded w-10"></div>
                            <div className="h-5 w-5 bg-background-tertiary rounded-full"></div>
                            <div className="h-4 bg-background-tertiary rounded w-8"></div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Forecast</CardTitle>
        <CardDescription>Next 12 hours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {hourlyData.map((hour, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedHour(idx)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border min-w-[80px] transition-all ${
                selectedHour === idx
                  ? "bg-primary text-background border-primary"
                  : "bg-card border-border hover:border-primary"
              }`}
            >
              <span className="text-xs font-medium">{hour.hour}</span>
              <Cloud className="h-5 w-5" />
              <span className="text-sm font-semibold">{formatTemp(hour.temp)}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}