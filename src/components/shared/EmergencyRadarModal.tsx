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

const BACKEND_URL = "http://localhost:8000";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051124]/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-[#0B2B5C] text-white shadow-[0_25px_60px_-15px_rgba(5,17,36,0.9)] overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#0B2B5C] via-[#051124] to-[#0B2B5C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-wide">
                  Emergency Break-Down & Fuel Assist Radar
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Live GPS
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                {hasGpsLock ? (
                  <>
                    <span className="text-emerald-400 font-semibold">GPS Locked</span> — Scanning {SEARCH_RADIUS_KM}km radius around ({currentCoords.lat.toFixed(3)},{" "}
                    {currentCoords.lng.toFixed(3)})
                  </>
                ) : (
                  <>Scanning {SEARCH_RADIUS_KM}km radius around ({currentCoords.lat.toFixed(3)}, {currentCoords.lng.toFixed(3)})</>
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border border-white/15 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 text-[#D4AF37] ${isLocating ? "animate-spin" : ""}`} />
              {isLocating ? "Locating..." : "Refresh GPS"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Offline Safety Mode Banner */}
        {isOffline && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <WifiOff className="h-4 w-4 text-amber-400" />
              <span>
                <strong>Offline Safety Mode Active:</strong> Showing cached emergency services from your last GPS scan.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-amber-500/30 px-2 py-0.5 rounded-full">
              Cached {SEARCH_RADIUS_KM}km Radius
            </span>
          </div>
        )}

        {/* Toll-Free National Emergency Quick Dial Bar */}
        <div className="bg-[#051124] border-b border-white/10 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="tel:1033"
            className="flex items-center justify-between p-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">NHAI Highway Helpline</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-red-600/40 px-2 py-0.5 rounded-md">1033</span>
          </a>

          <a
            href="tel:112"
            className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">National Emergency</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-blue-600/40 px-2 py-0.5 rounded-md">112</span>
          </a>

          <a
            href="tel:108"
            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Hospital className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Ambulance Service</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-emerald-600/40 px-2 py-0.5 rounded-md">108</span>
          </a>

          <a
            href="tel:1091"
            className="flex items-center justify-between p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Women Helpline</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-purple-600/40 px-2 py-0.5 rounded-md">1091</span>
          </a>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="p-6 pb-3 border-b border-white/10 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveCategory("fuel")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "fuel"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Fuel className="h-4 w-4" />
              <span>Fuel & EV Stations</span>
            </button>

            <button
              onClick={() => setActiveCategory("mechanics")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "mechanics"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>24/7 Mechanics & Puncture</span>
            </button>

            <button
              onClick={() => setActiveCategory("brand_service")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "brand_service"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Brand Service Centers</span>
            </button>

            <button
              onClick={() => setActiveCategory("emergency_medical")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "emergency_medical"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Hospital className="h-4 w-4" />
              <span>Medical & Towing</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#051124] border border-white/15 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[480px]">
          {/* Loading State */}
          {(isFetching || isLocating) && (
            <div className="py-12 text-center space-y-3">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-[#D4AF37]/50 animate-ping animation-delay-150" />
                <div className="absolute inset-4 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[#D4AF37] animate-spin" />
                </div>
              </div>
              <p className="text-sm font-semibold text-white">
                {isLocating ? "Acquiring GPS coordinates..." : `Scanning ${SEARCH_RADIUS_KM}km radius for nearby services...`}
              </p>
              <p className="text-xs text-gray-400">Using Google Places real-time data</p>
            </div>
          )}

          {/* Error State */}
          {!isFetching && !isLocating && fetchError && services.length === 0 && (
            <div className="py-12 text-center text-gray-400 space-y-3">
              <AlertTriangle className="h-10 w-10 text-red-400 mx-auto opacity-80" />
              <p className="font-semibold text-sm text-red-300">Failed to load nearby services</p>
              <p className="text-xs max-w-md mx-auto">{fetchError}</p>
              <button
                onClick={() => {
                  lastFetchRef.current = "";
                  fetchNearbyServices(currentCoords.lat, currentCoords.lng, activeCategory);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0B2B5C] font-bold text-xs hover:bg-[#c49f27] transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 inline mr-1.5" /> Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isFetching && !isLocating && !fetchError && filteredServices.length === 0 && (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto opacity-60" />
              <p className="font-semibold text-sm">No emergency services found within {SEARCH_RADIUS_KM}km radius.</p>
              <p className="text-xs">Call National Highway Emergency Line <strong>1033</strong> for immediate dispatch.</p>
            </div>
          )}

          {/* Results */}
          {!isFetching && !isLocating &&
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="p-5 rounded-2xl border border-white/10 bg-[#051124]/60 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#D4AF37]/40 transition-all shadow-md group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-bold text-white text-sm group-hover:text-[#D4AF37] transition-colors">
                      {service.name}
                    </h4>
                    {service.brand && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase">
                        {service.brand}
                      </span>
                    )}
                    {service.isOpenNow === true && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Open Now
                      </span>
                    )}
                    {service.isOpenNow === false && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Closed
                      </span>
                    )}
                    {service.isOpenNow === null && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        Hours unknown
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {service.address}
                  </p>

                  {/* Rating & Types */}
                  <div className="flex items-center gap-3 flex-wrap pt-0.5">
                    {service.rating != null && (
                      <span className="flex items-center gap-1 text-xs text-amber-300 font-semibold">
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
                        className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-300 border border-white/10 capitalize"
                      >
                        {type.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {service.distanceKm} km <span className="text-[10px] font-normal text-emerald-300/80">(Direct)</span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Est. Road: ~{(service.distanceKm * 1.5).toFixed(1)} km ({Math.max(1, Math.round(service.distanceKm * 2.5))} mins)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {service.phone && (
                      <a
                        href={`tel:${service.phone}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                    <a
                      href={service.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f27] text-[#0B2B5C] font-bold text-xs transition-all shadow-md cursor-pointer"
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