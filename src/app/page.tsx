"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardClient } from "@/components/client/dashboard-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, LogIn } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [recommendationData, setRecommendationData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);

  // Request user location
  const requestLocation = () => {
    setRequestingLocation(true);
    setError(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(coords);
          localStorage.setItem("userLocation", JSON.stringify(coords));
          setRequestingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default location (New York)
          const defaultLocation = { lat: 40.7128, lon: -74.0060 };
          setLocation(defaultLocation);
          setRequestingLocation(false);
          toast("Using default location (New York)", { icon: "📍" });
        }
      );
    } else {
      // Fallback if geolocation not supported
      const defaultLocation = { lat: 40.7128, lon: -74.0060 };
      setLocation(defaultLocation);
      setRequestingLocation(false);
      toast("Geolocation not supported. Using New York.", { icon: "📍" });
    }
  };

  // Fetch outfit recommendation
  const fetchRecommendation = async (coords: { lat: number; lon: number }) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in to get outfit recommendations");
        setIsAuthError(true);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(coords),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendation: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to generate recommendation");
      }

      setRecommendationData(data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setError(err instanceof Error ? err.message : "Failed to load recommendation");
      setLoading(false);
      toast.error("Failed to generate outfit. Please try again.");
    }
  };

  // Initialize: Get location and fetch recommendation
  useEffect(() => {
    // Try to get saved location first
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const coords = JSON.parse(savedLocation);
        setLocation(coords);
        return;
      } catch {
        // Invalid saved location, request new one
      }
    }
    
    // Request location on mount
    requestLocation();
  }, []);

  // Fetch recommendation when location changes
  useEffect(() => {
    if (location) {
      fetchRecommendation(location);
    }
  }, [location]);

  // Loading state
  if (loading || !location) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))}
                  </div>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">
              {isAuthError ? "Authentication Required" : "Oops! Something went wrong"}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              {isAuthError ? (
                <Button
                  onClick={() => router.push("/auth/sign-in")}
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => location && fetchRecommendation(location)}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={requestLocation}
                    variant="outline"
                    className="flex-1"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Change Location
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success - show dashboard with real data
  return (
    <div className="min-h-screen bg-background">
      <DashboardClient 
        recommendationData={recommendationData}
        location={location}
        onLocationChange={requestLocation}
        onRefresh={() => location && fetchRecommendation(location)}
      />
    </div>
  );
}