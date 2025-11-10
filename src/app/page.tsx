"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, AlertCircle, LogIn, Shirt } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";

// Lazy load heavy components
const DashboardClient = lazy(() => 
  import("@/components/client/dashboard-client").then(mod => ({ default: mod.DashboardClient }))
);

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [recommendationData, setRecommendationData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  // Request user location
  const requestLocation = () => {
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
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default location (New York)
          const defaultLocation = { lat: 40.7128, lon: -74.0060 };
          setLocation(defaultLocation);
          toast("Using default location (New York)", { icon: "📍" });
        }
      );
    } else {
      // Fallback if geolocation not supported
      const defaultLocation = { lat: 40.7128, lon: -74.0060 };
      setLocation(defaultLocation);
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
      
      // Handle empty/insufficient wardrobe gracefully - this is expected for new users
      if (!data.success && data.needsWardrobe) {
        setError(data.message || "Add clothing items to your wardrobe to get started!");
        setLoading(false);
        // Don't show error toast for empty wardrobe - it's expected for new users
        return;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Failed to generate recommendation");
      }

      setRecommendationData(data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setError(err instanceof Error ? err.message : "Failed to load recommendation");
      setLoading(false);
      // Only show error toast for actual errors, not empty wardrobe
      if (err instanceof Error && !err.message.toLowerCase().includes("wardrobe")) {
        toast.error("Failed to generate outfit. Please try again.");
      }
    }
  };

  // Initialize: Get location and fetch recommendation
  useEffect(() => {
    const init = () => {
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        try {
          const coords = JSON.parse(savedLocation);
          setLocation(coords);
          fetchRecommendation(coords); // Fetch on load with saved location
          return;
        } catch {
          // Invalid saved location, request new one
        }
      }
      requestLocation();
    };
    init();
  }, []); // Run only once on mount

  // This effect is now primarily for when the user MANUALLY changes location
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
    const isWardrobeError = error.toLowerCase().includes("wardrobe") || 
                           error.toLowerCase().includes("clothes") ||
                           error.toLowerCase().includes("top") ||
                           error.toLowerCase().includes("bottom") ||
                           error.toLowerCase().includes("shoes");
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {isAuthError ? (
            <EmptyState
              icon={LogIn}
              title="Authentication Required"
              description="Please sign in to get personalized outfit recommendations based on your wardrobe and preferences."
              actions={[
                {
                  label: "Sign In",
                  onClick: () => router.push("/auth/sign-in"),
                  icon: LogIn,
                  variant: "default"
                }
              ]}
              tips={[
                "Create your account in seconds",
                "Build your digital wardrobe",
                "Get AI-powered outfit suggestions",
                "Track your style over time"
              ]}
              variant="illustrated"
            />
          ) : isWardrobeError ? (
            <EmptyState
              icon={Shirt}
              title="Let's Build Your Digital Wardrobe!"
              description={error}
              actions={[
                {
                  label: "Add Clothing Items",
                  onClick: () => router.push("/wardrobe"),
                  icon: Shirt,
                  variant: "default"
                },
                {
                  label: "Take a Quick Tour",
                  onClick: () => router.push("/onboarding"),
                  variant: "outline"
                }
              ]}
              tips={[
                "Snap photos of your favorite clothes",
                "AI will detect colors, materials, and styles",
                "Get weather-based outfit suggestions",
                "Track what you wear and when"
              ]}
              variant="illustrated"
            />
          ) : (
            <EmptyState
              icon={AlertCircle}
              title="Oops! Something Went Wrong"
              description={error}
              actions={[
                {
                  label: "Try Again",
                  onClick: () => location && fetchRecommendation(location),
                  variant: "default"
                },
                {
                  label: "Change Location",
                  onClick: requestLocation,
                  icon: MapPin,
                  variant: "outline"
                }
              ]}
              variant="default"
            />
          )}
        </div>
      </div>
    );
  }

  // Success - show dashboard with real data
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      }>
        <DashboardClient 
          recommendationData={recommendationData}
          location={location}
          onLocationChange={requestLocation}
          onRefresh={() => location && fetchRecommendation(location)}
        />
      </Suspense>
    </div>
  );
}