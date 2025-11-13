"use client";

import { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, AlertCircle, LogIn, Shirt } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";
import { Hero } from "@/components/hero/Hero";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingWizard } from "@/components/onboarding";

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
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasWardrobe, setHasWardrobe] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
          toast(`Location detected: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`, { icon: "📍" });
        },
        (error) => {
          let errorMsg = "Location access denied";
          if (error.code === 1) errorMsg = "Location permission denied";
          if (error.code === 2) errorMsg = "Location unavailable";
          if (error.code === 3) errorMsg = "Location timeout";
          
          // Fallback to default location (New York)
          const defaultLocation = { lat: 40.7128, lon: -74.0060 };
          setLocation(defaultLocation);
          toast(`${errorMsg}. Using New York instead.`, { icon: "⚠️" });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
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
  const fetchRecommendation = useCallback(async (coords: { lat: number; lon: number }, retryCount = 0) => {
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(coords),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendation: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle empty/insufficient wardrobe gracefully - this is expected for new users
      if (!data.success && data.needsWardrobe) {
        setHasWardrobe(false);
        
        // Check if the error mentions missing types - if so, try to fix them automatically
        if (retryCount === 0 && (data.message?.toLowerCase().includes('type') || data.message?.toLowerCase().includes('category'))) {
          try {
            const fixResponse = await fetch("/api/wardrobe/fix-types", {
              method: "POST",
            });
            const fixData = await fixResponse.json();
            
            if (fixData.success && fixData.fixed > 0) {
              toast(`Fixed ${fixData.fixed} wardrobe items, trying again...`, { icon: "🔧" });
              // Retry once after fixing
              return fetchRecommendation(coords, retryCount + 1);
            }
          } catch (fixError) {
            // Silent fail - will show empty state instead
          }
        }
        
        setError(data.message || "Add clothing items to your wardrobe to get started!");
        setLoading(false);
        // Don't show error toast for empty wardrobe - it's expected for new users
        return;
      }
      
      if (!data.success) {
        throw new Error(data.error || "Failed to generate recommendation");
      }

      setHasWardrobe(true);
      setRecommendationData(data.data);
      setLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load recommendation";
      
      // Handle timeout separately
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Recommendation request timed out. Please try again.");
        toast.error("Request took too long. Please try again.");
      } else {
        setError(errorMsg);
        // Only show error toast for actual errors, not empty wardrobe
        if (!errorMsg.toLowerCase().includes("wardrobe")) {
          toast.error("Failed to generate outfit. Please try again.");
        }
      }
      setLoading(false);
    }
  }, []);

  // Initialize: Get location and fetch recommendation
  useEffect(() => {
    const init = async () => {
      // Check authentication status first
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
      }
      
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        try {
          const coords = JSON.parse(savedLocation);
          setLocation(coords);
          return; // Don't fetch yet, wait for useEffect below
        } catch {
          // Invalid saved location, request new one
        }
      }
      requestLocation();
      
      // Safety timeout: If no location after 15 seconds, use default
      const safetyTimer = setTimeout(() => {
        setLocation(prevLocation => {
          if (!prevLocation) {
            const defaultLocation = { lat: 40.7128, lon: -74.0060 };
            localStorage.setItem("userLocation", JSON.stringify(defaultLocation));
            return defaultLocation;
          }
          return prevLocation;
        });
      }, 15000);
      
      return () => clearTimeout(safetyTimer);
    };
    
    init();
  }, []); // Run only once on mount

  // Fetch recommendation when location becomes available
  useEffect(() => {
    // When we get a location, trigger a recommendation fetch.
    // Previous check used `!loading` which prevented the first fetch because
    // `loading` is initially true. Call fetch when we have a location.
    if (location) {
      fetchRecommendation(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]); // Only depend on location, not fetchRecommendation to avoid loops

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
            <>
              <EmptyState
                icon={Shirt}
                title="Missing Essential Clothing"
                description={error}
                actions={[
                  {
                    label: "Add Clothing Items",
                    onClick: () => setShowOnboardingWizard(true),
                    icon: Shirt,
                    variant: "default"
                  },
                  {
                    label: "Try Again",
                    onClick: () => location && fetchRecommendation(location),
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
              
              {/* Onboarding Wizard Modal */}
              {userId && (
                <OnboardingWizard
                  open={showOnboardingWizard}
                  onComplete={() => {
                    setShowOnboardingWizard(false);
                    // Refresh the recommendation
                    if (location) {
                      fetchRecommendation(location);
                    }
                  }}
                  onSkip={() => setShowOnboardingWizard(false)}
                  userId={userId}
                />
              )}
            </>
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
      {/* Hero Section - Brand moment */}
      <Hero 
        isAuthenticated={isAuthenticated}
        hasWardrobe={hasWardrobe}
        onGetOutfitClick={() => {
          const dashboardElement = document.getElementById('dashboard');
          if (dashboardElement) {
            dashboardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />
      
      {/* Type guard for debug banner to avoid using `any` */}
  {process.env.NODE_ENV === 'development' && (function renderDebugHelper() {
        function hasRecommendationKey(obj: unknown): obj is { recommendation: { outfit?: unknown[] } } {
          return !!obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj as object, 'recommendation');
        }

        return (
          <div className="fixed top-4 right-4 z-50 bg-white/90 border p-3 rounded-md shadow-md text-xs text-foreground max-w-sm">
            <div className="font-semibold mb-1">Debug</div>
            <div><strong>loading:</strong> {String(loading)}</div>
            <div><strong>location:</strong> {location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'null'}</div>
            <div><strong>error:</strong> {error ? error : 'none'}</div>
            <div><strong>recommendation:</strong> {recommendationData ? (hasRecommendationKey(recommendationData) ? `ok (${recommendationData.recommendation.outfit?.length ?? 0})` : 'no recommendation key') : 'null'}</div>
            <div><strong>authenticated:</strong> {String(isAuthenticated)}</div>
            <div><strong>hasWardrobe:</strong> {String(hasWardrobe)}</div>
          </div>
        );
  })()}
      <Suspense fallback={
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      }>
        <div id="dashboard">
          <DashboardClient 
            recommendationData={recommendationData}
            location={location}
            onLocationChange={() => setShowLocationDialog(true)}
            onRefresh={() => location && fetchRecommendation(location)}
          />
        </div>
      </Suspense>

      {/* Location Change Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Location</DialogTitle>
            <DialogDescription>
              Update your location to get accurate weather and outfit recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              onClick={() => {
                requestLocation();
                setShowLocationDialog(false);
                toast("Requesting current location...", { icon: "📍" });
              }}
              className="w-full"
              size="lg"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or enter coordinates
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="e.g., 40.7128"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  type="number"
                  step="0.0001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="e.g., -74.0060"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  type="number"
                  step="0.0001"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                const lat = parseFloat(manualLat);
                const lon = parseFloat(manualLon);
                if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                  const coords = { lat, lon };
                  setLocation(coords);
                  localStorage.setItem("userLocation", JSON.stringify(coords));
                  setShowLocationDialog(false);
                  toast("Location updated successfully", { icon: "✅" });
                } else {
                  toast.error("Please enter valid coordinates");
                }
              }}
              className="w-full"
              variant="outline"
              disabled={!manualLat || !manualLon}
            >
              Set Manual Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}