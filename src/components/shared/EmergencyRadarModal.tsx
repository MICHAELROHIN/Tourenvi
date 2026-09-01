import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AlertTriangle,
  Fuel,
  Wrench,
  Car,
  Hospital,
  Phone,
  Navigation,
  MapPin,
  X,
  Search,
  WifiOff,
  ShieldAlert,
  Clock,
  ExternalLink,
  Zap,
  CheckCircle2,
  Loader2,
  Star,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { useTrip } from "@/context/TripContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmergencyCategory = "fuel" | "mechanics" | "brand_service" | "emergency_medical";

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number;
  isOpenNow: boolean | null;
  location: { lat: number; lng: number };
  mapsUrl: string;
  types: string[];
  businessStatus: string | null;
  icon: string | null;
  phone: string | null;
  brand: string | null;
}

interface EmergencyService {
  id: string;
  name: string;
  category: EmergencyCategory;
  address: string;
  distanceKm: number;
  rating: number | null;
  totalRatings: number;
  isOpenNow: boolean | null;
  lat: number;
  lng: number;
  mapsUrl: string;
  types: string[];
  phone: string | null;
  brand: string | null;
}

interface EmergencyRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "")
).replace(/\/$/, "");
const CACHE_KEY = "tourenvi_emergency_radar_cache";
const SEARCH_RADIUS_KM = 5;
// How far the vehicle has to move before we bother re-scanning. Too small a
// value re-fetches constantly (GPS jitter is often 10-30m even standing
// still); too large a value means the "5km radius" list goes stale while
// actually driving. 300m is a reasonable middle ground for a moving vehicle.
const RESCAN_DISTANCE_METERS = 300;

/** Maps our UI category tabs to Google Places API type param */
const CATEGORY_TO_GOOGLE_TYPE: Record<EmergencyCategory, string> = {
  fuel: "gas_station",
  mechanics: "car_repair",
  brand_service: "brand_service",
  emergency_medical: "hospital",
};

// ─── Haversine Distance ───────────────────────────────────────────────────────

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EmergencyRadarModal: React.FC<EmergencyRadarModalProps> = ({
  isOpen,
  onClose,
  userLat = 18.7544,
  userLng = 73.4077,
}) => {
  const [activeCategory, setActiveCategory] = useState<EmergencyCategory>("fuel");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: userLat,
    lng: userLng,
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasGpsLock, setHasGpsLock] = useState(false);

  // Prevent double-fetching on mount
  const lastFetchRef = useRef<string>("");

  // Live GPS tracking: watchPosition subscription id + the last coords we
  // actually re-scanned from (used to compare against RESCAN_DISTANCE_METERS
  // so we don't spam the backend on every tiny GPS jitter).
  const watchIdRef = useRef<number | null>(null);
  const lastScannedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // ─── Network status listener ──────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Fetch nearby services from backend ───────────────────────────────────

  const fetchNearbyServices = useCallback(
    async (lat: number, lng: number, category: EmergencyCategory) => {
      const fetchKey = `${lat.toFixed(4)}_${lng.toFixed(4)}_${category}`;
      if (fetchKey === lastFetchRef.current) return;
      lastFetchRef.current = fetchKey;

      const googleType = CATEGORY_TO_GOOGLE_TYPE[category];
      setIsFetching(true);
      setServices([]); // Clear previous category services immediately
      setFetchError(null);

      try {
        const url = `${BACKEND_URL}/api/nearby-emergency?lat=${lat}&lng=${lng}&type=${googleType}`;
        const response = await fetch(url);
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || `Server returned ${response.status}`);
        }

        const mapped: EmergencyService[] = (json.data as PlaceResult[]).map((place) => ({
          id: place.id,
          name: place.name,
          category,
          address: place.address,
          distanceKm: haversineDistanceKm(lat, lng, place.location.lat, place.location.lng),
          rating: place.rating,
          totalRatings: place.totalRatings,
          isOpenNow: place.isOpenNow,
          lat: place.location.lat,
          lng: place.location.lng,
          mapsUrl: place.mapsUrl,
          types: place.types,
          phone: place.phone || null,
          brand: place.brand || null,
        }));

        // Sort by distance ascending
        mapped.sort((a, b) => a.distanceKm - b.distanceKm);

        setServices(mapped);

        // Cache the successful result
        try {
          const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
          cacheData[category] = { data: mapped, timestamp: Date.now(), coords: { lat, lng } };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch {
          // localStorage full or unavailable, ignore
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error";
        console.error("Emergency radar fetch failed:", message);
        setFetchError(message);

        // Fall back to cached data
        try {
          const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
          if (cacheData[category]?.data && cacheData[category].data.length > 0) {
            setServices(cacheData[category].data);
            toast.info("Showing cached results. Live data unavailable.");
          } else {
            setServices([]);
          }
        } catch {
          setServices([]);
        }
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  const { trip } = useTrip();

  // ─── GPS Geolocation (one-shot, used for "Refresh GPS" + fallback) ────────

  const handleScanLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    toast.info("Scanning GPS for nearby emergency services...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        lastScannedCoordsRef.current = { lat: latitude, lng: longitude };
        setCurrentCoords({ lat: latitude, lng: longitude });
        setHasGpsLock(true);
        setIsLocating(false);
        // Reset fetch key so the new coords trigger a fresh fetch
        lastFetchRef.current = "";
        toast.success(
          `GPS locked! Scanning ${SEARCH_RADIUS_KM}km radius around (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`
        );
      },
      async (error) => {
        console.warn("GPS lookup failed:", error);
        setIsLocating(false);

        // Fallback: geocode user's active trip location if GPS is unavailable
        const targetCity = trip?.startLocation || trip?.destinations?.[0] || "";
        if (targetCity.trim()) {
          try {
            toast.info(`GPS unavailable. Scanning emergency radar around ${targetCity}...`);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(targetCity)}&limit=1`
            );
            const data = await res.json();
            if (data && data[0]) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);
              lastScannedCoordsRef.current = { lat, lng };
              setCurrentCoords({ lat, lng });
              lastFetchRef.current = "";
              return;
            }
          } catch (gErr) {
            console.warn("Fallback geocode failed:", gErr);
          }
        }
        toast.info("GPS unavailable. Using default route location.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [trip]);

  // ─── Live GPS tracking while the modal is open ─────────────────────────────
  // This is what makes the radar actually behave like a "radar" for a moving
  // vehicle: instead of scanning once and going stale, we subscribe to
  // continuous position updates and re-center the 5km search whenever the
  // vehicle has moved far enough (RESCAN_DISTANCE_METERS) to matter.

  useEffect(() => {
    if (!isOpen || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const last = lastScannedCoordsRef.current;
        const movedMeters = last
          ? haversineDistanceKm(last.lat, last.lng, latitude, longitude) * 1000
          : Infinity;

        setHasGpsLock(true);

        if (movedMeters >= RESCAN_DISTANCE_METERS) {
          lastScannedCoordsRef.current = { lat: latitude, lng: longitude };
          lastFetchRef.current = ""; // allow the fetch effect below to re-run
          setCurrentCoords({ lat: latitude, lng: longitude });
        }
      },
      (error) => {
        // Don't spam toasts on every watch error (e.g. brief signal loss);
        // the one-shot handleScanLocation flow already surfaces failures.
        console.warn("GPS watch error:", error.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOpen]);

  // ─── Auto-fetch when coords or category change ────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    fetchNearbyServices(currentCoords.lat, currentCoords.lng, activeCategory);
  }, [isOpen, currentCoords.lat, currentCoords.lng, activeCategory, fetchNearbyServices]);

  // ─── Auto-scan GPS on first open ──────────────────────────────────────────

  const hasAutoScanned = useRef(false);
  useEffect(() => {
    if (isOpen && !hasAutoScanned.current) {
      hasAutoScanned.current = true;
      handleScanLocation();
    }
    if (!isOpen) {
      hasAutoScanned.current = false;
      lastScannedCoordsRef.current = null;
    }
  }, [isOpen, handleScanLocation]);

  // ─── Filter by search query ───────────────────────────────────────────────

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const categoryTabs: { key: EmergencyCategory; icon: React.ReactNode; label: string }[] = [
    { key: "fuel", icon: <Fuel className="h-4 w-4" />, label: "Fuel & EV" },
    { key: "mechanics", icon: <Wrench className="h-4 w-4" />, label: "Mechanics" },
    { key: "brand_service", icon: <Car className="h-4 w-4" />, label: "Brand Service" },
    { key: "emergency_medical", icon: <Hospital className="h-4 w-4" />, label: "Medical" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-gray-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Decorative top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-400 via-orange-400 to-red-500" />

        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200/60 text-red-500 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  Emergency Assist Radar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Live GPS
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-emerald-500" />
                {hasGpsLock ? (
                  <>
                    <span className="text-emerald-600 font-semibold">GPS Locked</span> — {SEARCH_RADIUS_KM}km radius ({currentCoords.lat.toFixed(3)},{" "}
                    {currentCoords.lng.toFixed(3)})
                  </>
                ) : (
                  <>Scanning {SEARCH_RADIUS_KM}km radius ({currentCoords.lat.toFixed(3)}, {currentCoords.lng.toFixed(3)})</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                lastFetchRef.current = "";
                handleScanLocation();
              }}
              disabled={isLocating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-all border border-gray-200 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-500 ${isLocating ? "animate-spin" : ""}`} />
              {isLocating ? "Locating..." : "Refresh GPS"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Offline Safety Mode Banner */}
        {isOffline && (
          <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2 font-medium">
              <WifiOff className="h-4 w-4 text-amber-500" />
              <span>
                <strong>Offline Safety Mode:</strong> Showing cached services from last GPS scan.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-amber-200/60 text-amber-700 px-2 py-0.5 rounded-full">
              Cached {SEARCH_RADIUS_KM}km
            </span>
          </div>
        )}

        {/* Toll-Free Emergency Quick Dial Bar */}
        <div className="bg-gray-50/80 border-b border-gray-100 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <a
            href="tel:1033"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-red-200/60 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">NHAI Highway</span>
            </div>
            <span className="font-mono font-black text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-md">1033</span>
          </a>

          <a
            href="tel:112"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-blue-200/60 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Emergency</span>
            </div>
            <span className="font-mono font-black text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">112</span>
          </a>

          <a
            href="tel:108"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200/60 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Hospital className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Ambulance</span>
            </div>
            <span className="font-mono font-black text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md">108</span>
          </a>

          <a
            href="tel:1091"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-200/60 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Women Help</span>
            </div>
            <span className="font-mono font-black text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-md">1091</span>
          </a>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 space-y-3 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeCategory === tab.key
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-3 max-h-[480px] bg-gray-50/40">
          {/* Loading State */}
          {(isFetching || isLocating) && (
            <div className="py-12 text-center space-y-3">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-emerald-300 animate-ping animation-delay-150" />
                <div className="absolute inset-4 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {isLocating ? "Acquiring GPS coordinates..." : `Scanning ${SEARCH_RADIUS_KM}km radius...`}
              </p>
              <p className="text-xs text-gray-500">Using Google Places real-time data</p>
            </div>
          )}

          {/* Error State */}
          {!isFetching && !isLocating && fetchError && services.length === 0 && (
            <div className="py-12 text-center text-gray-500 space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200/60 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <p className="font-semibold text-sm text-red-600">Failed to load nearby services</p>
              <p className="text-xs max-w-md mx-auto text-gray-500">{fetchError}</p>
              <button
                onClick={() => {
                  lastFetchRef.current = "";
                  fetchNearbyServices(currentCoords.lat, currentCoords.lng, activeCategory);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 inline mr-1.5" /> Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isFetching && !isLocating && !fetchError && filteredServices.length === 0 && (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-amber-400" />
              </div>
              <p className="font-semibold text-sm text-gray-700">No services found within {SEARCH_RADIUS_KM}km</p>
              <p className="text-xs">Call National Highway Emergency <strong className="text-red-600">1033</strong> for immediate dispatch.</p>
            </div>
          )}

          {/* Results */}
          {!isFetching && !isLocating &&
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="p-4 rounded-xl border border-gray-200/80 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {service.name}
                    </h4>
                    {service.brand && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase">
                        {service.brand}
                      </span>
                    )}
                    {service.isOpenNow === true && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Open Now
                      </span>
                    )}
                    {service.isOpenNow === false && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/60 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Closed
                      </span>
                    )}
                    {service.isOpenNow === null && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200/60">
                        Hours unknown
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {service.address}
                  </p>

                  {/* Rating & Types */}
                  <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                    {service.rating != null && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {service.rating.toFixed(1)}
                        {service.totalRatings > 0 && (
                          <span className="text-gray-400 font-normal">
                            ({service.totalRatings.toLocaleString()})
                          </span>
                        )}
                      </span>
                    )}
                    {service.types.slice(0, 3).map((type, idx) => (
                      <span
                        key={`${service.id}_type_${type}_${idx}`}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-gray-50 text-gray-500 border border-gray-200/60 capitalize"
                      >
                        {type.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600 font-mono">
                      {service.distanceKm} km <span className="text-[10px] font-normal text-emerald-500">(Direct)</span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Est. Road: ~{(service.distanceKm * 1.5).toFixed(1)} km ({Math.max(1, Math.round(service.distanceKm * 2.5))} mins)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {service.phone && (
                      <a
                        href={`tel:${service.phone}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                    <a
                      href={service.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Navigate
                    </a>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default EmergencyRadarModal;