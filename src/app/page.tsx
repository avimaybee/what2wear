"use client";

import { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { RecommendationApiPayload, RecommendationDiagnostics } from "@/lib/types";

// Lazy load heavy components
const DashboardClient = lazy(() => 
  import("@/components/client/dashboard-client").then(mod => ({ default: mod.DashboardClient }))
);

type RecommendationApiResponse = {
  success: boolean;
  data?: RecommendationApiPayload;
  diagnostics?: RecommendationDiagnostics;
  needsWardrobe?: boolean;
  message?: string;
  error?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [recommendationData, setRecommendationData] = useState<RecommendationApiPayload | null>(null);
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
  const [recommendationDiagnostics, setRecommendationDiagnostics] = useState<RecommendationDiagnostics | null>(null);

  const emitClientLog = useCallback((message: string, context?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    const entry = {
      message,
      context: context ?? null,
      ts: new Date().toISOString(),
    };

    try {
      const globalWindow = window as typeof window & { __setmyfitLogBuffer?: typeof entry[] };
      globalWindow.__setmyfitLogBuffer = globalWindow.__setmyfitLogBuffer || [];
      globalWindow.__setmyfitLogBuffer.push(entry);
      if (globalWindow.__setmyfitLogBuffer.length > 200) {
        globalWindow.__setmyfitLogBuffer.shift();
      }
    } catch (_err) {
      // Swallow serialization errors silently
    }

    if (context) {
      console.info(`[setmyfit] ${message}`, context);
    } else {
      console.info(`[setmyfit] ${message}`);
    }
  }, []);

  const logDiagnosticsToConsole = useCallback((diagnostics: RecommendationDiagnostics, coords?: { lat: number; lon: number }) => {
    emitClientLog('recommendation:diagnostics', {
      requestId: diagnostics.requestId,
      warnings: diagnostics.warnings.length,
      coords,
    });

    if (typeof window !== "undefined") {
      const globalWindow = window as typeof window & { __setmyfitDiagnostics?: RecommendationDiagnostics };
      globalWindow.__setmyfitDiagnostics = diagnostics;
    }

    console.groupCollapsed(`[setmyfit] Recommendation ${diagnostics.requestId}`);
    if (coords) {
      console.log('coords', coords);
    }
    if (diagnostics.summary?.filterCounts) {
      console.table(diagnostics.summary.filterCounts);
    }
    diagnostics.events.forEach((event) => {
      console.log(`${event.stage}`, event.meta ?? {});
    });
    if (diagnostics.warnings.length > 0) {
      console.warn('diagnostic warnings', diagnostics.warnings);
    }
    console.groupEnd();
  }, [emitClientLog]);

  // Request user location
  const requestLocation = useCallback(() => {
    setError(null);
    emitClientLog('location:request:start');

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          emitClientLog('location:request:success', coords);
          setLocation(coords);
          localStorage.setItem("userLocation", JSON.stringify(coords));
          toast(`Location detected: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`, { icon: "📍" });
        },
        (error) => {
          let errorMsg = "Location access denied";
          if (error.code === 1) errorMsg = "Location permission denied";
          if (error.code === 2) errorMsg = "Location unavailable";
          if (error.code === 3) errorMsg = "Location timeout";
          emitClientLog('location:request:error', { code: error.code, message: errorMsg });
          
          // Fallback to default location (New York)
          const defaultLocation = { lat: 40.7128, lon: -74.0060 };
          setLocation(defaultLocation);
          toast(`${errorMsg}. Using New York instead.`, { icon: "⚠️" });
          emitClientLog('location:request:fallback', defaultLocation);
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
      emitClientLog('location:request:notSupported');
    }
  }, [emitClientLog]);

  // Fetch outfit recommendation
  const fetchRecommendation = useCallback(async (coords: { lat: number; lon: number }, retryCount = 0) => {
    emitClientLog('recommendation:fetch:start', { coords, retryCount });

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in to get outfit recommendations");
        setIsAuthError(true);
        emitClientLog('recommendation:fetch:auth-missing');
        return;
      }

      emitClientLog('recommendation:fetch:sessionReady', { userId: session.user.id });

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
        emitClientLog('recommendation:fetch:httpError', { status: response.status });
        throw new Error(`Failed to fetch recommendation: ${response.statusText}`);
      }

      const payload: RecommendationApiResponse = await response.json();
      emitClientLog('recommendation:fetch:response', {
        success: payload.success,
        hasDiagnostics: Boolean(payload.diagnostics),
      });

      if (payload.diagnostics) {
        setRecommendationDiagnostics(payload.diagnostics);
        logDiagnosticsToConsole(payload.diagnostics, coords);
      } else {
        setRecommendationDiagnostics(null);
      }

      // Handle empty/insufficient wardrobe gracefully - this is expected for new users
      if (!payload.success && payload.needsWardrobe) {
        setHasWardrobe(false);
        emitClientLog('recommendation:fetch:needsWardrobe', { message: payload.message });
        
        // Check if the error mentions missing types - if so, try to fix them automatically
        if (retryCount === 0 && (payload.message?.toLowerCase().includes('type') || payload.message?.toLowerCase().includes('category'))) {
          try {
            emitClientLog('recommendation:wardrobe:autoFix:start');
            const fixResponse = await fetch("/api/wardrobe/fix-types", {
              method: "POST",
            });
            const fixData = await fixResponse.json();
            
            if (fixData.success && fixData.fixed > 0) {
              toast(`Fixed ${fixData.fixed} wardrobe items, trying again...`, { icon: "🔧" });
              emitClientLog('recommendation:wardrobe:autoFix:success', { fixed: fixData.fixed });
              // Retry once after fixing
              return fetchRecommendation(coords, retryCount + 1);
            }
            emitClientLog('recommendation:wardrobe:autoFix:noChanges');
          } catch (_fixError) {
            emitClientLog('recommendation:wardrobe:autoFix:error');
            // Silent fail - will show empty state instead
          }
        }
        
        setError(payload.message || "Add clothing items to your wardrobe to get started!");
        // Don't show error toast for empty wardrobe - it's expected for new users
        return;
      }
      
      if (!payload.success) {
        throw new Error(payload.error || "Failed to generate recommendation");
      }

      setHasWardrobe(true);
      setRecommendationData(payload.data ?? null);
      emitClientLog('recommendation:fetch:success', {
        outfitItems: payload.data?.recommendation.outfit.length ?? 0,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load recommendation";
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      emitClientLog('recommendation:fetch:error', { message: errorMsg, isTimeout, retryCount });
      
      // Handle timeout separately
      if (isTimeout) {
        setError("Our AI stylist took too long to answer. Try again in a sec.");
        toast.error("Stylist on a coffee break—give it another try.");
      } else {
        setError(errorMsg);
        // Only show error toast for actual errors, not empty wardrobe
        if (!errorMsg.toLowerCase().includes("wardrobe")) {
          toast.error("AI stylist got stuck dressing you. Try again.");
        }
      }
      setRecommendationDiagnostics(null);
    } finally {
      setLoading(false);
    }
  }, [emitClientLog, logDiagnosticsToConsole]);

  // Initialize: Get location and fetch recommendation
  useEffect(() => {
    const init = async () => {
      // Check authentication status first
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        emitClientLog('auth:session', { userId: session.user.id });
      } else {
        emitClientLog('auth:noSession');
      }
      
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        try {
          const coords = JSON.parse(savedLocation);
          setLocation(coords);
          emitClientLog('location:cache:hit', coords);
          return; // Don't fetch yet, wait for useEffect below
        } catch {
          // Invalid saved location, request new one
          emitClientLog('location:cache:invalid');
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
  }, [emitClientLog, requestLocation]); // Run only once on mount

  useEffect(() => {
    if (!recommendationData) return;
    const outfitCount = recommendationData?.recommendation.outfit.length ?? 0;
    emitClientLog('recommendation:state:update', { outfitCount });
  }, [recommendationData, emitClientLog]);

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-5xl space-y-6">
          {/* Weather + hero skeleton */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-start">
            <Skeleton variant="panel" className="h-52 md:h-56 rounded-[1.6rem]" />
            <div className="space-y-4">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-2/3" />
              <div className="flex flex-wrap gap-3">
                <Skeleton variant="panel" className="h-10 w-32" />
                <Skeleton variant="panel" className="h-10 w-28" />
              </div>
            </div>
          </div>

          {/* Outfit card skeleton */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)] items-start">
            <Skeleton variant="panel" className="h-80 rounded-[1.6rem]" />
            <div className="space-y-4">
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton variant="text" className="w-2/3" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton variant="panel" className="h-16" />
                <Skeleton variant="panel" className="h-16" />
                <Skeleton variant="panel" className="h-16" />
                <Skeleton variant="panel" className="h-16" />
              </div>
              <div className="flex gap-3 pt-2">
                <Skeleton variant="panel" className="h-10 w-32" />
                <Skeleton variant="panel" className="h-10 w-28" />
              </div>
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground font-heading">Need Attention</p>
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
    <div className="min-h-screen">
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
      
      {process.env.NODE_ENV === 'development' && (function renderDebugHelper() {
        const filterSummary = recommendationDiagnostics?.summary?.filterCounts
          ? Object.entries(recommendationDiagnostics.summary.filterCounts)
              .map(([stage, value]) => `${stage.split(':').slice(-1)}:${value}`)
              .join(', ')
          : 'n/a';

        const recommendationStatus = recommendationData
          ? `ok (${recommendationData.recommendation.outfit.length})`
          : 'null';

        return (
          <div className="fixed top-4 right-4 z-50 bg-white/90 border p-3 rounded-md shadow-md text-xs text-foreground max-w-sm">
            <div className="font-semibold mb-1">Debug</div>
            <div><strong>loading:</strong> {String(loading)}</div>
            <div><strong>location:</strong> {location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'null'}</div>
            <div><strong>error:</strong> {error ? error : 'none'}</div>
            <div><strong>recommendation:</strong> {recommendationStatus}</div>
            <div><strong>authenticated:</strong> {String(isAuthenticated)}</div>
            <div><strong>hasWardrobe:</strong> {String(hasWardrobe)}</div>
            <div><strong>diag request:</strong> {recommendationDiagnostics?.requestId ?? 'n/a'}</div>
            <div><strong>diag warnings:</strong> {recommendationDiagnostics?.warnings.length ?? 0}</div>
            <div><strong>filters:</strong> {filterSummary}</div>
          </div>
        );
  })()}
      <Suspense fallback={
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="w-full max-w-5xl space-y-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-start">
              <Skeleton variant="panel" className="h-48 md:h-52 rounded-[1.6rem]" />
              <div className="space-y-3">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-2/3" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton variant="panel" className="h-9 w-28" />
                  <Skeleton variant="panel" className="h-9 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      }>
        <div id="dashboard">
          <DashboardClient 
            recommendationData={recommendationData}
            location={location}
            onRefresh={() => location && fetchRecommendation(location)}
            onAutoDetectLocation={requestLocation}
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
                  emitClientLog('location:manual', coords);
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