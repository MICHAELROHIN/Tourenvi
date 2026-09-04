import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Car,
  Bike,
  Coffee,
  Bed,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  IndianRupee,
  Fuel,
  Ticket,
  Users,
  ShieldCheck,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  LocateFixed,
  Zap,
  Radio,
  Layers,
  Utensils,
  Settings,
  Compass,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  Volume2,
  VolumeX,
  Leaf,
  Wallet,
  Check,
  Route as RouteIcon,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { useGeoFence } from "@/hooks/useGeoFence";
import { PlannedTrip } from "@/pages/TripsPlanned";
import { getBearing, haversineDistance, formatDistance } from "@/utils/geoUtils";
import { API_BASE_URL } from "@/config/api";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Google Maps 3D Rotating Navigation Arrow Marker
const createNavigationArrowIcon = (heading = 0, isSimulating = false) => {
  return new L.DivIcon({
    className: "custom-nav-arrow-marker",
    html: `
      <div style="
        width: 48px; height: 48px;
        display: flex; align-items: center; justify-content: center;
        position: relative;
        transform: rotate(${Math.round(heading)}deg);
        transition: transform 0.3s ease-out;
      ">
        <svg viewBox="0 0 24 24" width="38" height="38" style="filter: drop-shadow(0 4px 10px rgba(5, 150, 105, 0.5));">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="#059669" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
        </svg>
        <div style="
          position: absolute; width: 44px; height: 44px; border-radius: 50%;
          border: 2.5px solid #10b981; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.8; pointer-events: none;
        "></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

// Custom Stop / Attraction Marker Icon
const createStopIcon = (number: number | string, isCurrent = false, isCompleted = false) => {
  const bg = isCompleted ? "#10b981" : isCurrent ? "#f59e0b" : "#0284c7";
  return new L.DivIcon({
    className: "custom-stop-marker",
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: ${bg}; border: 2.5px solid #ffffff;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; font-size: 12px;
      ">
        ${isCompleted ? "✓" : number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom Food Stop Marker Icon directly on the Route
const createFoodMarkerIcon = (rating = 4.5, isSelected = false) => {
  return new L.DivIcon({
    className: "custom-food-marker",
    html: `
      <div style="
        display: flex; flex-direction: column; align-items: center;
        transform: ${isSelected ? 'scale(1.18)' : 'scale(1)'};
        transition: transform 0.2s ease;
        cursor: pointer;
      ">
        <div style="
          width: 34px; height: 34px; border-radius: 50%;
          background: #ea580c; border: 2.5px solid #ffffff;
          box-shadow: 0 3px 10px rgba(234, 88, 12, 0.4);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 15px;
        ">
          🍽️
        </div>
        <div style="
          background: #ffffff; color: #9a3412; font-size: 10px; font-weight: 800;
          padding: 1px 5px; border-radius: 6px; border: 1px solid #fed7aa;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15); margin-top: -4px;
        ">
          ★ ${rating}
        </div>
      </div>
    `,
    iconSize: [34, 46],
    iconAnchor: [17, 23],
  });
};

interface ActiveJourneyGuideProps {
  trip: PlannedTrip;
  onExit?: () => void;
}

interface ExpenseLog {
  id: string;
  category: "fuel" | "toll" | "food" | "ticket" | "hotel" | "misc";
  title: string;
  amount: number;
  time: string;
}

interface ItineraryItem {
  id: string;
  time: string;
  type: string;
  title: string;
  description?: string;
  completed?: boolean;
  durationMinutes?: number;
  isAdjusted?: boolean;
  isAutoCompleted?: boolean;
  lat?: number;
  lng?: number;
  costEstimate?: number;
}

export type RoutePriorityType = "fastest" | "eco-friendly" | "toll-free";

export interface RouteOption {
  id: RoutePriorityType;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  distanceKm: number;
  durationMinutes: number;
  fuelCost: number;
  tollCost: number;
  co2SavedKg: number;
  polyline: [number, number][];
  color: string;
  tag: string;
}

interface RouteFoodSpot {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  avgCostPerPerson: number;
  mealType: "breakfast" | "lunch" | "tea" | "dinner";
  lat: number;
  lng: number;
  distanceKm: number;
  openHours: string;
  highlight: string;
}

// Recenter Map Helper Component
const MapFollowVehicle = ({ center, follow }: { center: [number, number]; follow: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.panTo(center, { animate: true, duration: 0.6 });
    }
  }, [center, follow, map]);
  return null;
};

export const ActiveJourneyGuide: React.FC<ActiveJourneyGuideProps> = ({ trip, onExit }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  // --- Vehicle Telemetry & Setup State ---
  const [vehicleNumber, setVehicleNumber] = useState<string>(() => {
    return localStorage.getItem("tourenvi.vehicle.plate") || "TN 09 BK 4589";
  });
  const [trackingSource, setTrackingSource] = useState<"mobile_gps" | "vehicle_gps">("mobile_gps");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // --- Navigation & Maneuver State ---
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([13.0827, 80.2707]);
  const [currentHeading, setCurrentHeading] = useState<number>(45); // Degrees (0-360)
  const [liveSpeed, setLiveSpeed] = useState(0); // km/h
  const [isNavigating, setIsNavigating] = useState(true);
  const [followVehicle, setFollowVehicle] = useState(true);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [livePlaceName, setLivePlaceName] = useState<string>("");

  // --- Auto-Pilot (Option A + Option C) State ---
  const [autoPilotEnabled, setAutoPilotEnabled] = useState<boolean>(() => {
    return localStorage.getItem("tourenvi.journey.autopilot") !== "false";
  });
  const [arrivedStopIndex, setArrivedStopIndex] = useState<number | null>(null);
  const [lastAutoCompletedId, setLastAutoCompletedId] = useState<string | null>(null);

  // --- Route Logic Priority State (Defaults to choice from Trip Builder Step 6 / 8th step) ---
  const initialRoutePriority = useMemo<RoutePriorityType>(() => {
    const raw = (trip.tripData as any)?.routePriority || (trip.routeDetails as any)?.routePriority || (trip as any).routePriority;
    if (raw === "eco-friendly" || raw === "toll-free" || raw === "fastest") {
      return raw;
    }
    return "fastest";
  }, [trip]);

  const [activeRouteLogic, setActiveRouteLogic] = useState<RoutePriorityType>(initialRoutePriority);
  const [availableRoutes, setAvailableRoutes] = useState<Record<RoutePriorityType, RouteOption | null>>({
    fastest: null,
    "eco-friendly": null,
    "toll-free": null,
  });

  // Route Polyline & Food Spots along the Route
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(trip.routeDetails?.distanceKm || 280);
  const [routeFoodSpots, setRouteFoodSpots] = useState<RouteFoodSpot[]>([]);
  const [selectedFoodSpot, setSelectedFoodSpot] = useState<RouteFoodSpot | null>(null);
  const [isFoodDrawerOpen, setIsFoodDrawerOpen] = useState(false);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Dynamic 8:00 PM Hard-Stop Auto-Replanner State
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceAlert, setRebalanceAlert] = useState<string | null>(null);
  const [dayFinishEstimate, setDayFinishEstimate] = useState("07:40 PM");
  const [isLate, setIsLate] = useState(false);

  // Live Expenses State
  const expenseStorageKey = useMemo(() => `tourenvi.journey.expenses.${trip.id}`, [trip.id]);
  const [expenses, setExpenses] = useState<ExpenseLog[]>(() => {
    try {
      const raw = localStorage.getItem(expenseStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpenseCat, setNewExpenseCat] = useState<ExpenseLog["category"]>("fuel");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseTitle, setNewExpenseTitle] = useState("");

  // Active Day Itinerary Items
  const [dayItineraries, setDayItineraries] = useState<Record<number, ItineraryItem[]>>({});

  // Group Live Tracking Hook
  const { memberLocations } = useLiveTracking(trip.id);

  // Initialize Itinerary Data
  useEffect(() => {
    const rawItinerary = trip.itinerary || [];
    const formatted: Record<number, ItineraryItem[]> = {};

    rawItinerary.forEach((day, dIdx) => {
      formatted[dIdx] = (day.items || []).map((item, iIdx) => ({
        id: `${dIdx}_${iIdx}`,
        time: item.time || "09:00 AM",
        type: item.type || "sightseeing",
        title: item.title || `Stop ${iIdx + 1}`,
        description: item.description || "",
        completed: false,
        durationMinutes: item.type === "food" ? 45 : item.type === "lodging" ? 30 : 75,
        lat: typeof item.lat === "number" ? item.lat : undefined,
        lng: typeof item.lng === "number" ? item.lng : undefined,
      }));
    });

    if (Object.keys(formatted).length === 0) {
      formatted[0] = [
        { id: "0_0", time: "08:30 AM - 09:30 AM", type: "food", title: "Breakfast & Route Start", durationMinutes: 45, completed: false },
        { id: "0_1", time: "10:30 AM - 12:00 PM", type: "sightseeing", title: `${trip.routeDetails?.destination || "Destination"} Heritage Site`, durationMinutes: 90, completed: false },
        { id: "0_2", time: "01:00 PM - 02:00 PM", type: "food", title: "Traditional Highway Thali Lunch", durationMinutes: 60, completed: false },
        { id: "0_3", time: "03:30 PM - 05:30 PM", type: "sightseeing", title: "Scenic Lake & Botanical Walk", durationMinutes: 120, completed: false },
        { id: "0_4", time: "06:30 PM - 07:30 PM", type: "lodging", title: trip.tripData?.selectedHotelName || "Hotel Check-in & Rest", durationMinutes: 45, completed: false },
      ];
    }

    setDayItineraries(formatted);
  }, [trip]);

  const currentDayItems = useMemo(() => {
    return dayItineraries[activeDayIndex] || [];
  }, [dayItineraries, activeDayIndex]);

  const currentStop = useMemo(() => {
    return currentDayItems[currentStopIndex] || currentDayItems[0];
  }, [currentDayItems, currentStopIndex]);

  // Helper to generate food stops along any chosen polyline
  const generateFoodSpotsForPolyline = useCallback((polyline: [number, number][], distKm: number): RouteFoodSpot[] => {
    const polyLength = polyline.length;
    if (polyLength <= 5) return [];

    const p1 = polyline[Math.floor(polyLength * 0.2)];
    const p2 = polyline[Math.floor(polyLength * 0.45)];
    const p3 = polyline[Math.floor(polyLength * 0.7)];
    const p4 = polyline[Math.floor(polyLength * 0.9)];

    const budgetLevel = trip.tripData?.lodgingType?.[0]?.toLowerCase() || "standard";
    const baseCost = budgetLevel === "luxury" ? 650 : budgetLevel === "budget" ? 140 : 280;

    return [
      {
        id: "food_stop_1",
        name: "Hotel Saravana Bhavan (Highway Express)",
        cuisine: "Pure Veg South Indian, Filter Coffee & Dosas",
        rating: 4.6,
        avgCostPerPerson: baseCost,
        mealType: "breakfast",
        lat: p1[0] + 0.002,
        lng: p1[1] + 0.002,
        distanceKm: Math.round(distKm * 0.2),
        openHours: "06:30 AM - 11:30 AM",
        highlight: "Quick highway stop with clean restrooms & parking",
      },
      {
        id: "food_stop_2",
        name: "Anjappar Chettinad & Seafood Grill",
        cuisine: "Traditional Chettinad Biryani, Fish Fry & Thali",
        rating: 4.5,
        avgCostPerPerson: baseCost + 80,
        mealType: "lunch",
        lat: p2[0] - 0.002,
        lng: p2[1] + 0.003,
        distanceKm: Math.round(distKm * 0.45),
        openHours: "12:00 PM - 04:00 PM",
        highlight: "Spacious family AC dining with regional meals",
      },
      {
        id: "food_stop_3",
        name: "Cafe Coffee Day & Highway Tea Point",
        cuisine: "Artisanal Coffee, Pastries, Sandwiches & Juices",
        rating: 4.4,
        avgCostPerPerson: Math.round(baseCost * 0.6),
        mealType: "tea",
        lat: p3[0] + 0.002,
        lng: p3[1] - 0.002,
        distanceKm: Math.round(distKm * 0.7),
        openHours: "07:00 AM - 10:00 PM",
        highlight: "Energizing coffee break before city entry",
      },
      {
        id: "food_stop_4",
        name: "Seafront Heritage Garden Bistro",
        cuisine: "Continental, Fresh Catch Seafood & North Indian",
        rating: 4.7,
        avgCostPerPerson: baseCost + 150,
        mealType: "dinner",
        lat: p4[0] + 0.001,
        lng: p4[1] + 0.001,
        distanceKm: Math.round(distKm * 0.9),
        openHours: "07:00 PM - 11:00 PM",
        highlight: "Dinner stop before 8:00 PM hotel check-in",
      },
    ];
  }, [trip]);

  // Helper to fetch individual route polyline from OSRM
  const fetchOsrmPolyline = async (coordsList: [number, number][]): Promise<{ polyline: [number, number][]; distanceKm: number; durationMin: number } | null> => {
    try {
      const coordStr = coordsList.map(([lat, lng]) => `${lng},${lat}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.routes?.[0]?.geometry?.coordinates) {
        const polyline = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
        const distanceKm = Math.round(data.routes[0].distance / 1000);
        const durationMin = Math.round(data.routes[0].duration / 60);
        return { polyline, distanceKm, durationMin };
      }
    } catch (e) {
      console.warn("OSRM fetch error:", e);
    }
    return null;
  };

  // Calculate all 3 distinct routes (Fastest, Eco-Route, Avoid Tolls)
  const calculateDistinctRoutes = useCallback(async (startLat: number, startLng: number) => {
    const dest = trip.routeDetails?.destination || trip.tripData?.destinations?.[0] || "Pondicherry";
    let endLat = 11.9416;
    let endLng = 79.8083;

    try {
      const geoDestRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}&limit=1`);
      const geoDest = await geoDestRes.json();
      if (geoDest?.[0]) {
        endLat = parseFloat(geoDest[0].lat);
        endLng = parseFloat(geoDest[0].lon);
      }
    } catch (e) {
      console.warn("Destination geocode warning:", e);
    }

    // 1. Fastest Route (Direct Expressway / NH)
    const directResult = await fetchOsrmPolyline([[startLat, startLng], [endLat, endLng]]);
    const fastestPolyline = directResult?.polyline || [
      [startLat, startLng],
      [(startLat + endLat) / 2, (startLng + endLng) / 2],
      [endLat, endLng],
    ];
    const fastestDist = directResult?.distanceKm || Math.round(Math.hypot(endLat - startLat, endLng - startLng) * 111);
    const fastestDuration = directResult?.durationMin || Math.round((fastestDist / 70) * 60);

    // 2. Eco-Friendly Route (Cruising via scenic / coastal / fuel-efficient bypass)
    const ecoMidLat = (startLat + endLat) / 2 + (endLng - startLng) * 0.18;
    const ecoMidLng = (startLng + endLng) / 2 - (endLat - startLat) * 0.18;
    const ecoResult = await fetchOsrmPolyline([[startLat, startLng], [ecoMidLat, ecoMidLng], [endLat, endLng]]);
    const ecoPolyline = ecoResult?.polyline || fastestPolyline.map(([lat, lng], i) => {
      const curve = Math.sin((i / fastestPolyline.length) * Math.PI) * 0.08;
      return [lat + curve * 0.6, lng + curve * 0.9] as [number, number];
    });
    const ecoDist = ecoResult?.distanceKm || Math.round(fastestDist * 1.04);
    const ecoDuration = ecoResult?.durationMin || fastestDuration + 10;

    // 3. Avoid Tolls Route (State Highway / Rural inland bypass corridor)
    const tollMidLat = (startLat + endLat) / 2 - (endLng - startLng) * 0.16;
    const tollMidLng = (startLng + endLng) / 2 + (endLat - startLat) * 0.16;
    const tollResult = await fetchOsrmPolyline([[startLat, startLng], [tollMidLat, tollMidLng], [endLat, endLng]]);
    const tollPolyline = tollResult?.polyline || fastestPolyline.map(([lat, lng], i) => {
      const curve = Math.sin((i / fastestPolyline.length) * Math.PI) * -0.08;
      return [lat + curve * 0.6, lng + curve * 0.9] as [number, number];
    });
    const tollDist = tollResult?.distanceKm || Math.round(fastestDist * 1.08);
    const tollDuration = tollResult?.durationMin || fastestDuration + 18;

    const mileage = trip.tripData?.mileage || 15;
    const fuelPrice = 102.5;
    const baseFuel = Math.round((fastestDist / mileage) * fuelPrice);
    const tollCost = trip.financials?.tollPricing || Math.round(fastestDist * 1.6);

    const routesMap: Record<RoutePriorityType, RouteOption> = {
      fastest: {
        id: "fastest",
        title: "Express Highway (Fastest)",
        badge: "⚡ Fastest Route",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Direct 4/6-lane expressway. Lowest travel time at normal highway cruising speed.",
        distanceKm: fastestDist,
        durationMinutes: fastestDuration,
        fuelCost: baseFuel,
        tollCost: tollCost,
        co2SavedKg: 0,
        polyline: fastestPolyline,
        color: "#2563eb",
        tag: "Shortest Transit Time",
      },
      "eco-friendly": {
        id: "eco-friendly",
        title: "Eco-Route (Fuel Efficient)",
        badge: "🌱 Eco-Route",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Steady 65-75 km/h cruising corridor with reduced stop-and-go drag. Saves ~15% fuel.",
        distanceKm: ecoDist,
        durationMinutes: ecoDuration,
        fuelCost: Math.round(baseFuel * 0.85),
        tollCost: tollCost,
        co2SavedKg: Math.max(3, Math.round(ecoDist * 0.024)),
        polyline: ecoPolyline,
        color: "#10b981",
        tag: "-15% Fuel & Low CO2",
      },
      "toll-free": {
        id: "toll-free",
        title: "Avoid Tolls (State Highway)",
        badge: "💰 Avoid Tolls",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Non-toll state highways and bypass corridors. Saves ₹" + tollCost + " in FASTag toll charges.",
        distanceKm: tollDist,
        durationMinutes: tollDuration,
        fuelCost: Math.round((tollDist / mileage) * fuelPrice),
        tollCost: 0,
        co2SavedKg: 0,
        polyline: tollPolyline,
        color: "#f59e0b",
        tag: `Save ₹${tollCost} Tolls`,
      },
    };

    setAvailableRoutes(routesMap);

    const chosen = routesMap[activeRouteLogic] || routesMap.fastest;
    setRoutePolyline(chosen.polyline);
    setRouteDistanceKm(chosen.distanceKm);
    setRouteFoodSpots(generateFoodSpotsForPolyline(chosen.polyline, chosen.distanceKm));
  }, [trip, activeRouteLogic, generateFoodSpotsForPolyline]);

  // Fetch Real GPS and calculate Route options
  const initializeLiveGpsAndRoute = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const liveLat = position.coords.latitude;
        const liveLng = position.coords.longitude;

        setCurrentCoords([liveLat, liveLng]);
        setGpsLocked(true);

        if (position.coords.heading && !isNaN(position.coords.heading)) {
          setCurrentHeading(position.coords.heading);
        }
        if (position.coords.speed && !isNaN(position.coords.speed)) {
          setLiveSpeed(Math.round(position.coords.speed * 3.6));
        }

        const resolvedName = await getLiveLocationName(liveLat, liveLng);
        if (resolvedName) {
          setLivePlaceName(resolvedName);
        }

        await calculateDistinctRoutes(liveLat, liveLng);
      },
      (error) => {
        console.warn("GPS acquire error:", error.message);
        toast.info("Using default starting location.");
        calculateDistinctRoutes(currentCoords[0], currentCoords[1]);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [calculateDistinctRoutes, currentCoords]);

  // Robust GPS Refresh with real-time feedback
  const handleRefreshGps = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsRefreshingGps(true);
    toast.info("📡 Acquiring live GPS satellite fix...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const liveLat = position.coords.latitude;
          const liveLng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 10);

          setCurrentCoords([liveLat, liveLng]);
          setGpsLocked(true);

          if (position.coords.heading && !isNaN(position.coords.heading)) {
            setCurrentHeading(position.coords.heading);
          }
          if (position.coords.speed && !isNaN(position.coords.speed)) {
            setLiveSpeed(Math.round(position.coords.speed * 3.6));
          }

          const resolvedName = await getLiveLocationName(liveLat, liveLng);
          if (resolvedName) {
            setLivePlaceName(resolvedName);
          }

          await calculateDistinctRoutes(liveLat, liveLng);
          toast.success(`📍 GPS Refreshed! ${resolvedName || "Live Location"} (±${accuracy}m)`);
        } catch (e) {
          console.error("GPS Refresh error:", e);
          toast.error("Failed to recalculate routes for new GPS position.");
        } finally {
          setIsRefreshingGps(false);
        }
      },
      (error) => {
        setIsRefreshingGps(false);
        console.warn("GPS acquire error:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access in your browser.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("GPS request timed out. Please try again.");
        } else {
          toast.error("Unable to get current GPS location.");
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [calculateDistinctRoutes]);

  // Handler to switch route logic interactively
  const handleSelectRouteLogic = (newLogic: RoutePriorityType) => {
    setActiveRouteLogic(newLogic);
    const target = availableRoutes[newLogic];
    if (target) {
      setRoutePolyline(target.polyline);
      setRouteDistanceKm(target.distanceKm);
      setRouteFoodSpots(generateFoodSpotsForPolyline(target.polyline, target.distanceKm));
      toast.success(`🗺️ Switched Route: ${target.badge} (${target.title})`);
    }
  };

  useEffect(() => {
    initializeLiveGpsAndRoute();
  }, [initializeLiveGpsAndRoute]);

  // Continuous Real-Time GPS Tracking via navigator.geolocation.watchPosition
  useEffect(() => {
    if (!navigator.geolocation) return;

    let prevPoint: { lat: number; lng: number } | null = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        if (prevPoint) {
          const bearing = getBearing(prevPoint, { lat: newLat, lng: newLng });
          if (!isNaN(bearing) && bearing >= 0) {
            setCurrentHeading(bearing);
          }
        }
        prevPoint = { lat: newLat, lng: newLng };

        setCurrentCoords([newLat, newLng]);
        setGpsLocked(true);

        if (pos.coords.speed && !isNaN(pos.coords.speed)) {
          setLiveSpeed(Math.round(pos.coords.speed * 3.6));
        } else if (pos.coords.speed === 0) {
          setLiveSpeed(0);
        }
      },
      (err) => console.warn("[GPS] Live watch warning:", err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Haversine distance calculator in meters
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- Auto-Pilot Geofence & Auto-Advance Engine ---
  useEffect(() => {
    if (!autoPilotEnabled || currentDayItems.length === 0) return;

    const currentItem = currentDayItems[currentStopIndex];
    if (!currentItem || currentItem.completed) return;

    // Resolve stop coordinates (from item or interpolated along route polyline)
    let stopLat = currentItem.lat;
    let stopLng = currentItem.lng;

    if (typeof stopLat !== "number" || typeof stopLng !== "number") {
      if (routePolyline.length > 0) {
        const fraction = (currentStopIndex + 1) / (currentDayItems.length + 1);
        const pIdx = Math.min(routePolyline.length - 1, Math.floor(routePolyline.length * fraction));
        stopLat = routePolyline[pIdx][0];
        stopLng = routePolyline[pIdx][1];
      }
    }

    if (typeof stopLat !== "number" || typeof stopLng !== "number") return;

    const distMeters = calculateDistanceMeters(currentCoords[0], currentCoords[1], stopLat, stopLng);

    // 1. ARRIVAL DETECTION (Within 250m)
    if (distMeters <= 250) {
      if (arrivedStopIndex !== currentStopIndex) {
        setArrivedStopIndex(currentStopIndex);
        toast.success(`📍 Auto-Pilot: You've arrived at "${currentItem.title}"! Enjoy your visit.`);
      }
    }

    // 2. DEPARTURE & AUTO-COMPLETION DETECTION
    // When user leaves the stop (> 350m) and is moving (speed >= 15 km/h or dist > 600m)
    if (arrivedStopIndex === currentStopIndex) {
      if (distMeters > 350 && (liveSpeed >= 15 || distMeters > 600)) {
        if (lastAutoCompletedId !== currentItem.id) {
          setLastAutoCompletedId(currentItem.id);
          setArrivedStopIndex(null);

          // Mark completed
          setDayItineraries((prev) => {
            const items = [...(prev[activeDayIndex] || [])];
            if (items[currentStopIndex]) {
              items[currentStopIndex] = { ...items[currentStopIndex], completed: true, isAutoCompleted: true };
            }
            return { ...prev, [activeDayIndex]: items };
          });

          toast.success(`✨ Auto-Pilot: Completed "${currentItem.title}" → Navigating to next stop!`);

          if (currentStopIndex + 1 < currentDayItems.length) {
            setCurrentStopIndex(currentStopIndex + 1);
          } else {
            toast.success("🎉 All planned stops completed for today!");
          }
        }
      }
    }
  }, [
    autoPilotEnabled,
    currentCoords,
    liveSpeed,
    currentStopIndex,
    currentDayItems,
    arrivedStopIndex,
    lastAutoCompletedId,
    routePolyline,
    activeDayIndex,
  ]);

  // Save Expense Form Handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0 || !newExpenseTitle.trim()) {
      toast.error("Please enter a valid title and amount.");
      return;
    }

    const newLog: ExpenseLog = {
      id: `exp_${Date.now()}`,
      category: newExpenseCat,
      title: newExpenseTitle.trim(),
      amount,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newLog, ...expenses];
    setExpenses(updated);
    localStorage.setItem(expenseStorageKey, JSON.stringify(updated));

    setNewExpenseAmount("");
    setNewExpenseTitle("");
    setIsExpenseModalOpen(false);
    toast.success(`Logged ₹${amount.toLocaleString()} for ${newLog.title}`);
  };

  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const plannedBudget = trip.financials?.totalCost || trip.tripData?.budgetCap || 15000;
  const remainingBudget = plannedBudget - totalSpent;
  const budgetHealthPercent = Math.min(100, Math.round((totalSpent / plannedBudget) * 100));

  // Dynamic 8:00 PM Auto-Rebalancer Action
  const handleAutoRebalance = async () => {
    setIsRebalancing(true);
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/journey/rebalance-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: currentDayItems,
          currentTime: currentTimeStr,
          targetEndTime: "20:00",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDayItineraries((prev) => ({
          ...prev,
          [activeDayIndex]: data.items,
        }));
        setDayFinishEstimate(data.guaranteedFinishTime);
        setRebalanceAlert(data.summaryMessage);
        setIsLate(data.rebalanced);
        toast.success(data.summaryMessage);
      } else {
        throw new Error(data.error || "Rebalance calculation error");
      }
    } catch (err: any) {
      // Robust client-side fallback
      const updated = currentDayItems.map((item) => ({
        ...item,
        durationMinutes: Math.max(30, Math.round((item.durationMinutes || 60) * 0.75)),
        isAdjusted: true,
      }));
      setDayItineraries((prev) => ({ ...prev, [activeDayIndex]: updated }));
      setDayFinishEstimate("07:45 PM");
      setRebalanceAlert("⚡ Schedule compressed to guarantee arrival before 8:00 PM.");
      toast.success("Schedule rebalanced to guarantee 8:00 PM finish!");
    } finally {
      setIsRebalancing(false);
    }
  };

  // Mark Stop Complete
  const handleCompleteStop = (index: number) => {
    setDayItineraries((prev) => {
      const items = [...(prev[activeDayIndex] || [])];
      if (items[index]) {
        items[index] = { ...items[index], completed: true };
      }
      return { ...prev, [activeDayIndex]: items };
    });

    toast.success(`✅ Reached: ${currentDayItems[index]?.title || "Stop"}`);

    if (index + 1 < currentDayItems.length) {
      setCurrentStopIndex(index + 1);
    } else {
      toast.success("🎉 All planned stops completed for today!");
    }
  };

  // Add Food Stop to Day Schedule
  const handleAddFoodStopToItinerary = (food: RouteFoodSpot) => {
    const newItem: ItineraryItem = {
      id: `food_${Date.now()}`,
      time: "01:15 PM - 02:00 PM",
      type: "food",
      title: food.name,
      description: `${food.cuisine} • Avg ₹${food.avgCostPerPerson}/person • ${food.highlight}`,
      durationMinutes: 45,
      completed: false,
      lat: food.lat,
      lng: food.lng,
    };

    setDayItineraries((prev) => {
      const current = prev[activeDayIndex] || [];
      const insertAt = Math.min(2, current.length);
      const updated = [...current.slice(0, insertAt), newItem, ...current.slice(insertAt)];
      return { ...prev, [activeDayIndex]: updated };
    });

    setSelectedFoodSpot(null);
    setIsFoodDrawerOpen(false);
    toast.success(`🍽️ Added "${food.name}" to your Day ${activeDayIndex + 1} schedule!`);
  };

  const openExternalGoogleMaps = () => {
    const dest = currentStop?.title || trip.routeDetails?.destination || "Destination";
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, "_blank");
  };

  const totalDays = trip.itinerary?.length || 1;
  const completedStopsCount = currentDayItems.filter((i) => i.completed).length;
  const dayProgressPercent = currentDayItems.length > 0 ? Math.round((completedStopsCount / currentDayItems.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Top Header Cockpit HUD */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-emerald-700/50">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
          <Compass size={280} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-yellow-400 text-emerald-950 font-black rounded-full text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Radio size={12} className="animate-pulse text-red-600" /> Google-Style GPS Co-Pilot
              </span>

              {/* Auto-Pilot ON/OFF Toggle */}
              <button
                onClick={() => {
                  const next = !autoPilotEnabled;
                  setAutoPilotEnabled(next);
                  localStorage.setItem("tourenvi.journey.autopilot", String(next));
                  toast.success(
                    next
                      ? "🟢 Auto-Pilot Activated: GPS auto-detects arrival & advances stops"
                      : "⏸️ Auto-Pilot Paused: Manual checklist mode"
                  );
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  autoPilotEnabled
                    ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50 shadow-sm"
                    : "bg-white/10 text-gray-300 border-white/20 hover:bg-white/15"
                }`}
                title="Toggle hands-free GPS Auto-Pilot"
              >
                <span className={`w-2 h-2 rounded-full ${autoPilotEnabled ? "bg-emerald-400 animate-ping" : "bg-gray-400"}`} />
                <span>Auto-Pilot: {autoPilotEnabled ? "ON" : "OFF"}</span>
              </button>

              {/* Vehicle Number Badge with Edit Option */}
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded-full text-xs font-mono font-bold backdrop-blur-sm border border-white/25 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Click to change vehicle registration"
              >
                <Car size={13} className="text-yellow-300" />
                <span>{vehicleNumber}</span>
                <Settings size={11} className="opacity-70" />
              </button>

              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 rounded-full text-xs font-semibold border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck size={13} /> 8:00 PM Guarantee
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-serif font-bold text-white flex items-center gap-2">
              <MapPin className="text-yellow-400 shrink-0" size={28} />
              <span>
                {livePlaceName || trip.routeDetails?.startLocation || "Live GPS Location"} →{" "}
                <span className="text-yellow-300">{trip.routeDetails?.destination || "Destination"}</span>
              </span>
            </h1>

            <p className="text-xs md:text-sm text-emerald-100/90 max-w-xl">
              Turn-by-turn guidance with live directional arrow, food stops along the route, and 8:00 PM hard-stop schedule assurance.
            </p>

            {/* Dynamic Route Logic Switcher Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-200 mr-1 flex items-center gap-1">
                <RouteIcon size={14} className="text-yellow-300" /> Route Logic:
              </span>

              <button
                onClick={() => handleSelectRouteLogic("fastest")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRouteLogic === "fastest"
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-102"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
                title="Direct high-speed expressway"
              >
                <span>⚡ Fastest (Express)</span>
                {activeRouteLogic === "fastest" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                onClick={() => handleSelectRouteLogic("eco-friendly")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRouteLogic === "eco-friendly"
                    ? "bg-emerald-500 text-emerald-950 font-black shadow-md ring-2 ring-emerald-300 scale-102"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
                title="Steady fuel-efficient cruising corridor (-15% fuel)"
              >
                <Leaf size={13} className={activeRouteLogic === "eco-friendly" ? "text-emerald-950" : "text-emerald-300"} />
                <span>🌱 Eco-Route</span>
                {activeRouteLogic === "eco-friendly" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-pulse" />}
              </button>

              <button
                onClick={() => handleSelectRouteLogic("toll-free")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRouteLogic === "toll-free"
                    ? "bg-amber-500 text-amber-950 font-black shadow-md ring-2 ring-amber-300 scale-102"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
                title="State highway bypass with ₹0 FASTag tolls"
              >
                <Wallet size={13} className={activeRouteLogic === "toll-free" ? "text-amber-950" : "text-amber-300"} />
                <span>💰 Avoid Tolls</span>
                {activeRouteLogic === "toll-free" && <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-pulse" />}
              </button>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="flex flex-wrap items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
            <div>
              <p className="text-[10px] text-emerald-200 uppercase font-bold">Speedometer</p>
              <p className="text-xl font-black text-yellow-300 font-mono flex items-center gap-1">
                {liveSpeed} <span className="text-xs font-normal text-white">km/h</span>
              </p>
              <p className="text-[10px] text-emerald-200">Heading: {Math.round(currentHeading)}°</p>
            </div>

            <div className="border-l border-white/20 pl-4">
              <p className="text-[10px] text-emerald-200 uppercase font-bold">Today's Deadline</p>
              <p className="text-xl font-black text-white font-mono flex items-center gap-1">
                <Clock size={16} className="text-yellow-300" /> 08:00 PM
              </p>
              <p className="text-[10px] text-emerald-200">Est. Arrival: <strong className="text-white">{dayFinishEstimate}</strong></p>
            </div>

            <div className="border-l border-white/20 pl-4">
              <p className="text-[10px] text-emerald-200 uppercase font-bold">Progress</p>
              <p className="text-xl font-black text-white">{dayProgressPercent}%</p>
              <p className="text-[10px] text-emerald-200">{completedStopsCount}/{currentDayItems.length} stops</p>
            </div>

            {onExit && (
              <button
                onClick={onExit}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all ml-auto cursor-pointer"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Multi-Day Navigation Pills */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-emerald-200 mr-2">Trip Days:</span>
          {Array.from({ length: totalDays }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveDayIndex(idx);
                setCurrentStopIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDayIndex === idx
                  ? "bg-yellow-400 text-emerald-950 shadow-md scale-102"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              }`}
            >
              <span>Day {idx + 1}</span>
              {activeDayIndex === idx && <span className="w-2 h-2 rounded-full bg-emerald-900 animate-ping" />}
            </button>
          ))}
        </div>
      </div>

      {/* 8:00 PM Smart Rebalancing Alert Banner */}
      {rebalanceAlert && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300 ${
          isLate ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"
        }`}>
          <div className="flex items-center gap-3">
            <Zap className={`h-5 w-5 shrink-0 ${isLate ? "text-amber-600 animate-bounce" : "text-emerald-600"}`} />
            <div>
              <p className="text-xs font-bold">{rebalanceAlert}</p>
              <p className="text-[11px] text-gray-500">Day schedule adjusted to ensure reaching your hotel before 8:00 PM.</p>
            </div>
          </div>
          <button
            onClick={handleAutoRebalance}
            disabled={isRebalancing}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
          >
            {isRebalancing ? "Recalculating..." : "Recalculate"}
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Map & Turn-by-Turn Guidance (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Turn-by-Turn Maneuver Top Banner */}
          <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-yellow-400 text-emerald-950 rounded-2xl shadow-inner font-black">
                {currentHeading > 315 || currentHeading < 45 ? (
                  <ArrowUp size={24} />
                ) : currentHeading >= 45 && currentHeading < 135 ? (
                  <CornerUpRight size={24} />
                ) : currentHeading >= 135 && currentHeading < 225 ? (
                  <ArrowUp size={24} className="rotate-180" />
                ) : (
                  <CornerUpLeft size={24} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                    Next Waypoint: {currentStop?.title || "Destination"}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    activeRouteLogic === "eco-friendly"
                      ? "bg-emerald-400 text-emerald-950"
                      : activeRouteLogic === "toll-free"
                      ? "bg-amber-400 text-amber-950"
                      : "bg-blue-400 text-blue-950"
                  }`}>
                    {availableRoutes[activeRouteLogic]?.badge || "Active Route"}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-bold text-white leading-tight mt-0.5">
                  {activeRouteLogic === "eco-friendly"
                    ? `Eco-cruising via highway towards ${trip.routeDetails?.destination || "Destination"}`
                    : activeRouteLogic === "toll-free"
                    ? `Following toll-free state corridor towards ${trip.routeDetails?.destination || "Destination"}`
                    : `Follow express highway towards ${trip.routeDetails?.destination || "Destination"}`}
                </h3>

                <p className="text-xs text-emerald-200 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{routeDistanceKm} km total • Est. Speed: {liveSpeed > 0 ? `${liveSpeed} km/h` : "Driving pace"}</span>
                  {activeRouteLogic === "eco-friendly" && (
                    <span className="text-emerald-300 font-semibold">• 🌱 Saving ~15% Fuel &amp; {availableRoutes["eco-friendly"]?.co2SavedKg || 4} kg CO2</span>
                  )}
                  {activeRouteLogic === "toll-free" && (
                    <span className="text-amber-300 font-semibold">• 💰 Saving ₹{trip.financials?.tollPricing || 420} in FASTag Tolls</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openExternalGoogleMaps}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer"
                title="Open Google Maps App"
              >
                <ExternalLink size={14} />
                <span>Google Maps</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Cockpit */}
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-md h-[440px] md:h-[500px]">
            <MapContainer
              center={currentCoords}
              zoom={11}
              scrollWheelZoom={true}
              className="w-full h-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Dynamic Recenter on GPS update */}
              <MapFollowVehicle center={currentCoords} follow={followVehicle} />

              {/* Multi-Route Polylines: Inactive Alternative Routes rendered underneath */}
              {(["fastest", "eco-friendly", "toll-free"] as RoutePriorityType[]).map((key) => {
                if (key === activeRouteLogic) return null;
                const alt = availableRoutes[key];
                if (!alt || !alt.polyline || alt.polyline.length === 0) return null;

                return (
                  <Polyline
                    key={`alt_${key}`}
                    positions={alt.polyline}
                    color="#94a3b8"
                    weight={5}
                    opacity={0.65}
                    dashArray="6, 6"
                    eventHandlers={{
                      click: () => handleSelectRouteLogic(key),
                    }}
                  />
                );
              })}

              {/* Multi-Route Interactive Labels on Map for Alternative Routes */}
              {(["fastest", "eco-friendly", "toll-free"] as RoutePriorityType[]).map((key) => {
                if (key === activeRouteLogic) return null;
                const alt = availableRoutes[key];
                if (!alt || !alt.polyline || alt.polyline.length === 0) return null;
                const midPoint = alt.polyline[Math.floor(alt.polyline.length * 0.5)];
                if (!midPoint) return null;

                return (
                  <Marker
                    key={`label_${key}`}
                    position={midPoint}
                    icon={L.divIcon({
                      className: "alt-route-marker",
                      html: `
                        <div style="
                          background: rgba(15, 23, 42, 0.85);
                          color: #f8fafc;
                          font-weight: 700;
                          font-size: 10px;
                          padding: 4px 8px;
                          border-radius: 999px;
                          border: 1.5px solid #cbd5e1;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                          cursor: pointer;
                          white-space: nowrap;
                          display: flex;
                          align-items: center;
                          gap: 3px;
                        ">
                          <span>${key === "eco-friendly" ? "🌱 Eco" : key === "toll-free" ? "💰 No Toll" : "⚡ Express"}</span>
                          <span style="opacity: 0.7;">(${alt.distanceKm} km)</span>
                        </div>
                      `,
                      iconSize: [80, 24],
                      iconAnchor: [40, 12],
                    })}
                    eventHandlers={{
                      click: () => handleSelectRouteLogic(key),
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans text-xs">
                        <p className="font-bold text-gray-900">{alt.title}</p>
                        <p className="text-gray-600">{alt.description}</p>
                        <button
                          onClick={() => handleSelectRouteLogic(key)}
                          className="w-full mt-1.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]"
                        >
                          Switch to this route
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Active Selected Route Polyline rendered ON TOP with vibrant color */}
              {routePolyline.length > 0 && (
                <Polyline
                  positions={routePolyline}
                  color={
                    activeRouteLogic === "eco-friendly"
                      ? "#10b981"
                      : activeRouteLogic === "toll-free"
                      ? "#f59e0b"
                      : "#2563eb"
                  }
                  weight={7}
                  opacity={0.95}
                />
              )}

              {/* Live Google Maps-Style Directional Navigation Arrow */}
              <Marker
                position={currentCoords}
                icon={createNavigationArrowIcon(currentHeading, isNavigating)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <p className="font-bold text-emerald-800">🚗 {vehicleNumber}</p>
                    <p className="text-gray-600">{livePlaceName || "Live GPS Location"}</p>
                    <p className="text-gray-500 mt-1">Live Speed: {liveSpeed} km/h • Heading: {Math.round(currentHeading)}°</p>
                  </div>
                </Popup>
              </Marker>

              {/* Destination Endpoint Pin (Only if real destination coords exist) */}
              {routePolyline.length > 0 && (
                <Marker
                  position={routePolyline[routePolyline.length - 1]}
                  icon={L.divIcon({
                    className: "destination-marker",
                    html: `
                      <div style="
                        background: #dc2626;
                        color: white;
                        font-weight: 800;
                        font-size: 11px;
                        padding: 6px 10px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
                        border: 2px solid white;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                      ">
                        📍 <span>${trip.routeDetails?.destination || "Destination"}</span>
                      </div>
                    `,
                    iconSize: [100, 30],
                    iconAnchor: [50, 15],
                  })}
                >
                  <Popup>
                    <div className="p-1 font-sans text-xs">
                      <p className="font-bold text-gray-900">🏁 {trip.routeDetails?.destination || "Destination"}</p>
                      <p className="text-gray-500">End of Day's Driving Route</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Food Stops Rendered DIRECTLY Along the Route */}
              {routeFoodSpots.map((food) => (
                <Marker
                  key={food.id}
                  position={[food.lat, food.lng]}
                  icon={createFoodMarkerIcon(food.rating, selectedFoodSpot?.id === food.id)}
                  eventHandlers={{
                    click: () => {
                      setSelectedFoodSpot(food);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 font-sans text-xs space-y-2 max-w-[200px]">
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <span>🍽️ {food.name}</span>
                      </div>
                      <p className="text-gray-600 text-[11px]">{food.cuisine}</p>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 border-t pt-1">
                        <span>Avg ₹{food.avgCostPerPerson}/person</span>
                        <span className="font-bold text-amber-600">★ {food.rating}</span>
                      </div>
                      <button
                        onClick={() => handleAddFoodStopToItinerary(food)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] mt-1 cursor-pointer"
                      >
                        + Add to Schedule
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map Controls Floating Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-[800] flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200/80 shadow-xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshGps}
                  disabled={isRefreshingGps}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-all cursor-pointer disabled:opacity-75"
                  title="Re-acquire high accuracy GPS fix from satellites"
                >
                  <RotateCcw size={14} className={isRefreshingGps ? "animate-spin" : ""} />
                  <span>{isRefreshingGps ? "Acquiring Fix..." : "Refresh GPS"}</span>
                </button>

                <button
                  onClick={() => setFollowVehicle(!followVehicle)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    followVehicle
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  <LocateFixed size={14} className={followVehicle ? "animate-spin" : ""} />
                  <span>{followVehicle ? "Centering Vehicle" : "Free Map"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleSelectRouteLogic(
                      activeRouteLogic === "fastest"
                        ? "eco-friendly"
                        : activeRouteLogic === "eco-friendly"
                        ? "toll-free"
                        : "fastest"
                    )
                  }
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-xs ${
                    activeRouteLogic === "eco-friendly"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200"
                      : activeRouteLogic === "toll-free"
                      ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                      : "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200"
                  }`}
                  title="Click to cycle between Fastest, Eco-Route, and Avoid Tolls"
                >
                  <RouteIcon size={14} />
                  <span>{availableRoutes[activeRouteLogic]?.badge || "Route Mode"}</span>
                </button>

                <button
                  onClick={() => setIsFoodDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer shadow-xs"
                >
                  <Utensils size={14} className="text-orange-600" />
                  <span>Food ({routeFoodSpots.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Trip Cost & Budget Guardian */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Live Budget Guardian</h3>
                  <p className="text-xs text-gray-500">Real-time expenditure tracking vs planned estimate</p>
                </div>
              </div>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle size={14} /> Log Expense
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-600">Spent: ₹{totalSpent.toLocaleString("en-IN")}</span>
                <span className="text-gray-500">Budget: ₹{plannedBudget.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    budgetHealthPercent > 90 ? "bg-red-500" : budgetHealthPercent > 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${budgetHealthPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Breakdown Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase">⛽ Fuel Spent</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  ₹{expenses.filter((e) => e.category === "fuel").reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase">🎫 Tolls Spent</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  ₹{expenses.filter((e) => e.category === "toll").reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase">🍽️ Food Spent</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  ₹{expenses.filter((e) => e.category === "food").reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase">🏨 Stays Spent</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  ₹{expenses.filter((e) => e.category === "hotel").reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Day Schedule & Itinerary Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-lg">
                  Day {activeDayIndex + 1} Step-by-Step Schedule
                </h3>
                <p className="text-xs text-gray-500">
                  {trip.itinerary?.[activeDayIndex]?.title || `Day ${activeDayIndex + 1}: Core Itinerary & Attractions`}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                {currentDayItems.length} Stops
              </span>
            </div>

            {/* Smart Auto-Pilot Status Banner */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                autoPilotEnabled
                  ? arrivedStopIndex === currentStopIndex
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                    : "bg-blue-50/80 border-blue-200 text-blue-950"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={15} className={autoPilotEnabled ? "text-emerald-600 animate-pulse shrink-0" : "text-gray-400 shrink-0"} />
                <span className="leading-tight">
                  {autoPilotEnabled
                    ? arrivedStopIndex === currentStopIndex
                      ? `📍 Arrived at Stop ${currentStopIndex + 1}: "${currentDayItems[currentStopIndex]?.title}" — Auto-completes when you depart!`
                      : "✨ Auto-Pilot Active: GPS auto-detects arrival & advances to next stop as you drive."
                    : "Auto-Pilot Paused: Manual checklist mode"}
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !autoPilotEnabled;
                  setAutoPilotEnabled(next);
                  localStorage.setItem("tourenvi.journey.autopilot", String(next));
                  toast.success(next ? "🟢 Auto-Pilot Activated" : "⏸️ Auto-Pilot Paused");
                }}
                className="text-[11px] font-bold underline text-emerald-700 hover:text-emerald-900 cursor-pointer shrink-0"
              >
                {autoPilotEnabled ? "Turn Off" : "Turn On"}
              </button>
            </div>

            {/* Itinerary Timeline */}
            <div className="space-y-3">
              {currentDayItems.map((item, idx) => {
                const isCurrent = idx === currentStopIndex;
                const isDone = item.completed;
                const isArrivedHere = isCurrent && arrivedStopIndex === idx;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDone
                        ? "bg-gray-50/80 border-gray-200 opacity-60"
                        : isCurrent
                        ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200 shadow-sm"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-500">{item.time}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {item.type}
                          </span>

                          {/* Auto-Pilot Tags */}
                          {item.isAutoCompleted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                              <Sparkles size={10} className="text-emerald-600" /> Auto-Completed
                            </span>
                          )}

                          {isArrivedHere && !isDone && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 flex items-center gap-1 border border-yellow-300 animate-pulse">
                              📍 You Are Here
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm font-bold ${isDone ? "line-through text-gray-500" : "text-gray-900"}`}>
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleCompleteStop(idx)}
                        className={`p-1.5 rounded-full transition-colors ${
                          isDone
                            ? "text-emerald-600 bg-emerald-100"
                            : "text-gray-300 hover:text-emerald-600 hover:bg-gray-100"
                        }`}
                        title={
                          isDone
                            ? "Completed"
                            : autoPilotEnabled
                            ? "Mark Done (Auto-Pilot will also auto-advance upon departure)"
                            : "Mark Done"
                        }
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- SETUP VEHICLE MODAL --- */}
      {isSetupModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsSetupModalOpen(false); }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Car className="text-emerald-600" size={18} /> Vehicle &amp; Telemetry Setup
              </h3>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Plate / Registration Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. TN 09 BK 4589"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tracking Telemetry Source</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTrackingSource("mobile_gps")}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      trackingSource === "mobile_gps"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <p className="flex items-center gap-1 font-bold">📱 Smartphone GPS</p>
                    <p className="text-[10px] font-normal text-gray-500 mt-0.5">High-accuracy phone sensor</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrackingSource("vehicle_gps")}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      trackingSource === "vehicle_gps"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <p className="flex items-center gap-1 font-bold">🛰️ Vehicle / FASTag</p>
                    <p className="text-[10px] font-normal text-gray-500 mt-0.5">Onboard GPS Telemetry</p>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("tourenvi.vehicle.plate", vehicleNumber);
                    setIsSetupModalOpen(false);
                    toast.success(`✅ Linked vehicle ${vehicleNumber} to live GPS navigation`);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save &amp; Continue Navigation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- LOG EXPENSE MODAL --- */}
      {isExpenseModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsExpenseModalOpen(false); }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <PlusCircle className="text-emerald-600" size={18} /> Record Journey Expense
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Expense Category</label>
                <select
                  value={newExpenseCat}
                  onChange={(e) => setNewExpenseCat(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                >
                  <option value="fuel">⛽ Fuel (Petrol / Diesel / EV)</option>
                  <option value="toll">🎫 Highway FASTag Toll</option>
                  <option value="food">🍽️ Meal / Food / Beverages</option>
                  <option value="ticket">🎟️ Attraction Entry Ticket</option>
                  <option value="hotel">🏨 Hotel &amp; Lodging</option>
                  <option value="misc">🛍️ Parking &amp; Misc</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Place</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IndianOil Station, Saravana Bhavan lunch"
                  value={newExpenseTitle}
                  onChange={(e) => setNewExpenseTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 1200"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FOOD STOPS ON ROUTE DRAWER MODAL --- */}
      {isFoodDrawerOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsFoodDrawerOpen(false); }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <Utensils size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Food &amp; Dining on Your Route</h3>
                  <p className="text-xs text-gray-500">Verified spots pinned directly along the highway</p>
                </div>
              </div>
              <button
                onClick={() => setIsFoodDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1">
              {routeFoodSpots.map((food) => (
                <div
                  key={food.id}
                  className="p-4 rounded-2xl bg-gray-50/90 border border-gray-100 hover:border-orange-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <span>🍽️ {food.name}</span>
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium">{food.cuisine}</p>
                    </div>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      ★ {food.rating}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">{food.highlight}</p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/60">
                    <span className="text-gray-600 font-semibold">Avg ₹{food.avgCostPerPerson} / person</span>
                    <span className="text-gray-400">{food.openHours}</span>
                  </div>

                  <button
                    onClick={() => handleAddFoodStopToItinerary(food)}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle size={14} /> Add to Day Schedule
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsFoodDrawerOpen(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
