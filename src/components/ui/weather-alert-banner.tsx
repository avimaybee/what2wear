"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CloudRain, Thermometer, Wind, AlertTriangle, CloudSnow, Sun, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WeatherAlertData {
  id: string;
  type: "rain" | "temperature_drop" | "temperature_rise" | "wind" | "snow" | "severe";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  suggestion?: string;
  actionable?: boolean;
}

interface WeatherAlertBannerProps {
  alerts: WeatherAlertData[];
  onDismiss?: (alertId: string) => void;
  className?: string;
}

const alertIcons = {
  rain: CloudRain,
  temperature_drop: Thermometer,
  temperature_rise: Sun,
  wind: Wind,
  snow: CloudSnow,
  severe: AlertTriangle,
};

const severityStyles = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-100",
    badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-900 dark:text-red-100",
    badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    icon: "text-red-600 dark:text-red-400",
  },
};

export function WeatherAlertBanner({ alerts, onDismiss, className }: WeatherAlertBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dismissed_weather_alerts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only keep alerts dismissed today
        const today = new Date().toDateString();
        const validDismissals = Object.keys(parsed).filter(
          (key) => parsed[key] === today
        );
        setDismissedAlerts(new Set(validDismissals));
      } catch (e) {
        console.error("Failed to parse dismissed alerts:", e);
      }
    }
  }, []);

  const handleDismiss = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);

    // Store in localStorage with today's date
    const stored = localStorage.getItem("dismissed_weather_alerts");
    const dismissalMap: Record<string, string> = stored ? JSON.parse(stored) : {};
    dismissalMap[alertId] = new Date().toDateString();
    localStorage.setItem("dismissed_weather_alerts", JSON.stringify(dismissalMap));

    onDismiss?.(alertId);
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          const styles = severityStyles[alert.severity];

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={cn(
                  "border-l-4 p-4",
                  styles.bg,
                  styles.border
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <Icon className={cn("h-5 w-5", styles.icon)} aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn("text-sm font-semibold", styles.text)}>
                        {alert.title}
                      </h3>
                      <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                        {alert.severity === "critical" ? "Urgent" : alert.severity === "warning" ? "Warning" : "Info"}
                      </Badge>
                    </div>
                    <p className={cn("text-sm", styles.text, "opacity-90")}>
                      {alert.message}
                    </p>
                    {alert.suggestion && (
                      <p className={cn("text-sm mt-2", styles.text, "opacity-75")}>
                        💡 {alert.suggestion}
                      </p>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className={cn(
                      "flex-shrink-0 p-1 rounded-md transition-colors",
                      "hover:bg-black/5 dark:hover:bg-white/5",
                      styles.text
                    )}
                    aria-label={`Dismiss ${alert.title} alert`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Helper function to generate weather alerts from weather data
export function generateWeatherAlerts(weather: {
  precipitation_probability?: number;
  temperature_2m?: number;
  wind_speed_10m?: number;
  uv_index?: number;
  temperature_change?: number;
  wind_speed?: number;
  weather_code?: number;
  feels_like?: number;
}): WeatherAlertData[] {
  const alerts: WeatherAlertData[] = [];
  
  // Rain alert
  if (weather.precipitation_probability && weather.precipitation_probability > 60) {
    alerts.push({
      id: `rain-${new Date().toDateString()}`,
      type: "rain",
      severity: weather.precipitation_probability > 80 ? "warning" : "info",
      title: weather.precipitation_probability > 80 ? "Heavy Rain Expected" : "Rain Likely Today",
      message: `${weather.precipitation_probability}% chance of rain. Consider waterproof clothing.`,
      suggestion: "Bring a water-resistant jacket or umbrella. Choose waterproof footwear.",
      actionable: true,
    });
  }

  // Temperature drop alert
  if (weather.temperature_change && weather.temperature_change < -5) {
    alerts.push({
      id: `temp-drop-${new Date().toDateString()}`,
      type: "temperature_drop",
      severity: weather.temperature_change < -10 ? "warning" : "info",
      title: "Significant Temperature Drop",
      message: `Temperature dropping by ${Math.abs(weather.temperature_change)}°C today.`,
      suggestion: "Layer up! Consider bringing an extra layer or jacket.",
      actionable: true,
    });
  }

  // Temperature rise alert
  if (weather.temperature_change && weather.temperature_change > 5) {
    alerts.push({
      id: `temp-rise-${new Date().toDateString()}`,
      type: "temperature_rise",
      severity: "info",
      title: "Warmer Than Expected",
      message: `Temperature rising by ${weather.temperature_change}°C today.`,
      suggestion: "Dress lighter than usual. Consider breathable fabrics.",
      actionable: true,
    });
  }

  // High wind alert
  if (weather.wind_speed && weather.wind_speed > 30) {
    alerts.push({
      id: `wind-${new Date().toDateString()}`,
      type: "wind",
      severity: weather.wind_speed > 50 ? "warning" : "info",
      title: "High Winds Today",
      message: `Wind speeds up to ${weather.wind_speed} km/h expected.`,
      suggestion: "Secure loose clothing. Avoid wide-brimmed hats.",
      actionable: true,
    });
  }

  // Snow alert
  if (weather.weather_code && (weather.weather_code >= 71 && weather.weather_code <= 77)) {
    alerts.push({
      id: `snow-${new Date().toDateString()}`,
      type: "snow",
      severity: "warning",
      title: "Snow Expected",
      message: "Snowfall expected today. Roads may be slippery.",
      suggestion: "Wear warm, waterproof boots. Layer clothing for warmth.",
      actionable: true,
    });
  }

  // Severe weather alert
  if (weather.weather_code && weather.weather_code >= 95) {
    alerts.push({
      id: `severe-${new Date().toDateString()}`,
      type: "severe",
      severity: "critical",
      title: "Severe Weather Warning",
      message: "Thunderstorms or severe weather expected. Stay safe indoors if possible.",
      suggestion: "Avoid outdoor activities. Wear appropriate rain gear if you must go out.",
      actionable: true,
    });
  }

  // Cold weather alert (feels like temp)
  if (weather.feels_like && weather.feels_like < 0) {
    alerts.push({
      id: `cold-${new Date().toDateString()}`,
      type: "temperature_drop",
      severity: weather.feels_like < -10 ? "warning" : "info",
      title: "Freezing Temperatures",
      message: `Feels like ${Math.round(weather.feels_like)}°C. Dress warmly.`,
      suggestion: "Wear insulated layers, gloves, and a warm hat. Protect exposed skin.",
      actionable: true,
    });
  }

  // Hot weather alert
  if (weather.feels_like && weather.feels_like > 30) {
    alerts.push({
      id: `hot-${new Date().toDateString()}`,
      type: "temperature_rise",
      severity: weather.feels_like > 35 ? "warning" : "info",
      title: "High Temperatures",
      message: `Feels like ${Math.round(weather.feels_like)}°C. Stay cool and hydrated.`,
      suggestion: "Wear light, breathable fabrics. Avoid dark colors. Stay hydrated.",
      actionable: true,
    });
  }

  return alerts;
}
