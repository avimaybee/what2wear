'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';

interface LocationOption {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

const COMMON_LOCATIONS: LocationOption[] = [
  // US Major Cities
  { name: 'New York, NY', lat: 40.7128, lon: -74.0060, country: 'US', state: 'NY' },
  { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437, country: 'US', state: 'CA' },
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298, country: 'US', state: 'IL' },
  { name: 'Houston, TX', lat: 29.7604, lon: -95.3698, country: 'US', state: 'TX' },
  { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.0742, country: 'US', state: 'AZ' },
  { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194, country: 'US', state: 'CA' },
  { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321, country: 'US', state: 'WA' },
  { name: 'Denver, CO', lat: 39.7392, lon: -104.9903, country: 'US', state: 'CO' },
  { name: 'Boston, MA', lat: 42.3601, lon: -71.0589, country: 'US', state: 'MA' },
  { name: 'Miami, FL', lat: 25.7617, lon: -80.1918, country: 'US', state: 'FL' },
  
  // International Cities
  { name: 'London, UK', lat: 51.5074, lon: -0.1278, country: 'UK' },
  { name: 'Paris, France', lat: 48.8566, lon: 2.3522, country: 'France' },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, country: 'Japan' },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, country: 'Australia' },
  { name: 'Toronto, Canada', lat: 43.6532, lon: -79.3832, country: 'Canada' },
  { name: 'Barcelona, Spain', lat: 41.3851, lon: 2.1734, country: 'Spain' },
  { name: 'Berlin, Germany', lat: 52.5200, lon: 13.4050, country: 'Germany' },
  { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, country: 'UAE' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'Singapore' },
  { name: 'Bangkok, Thailand', lat: 13.7563, lon: 100.5018, country: 'Thailand' },
];

interface LocationSelectorProps {
  onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
  currentLocation?: { lat: number; lon: number } | null;
  currentLocationName?: string;
}

export default function LocationSelector({
  onLocationSelect,
  currentLocation,
  currentLocationName,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<LocationOption[]>(COMMON_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter locations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLocations(COMMON_LOCATIONS);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = COMMON_LOCATIONS.filter(
      loc =>
        loc.name.toLowerCase().includes(query) ||
        loc.country?.toLowerCase().includes(query) ||
        loc.state?.toLowerCase().includes(query)
    );
    setFilteredLocations(filtered);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectLocation = (location: LocationOption) => {
    setSelectedLocation(location);
    setSearchQuery('');
    setIsOpen(false);
    onLocationSelect({
      lat: location.lat,
      lon: location.lon,
      name: location.name,
    });
    localStorage.setItem('userLocation', JSON.stringify({ lat: location.lat, lon: location.lon, name: location.name }));
    localStorage.setItem('userLocationName', location.name);
    toast(`Location set to ${location.name}`, { icon: '📍' });
  };

  const handleManualCoordinates = () => {
    const latStr = prompt('Enter latitude:');
    if (!latStr) return;

    const lat = parseFloat(latStr);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast('Invalid latitude. Must be between -90 and 90', { icon: '❌' });
      return;
    }

    const lonStr = prompt('Enter longitude:');
    if (!lonStr) return;

    const lon = parseFloat(lonStr);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      toast('Invalid longitude. Must be between -180 and 180', { icon: '❌' });
      return;
    }

    const customLocation: LocationOption = {
      name: `Custom (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      lat,
      lon,
    };

    handleSelectLocation(customLocation);
  };

  const displayName = currentLocationName || selectedLocation?.name || 'Select Location';
  const isSelected = selectedLocation || currentLocation;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate text-sm">{displayName}</span>
          </div>
          {isSelected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg">
            {/* Search Input */}
            <div className="border-b p-2">
              <Input
                ref={searchInputRef}
                placeholder="Search cities, countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Location List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => (
                  <button
                    key={`${location.lat}-${location.lon}`}
                    onClick={() => handleSelectLocation(location)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{location.name}</div>
                      {location.country && (
                        <div className="text-xs text-gray-500">
                          {location.country}
                          {location.state && ` • ${location.state}`}
                        </div>
                      )}
                    </div>
                    {selectedLocation?.name === location.name && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-2" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No locations found. Try a different search.
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualCoordinates}
                className="w-full text-xs justify-start"
              >
                <MapPin className="h-3 w-3 mr-2" />
                Enter Custom Coordinates
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Current Location Display */}
      {isSelected && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              📍 {currentLocation ? `Lat: ${currentLocation.lat.toFixed(4)}°, Lon: ${currentLocation.lon.toFixed(4)}°` : displayName}
            </span>
            {currentLocation && (
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setSearchQuery('');
                  localStorage.removeItem('userLocation');
                  localStorage.removeItem('userLocationName');
                  toast('Location cleared', { icon: '🗑️' });
                }}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
