import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Clock,
  Route,
  Loader2,
  Ticket,
  Eye,
  EyeOff,
  Globe,
  PlusCircle,
  Download,
  LocateFixed,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useOfflineMap } from "@/hooks/useOfflineMap";

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom toll icon
const tollIcon = new L.DivIcon({
  className: "custom-toll-icon",
  html: `<div style="
    width: 22px; height: 22px; border-radius: 50%;
    background: #ea580c; border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// --- REAL TOLL DATASET (2024-2025 Rates) ---
const TOLL_PLAZAS = [
  {
    id: "t_paranur",
    name: "Paranur Toll Plaza (Chengalpattu)",
    lat: 12.7235,
    lng: 80.0068,
    cost: 70,
  },
  {
    id: "t_athur",
    name: "Athur Toll Plaza (Tindivanam)",
    lat: 12.3353,
    lng: 79.7621,
    cost: 70,
  },
  {
    id: "t_vikravandi",
    name: "Vikravandi Toll Plaza",
    lat: 12.0658,
    lng: 79.5372,
    cost: 105,
  },
  {
    id: "t_sengurichi",
    name: "Sengurichi Toll Plaza (Ulundurpet)",
    lat: 11.699,
    lng: 79.289,
    cost: 65,
  },
  {
    id: "t_veeracholapuram",
    name: "Veeracholapuram Toll Plaza",
    lat: 11.648,
    lng: 78.95,
    cost: 65,
  },
  {
    id: "t_nathakkarai",
    name: "Nathakkarai Toll Plaza",
    lat: 11.65,
    lng: 78.65,
    cost: 65,
  },
  {
    id: "t_mettupatti",
    name: "Mettupatti Toll Plaza (Salem)",
    lat: 11.5833,
    lng: 78.4321,
    cost: 65,
  },
  {
    id: "t_sriperumbudur",
    name: "Sriperumbudur Toll Plaza",
    lat: 12.9432,
    lng: 79.9821,
    cost: 50,
  },
  {
    id: "t_chennasamudram",
    name: "Chennasamudram Toll Plaza",
    lat: 12.8643,
    lng: 79.4321,
    cost: 45,
  },
  {
    id: "t_pallikonda",
    name: "Pallikonda Toll Plaza",
    lat: 12.899,
    lng: 78.95,
    cost: 110,
  },
  {
    id: "t_vaniyambadi",
    name: "Vaniyambadi Toll Plaza",
    lat: 12.65,
    lng: 78.65,
    cost: 105,
  },
  {
    id: "t_krishnagiri",
    name: "Krishnagiri Toll Plaza",
    lat: 12.5401,
    lng: 78.1924,
    cost: 85,
  },
  {
    id: "t_thoppur",
    name: "Thoppur Toll Plaza",
    lat: 11.9361,
    lng: 78.0772,
    cost: 120,
  },
  {
    id: "t_omallur",
    name: "Omallur Toll Plaza",
    lat: 11.7056,
    lng: 78.0967,
    cost: 95,
  },
  {
    id: "t_vaiguntam",
    name: "Vaiguntam Toll Plaza",
    lat: 11.5542,
    lng: 77.9254,
    cost: 75,
  },
  {
    id: "t_vijayamangalam",
    name: "Vijayamangalam Toll Plaza",
    lat: 11.2341,
    lng: 77.5123,
    cost: 70,
  },
  {
    id: "t_kaniyur",
    name: "Kaniyur Toll Plaza (Chengapalli)",
    lat: 11.0832,
    lng: 77.1654,
    cost: 120,
  },
  {
    id: "t_burliar",
    name: "Burliar Toll Gate (Ooty Entry)",
    lat: 11.345,
    lng: 76.8,
    cost: 30,
  },
];

interface TollMarker {
  lat: number;
  lng: number;
  name: string;
  cost: number;
}

interface RouteOption {
  id: string;
  name: string;
  distance: string;
  duration: string;
  tollCost: number;
  tollCount: number;
  type: "fastest" | "eco" | "scenic";
  description: string;
  highlights: string[];
}

interface SegmentLabel {
  lat: number;
  lng: number;
  text: string;
}

interface VerifiedAttraction {
  id: string;
  name: string;
  destination: string;
  lat: number;
  lng: number;
}

type RoutePlannerProps = {
  initialOrigin?: string;
  initialDestination?: string;
  autoPlanOnPrefill?: boolean;
  hideHeader?: boolean;
  onRouteComputed?: (data: { distanceKm: number; tollCost: number }) => void;
};

const dangerZones = [
  {
    name: "Bandipur",
    lat: 11.6854,
    lng: 76.6322,
    radius: 15000,
    severity: "red",
    warning: "Wildlife crossing region",
  },
  {
    name: "Kaziranga",
    lat: 26.5775,
    lng: 93.1711,
    radius: 20000,
    severity: "red",
    warning: "Core wildlife reserve",
  },
  {
    name: "Aarey Forest",
    lat: 19.1526,
    lng: 72.8728,
    radius: 8000,
    severity: "orange",
    warning: "Restricted forest corridors",
  },
  {
    name: "Jim Corbett",
    lat: 29.53,
    lng: 78.7747,
    radius: 25000,
    severity: "red",
    warning: "Tiger reserve movement zone",
  },
];

const hiddenGemIcon = new L.DivIcon({
  className: "hidden-gem-marker",
  html: `<div style="font-size:18px;color:#d4af37;text-shadow:0 2px 4px rgba(0,0,0,.4)">★</div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Helper: Haversine distance in km
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: Point-to-segment distance
function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return haversineDistance(px, py, ax, ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return haversineDistance(px, py, ax + t * dx, ay + t * dy);
}

// Calculate tolls near a route polyline
function calculateTollsOnRoute(routeCoords: [number, number][]): {
  count: number;
  cost: number;
  markers: TollMarker[];
} {
  const foundTolls: TollMarker[] = [];
  let totalCost = 0;
  const TOLERANCE_KM = 1.5;

  TOLL_PLAZAS.forEach((toll) => {
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const dist = pointToSegmentDistance(
        toll.lat,
        toll.lng,
        routeCoords[i][0],
        routeCoords[i][1],
        routeCoords[i + 1][0],
        routeCoords[i + 1][1],
      );
      if (dist < TOLERANCE_KM) {
        foundTolls.push({
          lat: toll.lat,
          lng: toll.lng,
          name: toll.name,
          cost: toll.cost,
        });
        totalCost += toll.cost;
        break;
      }
    }
  });

  return { count: foundTolls.length, cost: totalCost, markers: foundTolls };
}

// Helper: format seconds to human readable duration
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
}

// Helper: format meters to km
function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

// Decode OSRM polyline (polyline6 format uses precision 6, standard uses 5)
function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0,
    lat = 0,
    lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let shift = 0,
      result = 0,
      byte: number;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

// Component to auto-fit the map to bounds
const FitBounds = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  return null;
};

const RoutePlanner = ({
  initialOrigin = "",
  initialDestination = "",
  autoPlanOnPrefill = false,
  hideHeader = false,
  onRouteComputed,
}: RoutePlannerProps) => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Map State
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(
    null,
  );
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [activeTolls, setActiveTolls] = useState<TollMarker[]>([]);
  const [showTolls, setShowTolls] = useState(false);
  const [useSatellite, setUseSatellite] = useState(false);
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showHiddenGems, setShowHiddenGems] = useState(true);
  const [showMemberLocations, setShowMemberLocations] = useState(false);
  const [segmentLabels, setSegmentLabels] = useState<SegmentLabel[]>([]);
  const [verifiedAttractions, setVerifiedAttractions] = useState<
    VerifiedAttraction[]
  >([]);
  const { isOnline, bannerText, cacheTrip } = useOfflineMap();
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const lastAutoPlanKey = useRef("");

  // Geocode a place name using Nominatim (free, no API key)
  const geocode = async (
    query: string,
  ): Promise<{ lat: number; lng: number; display: string } | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display: data[0].display_name,
        };
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
    return null;
  };

  const getDistanceData = async () => {
    if (!origin || !destination) {
      alert("Enter both origin and destination");
      return;
    }

    setLoading(true);
    setRouteCoords([]);
    setActiveTolls([]);
    setRoutes([]);
    setShowTolls(true);

    try {
      // 1. Geocode both places
      const [originGeo, destGeo] = await Promise.all([
        geocode(origin),
        geocode(destination),
      ]);

      if (!originGeo || !destGeo) {
        alert(
          "Could not find one or both locations. Try being more specific (e.g. 'Chennai, India').",
        );
        setLoading(false);
        return;
      }

      setOriginCoords([originGeo.lat, originGeo.lng]);
      setDestCoords([destGeo.lat, destGeo.lng]);

      // 2. Get route from OSRM (free, no API key)
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originGeo.lng},${originGeo.lat};${destGeo.lng},${destGeo.lat}?overview=full&geometries=polyline&steps=true`;

      const routeRes = await fetch(osrmUrl);
      const routeData = await routeRes.json();

      if (
        routeData.code !== "Ok" ||
        !routeData.routes ||
        routeData.routes.length === 0
      ) {
        alert("Could not find a driving route between these locations.");
        setLoading(false);
        return;
      }

      const bestRoute = routeData.routes[0];
      const coords = decodePolyline(bestRoute.geometry, 5);
      setRouteCoords(coords);

      const steps = bestRoute.legs?.[0]?.steps || [];
      const labels = [];
      for (
        let i = 0;
        i < steps.length;
        i += Math.max(1, Math.floor(steps.length / 8))
      ) {
        const step = steps[i];
        if (!step?.maneuver?.location) continue;
        labels.push({
          lat: step.maneuver.location[1],
          lng: step.maneuver.location[0],
          text: `~${Math.max(1, Math.round(step.duration / 60))} min`,
        });
      }
      setSegmentLabels(labels);

      // 3. Calculate tolls
      const tollData = calculateTollsOnRoute(coords);
      setActiveTolls(tollData.markers);

      // 4. Build route info
      const routeSummary = bestRoute.legs[0]?.summary || "Driving Route";
      const routeOption: RouteOption = {
        id: "0",
        name: routeSummary || "Fastest Route",
        distance: formatDistance(bestRoute.distance),
        duration: formatDuration(bestRoute.duration),
        tollCost: tollData.cost,
        tollCount: tollData.count,
        type: "fastest",
        description: `${originGeo.display.split(",")[0]} → ${destGeo.display.split(",")[0]}`,
        highlights: [routeSummary],
      };

      setRoutes([routeOption]);
      onRouteComputed?.({
        distanceKm: Number((bestRoute.distance / 1000).toFixed(1)),
        tollCost: tollData.cost,
      });
      cacheTrip({
        tripName: `${originGeo.display.split(",")[0]} to ${destGeo.display.split(",")[0]}`,
        destinations: [destGeo.display.split(",")[0]],
      });
    } catch (err) {
      console.error("Route error:", err);
      alert("An error occurred while fetching the route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToFuelEstimator = (distanceText: string) => {
    const km = parseFloat(distanceText.replace(/[^\d.]/g, ""));
    if (!isNaN(km)) {
      navigate(`/?distance=${km}#fuel-estimator`);
    }
  };

  const handleViewFullMap = () => {
    if (origin && destination) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      window.open(googleMapsUrl, "_blank");
    }
  };

  // Tile layers
  const osmTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const satelliteTileUrl =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const tileAttribution = useSatellite
    ? '&copy; <a href="https://www.esri.com/">Esri</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const defaultCenter: [number, number] = [20.5937, 78.9629];

  useEffect(() => {
    if (initialOrigin && initialOrigin !== origin) {
      setOrigin(initialOrigin);
    }
  }, [initialOrigin, origin]);

  useEffect(() => {
    if (initialDestination && initialDestination !== destination) {
      setDestination(initialDestination);
    }
  }, [initialDestination, destination]);

  useEffect(() => {
    if (!autoPlanOnPrefill) return;
    const routeKey = `${origin.trim().toLowerCase()}::${destination
      .trim()
      .toLowerCase()}`;
    if (!origin.trim() || !destination.trim()) return;
    if (routeKey === lastAutoPlanKey.current) return;

    lastAutoPlanKey.current = routeKey;
    void getDistanceData();
  }, [autoPlanOnPrefill, destination, origin]);

  useEffect(() => {
    const q = query(
      collection(db, "attractions"),
      where("status", "==", "verified"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<VerifiedAttraction, "id">),
        }))
        .filter((item) => {
          if (!destination.trim()) {
            return true;
          }
          return item.destination
            ?.toLowerCase()
            .includes(destination.toLowerCase());
        });
      setVerifiedAttractions(data);
    });

    return () => unsubscribe();
  }, [destination]);

  const locateMe = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setMyLocation([position.coords.latitude, position.coords.longitude]);
      setShowMemberLocations(true);
    });
  };

  const downloadOffline = () => {
    const payload = {
      origin,
      destination,
      routes,
      routeCoords,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tourenvi-route-offline.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="routes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {!hideHeader ? (
          <div className="text-center mb-12">
            <Badge
              variant="outline"
              className="mb-4 py-1 px-4 border-primary/30 bg-primary/5 text-primary"
            >
              <MapPin className="w-3 h-3 mr-2" /> Smart Navigation
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Route & Toll Planner
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get accurate driving directions and{" "}
              <span className="text-primary font-semibold">
                real 2024 toll gate costs
              </span>
              .
            </p>
          </div>
        ) : null}

        <div className="max-w-4xl mx-auto">
          {!isOnline && bannerText && (
            <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              {bannerText}
            </div>
          )}
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-primary" />
                <span>Plan Your Route</span>
              </CardTitle>
              <CardDescription>
                Enter origin & destination to check toll gates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input
                    placeholder="e.g. Chennai"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && getDistanceData()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    placeholder="e.g. Ooty"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && getDistanceData()}
                  />
                </div>
              </div>
              <Button
                onClick={getDistanceData}
                className="w-full md:w-auto"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" /> Find Routes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Fastest Route
              </h3>

              {routes.map((route) => (
                <Card
                  key={route.id}
                  className="cursor-pointer transition-all duration-200 shadow-card hover:shadow-xl ring-2 ring-primary"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 mb-4 md:mb-0">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                          <Navigation className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">
                            {route.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {route.description}
                          </p>
                        </div>
                      </div>
                      <Badge className="w-fit bg-green-600">Recommended</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <MapPin className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">
                          {route.distance}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Distance
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">
                          {route.duration}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Duration
                        </p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900">
                        <Ticket className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                          ₹{route.tollCost}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {route.tollCount > 0
                            ? `${route.tollCount} Gates`
                            : "Total Toll"}
                        </p>
                      </div>
                    </div>

                    {/* Add to Fuel Estimator Button */}
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Button
                        onClick={() => handleAddToFuelEstimator(route.distance)}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Use Distance for Fuel Estimate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Map Card */}
              <Card className="shadow-card relative overflow-hidden">
                <div className="absolute top-4 left-4 z-[1000] flex gap-2">
                  <Button
                    size="sm"
                    variant={showTolls ? "default" : "secondary"}
                    onClick={() => setShowTolls(!showTolls)}
                    className={`shadow-lg border border-input ${
                      showTolls
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "bg-white/90 hover:bg-white text-foreground"
                    }`}
                  >
                    {showTolls ? (
                      <EyeOff className="w-4 h-4 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {showTolls ? "Hide Tolls" : "View Tolls"}
                  </Button>
                  <Button
                    size="sm"
                    variant={useSatellite ? "default" : "secondary"}
                    onClick={() => setUseSatellite(!useSatellite)}
                    className={`shadow-lg border border-input ${
                      useSatellite
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white/90 hover:bg-white text-foreground"
                    }`}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    {useSatellite ? "Show Map" : "Satellite"}
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4 z-[1000]">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/90 hover:bg-white shadow-md"
                    onClick={handleViewFullMap}
                  >
                    Open in Google Maps
                  </Button>
                </div>
                <div className="absolute top-4 right-4 z-[1000] w-52 rounded-md border bg-white/90 p-2 space-y-2 shadow-md">
                  <p className="text-xs font-semibold">Map Controls</p>
                  <Button
                    size="sm"
                    variant={showDangerZones ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setShowDangerZones((prev) => !prev)}
                  >
                    Danger Zones
                  </Button>
                  <Button
                    size="sm"
                    variant={showHiddenGems ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setShowHiddenGems((prev) => !prev)}
                  >
                    Hidden Gems
                  </Button>
                  <Button
                    size="sm"
                    variant={showMemberLocations ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setShowMemberLocations((prev) => !prev)}
                  >
                    Member Locations
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={locateMe}
                  >
                    <LocateFixed className="w-4 h-4 mr-2" /> My Location
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={downloadOffline}
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Offline
                  </Button>
                </div>
                <CardContent className="p-0">
                  <div className="h-[500px] w-full relative bg-muted">
                    <MapContainer
                      center={originCoords || defaultCenter}
                      zoom={7}
                      className="h-full w-full"
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        key={useSatellite ? "satellite" : "osm"}
                        url={useSatellite ? satelliteTileUrl : osmTileUrl}
                        attribution={tileAttribution}
                        maxZoom={19}
                      />

                      {/* Auto-fit bounds */}
                      {routeCoords.length > 0 && (
                        <FitBounds coordinates={routeCoords} />
                      )}

                      {/* Route Polyline */}
                      {routeCoords.length > 0 && (
                        <Polyline
                          positions={routeCoords}
                          pathOptions={{
                            color: useSatellite ? "#00BFFF" : "#1A73E8",
                            weight: 6,
                            opacity: 0.85,
                          }}
                        />
                      )}

                      {/* Origin Marker */}
                      {originCoords && (
                        <Marker position={originCoords}>
                          <Popup>
                            <strong>Start:</strong> {origin}
                          </Popup>
                        </Marker>
                      )}

                      {/* Destination Marker */}
                      {destCoords && (
                        <Marker position={destCoords}>
                          <Popup>
                            <strong>Destination:</strong> {destination}
                          </Popup>
                        </Marker>
                      )}

                      {/* Toll Markers */}
                      {showTolls &&
                        activeTolls.map((toll, idx) => (
                          <Marker
                            key={`toll-${idx}`}
                            position={[toll.lat, toll.lng]}
                            icon={tollIcon}
                          >
                            <Popup>
                              <div className="p-1 min-w-[160px]">
                                <h4
                                  style={{
                                    fontWeight: "bold",
                                    fontSize: "13px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "4px",
                                    color: "#000",
                                  }}
                                >
                                  🎫 {toll.name}
                                </h4>
                                <div
                                  style={{
                                    borderTop: "1px solid #ddd",
                                    paddingTop: "6px",
                                    marginTop: "4px",
                                  }}
                                >
                                  <p
                                    style={{
                                      color: "#ea580c",
                                      fontWeight: 800,
                                      fontSize: "20px",
                                    }}
                                  >
                                    ₹{toll.cost}
                                  </p>
                                  <p
                                    style={{ fontSize: "11px", color: "#888" }}
                                  >
                                    One-way Car/Jeep
                                  </p>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                      {showDangerZones &&
                        dangerZones.map((zone) => (
                          <Circle
                            key={zone.name}
                            center={[zone.lat, zone.lng]}
                            radius={zone.radius}
                            pathOptions={{
                              color:
                                zone.severity === "red" ? "#dc2626" : "#f97316",
                              fillOpacity: 0.15,
                            }}
                          >
                            <LeafletTooltip>
                              <div>
                                <p className="font-semibold">{zone.name}</p>
                                <p>{zone.warning}</p>
                                <p>Severity: {zone.severity}</p>
                              </div>
                            </LeafletTooltip>
                          </Circle>
                        ))}

                      {showHiddenGems &&
                        verifiedAttractions.map((attraction) => (
                          <Marker
                            key={attraction.id}
                            position={[attraction.lat, attraction.lng]}
                            icon={hiddenGemIcon}
                          >
                            <Popup>
                              <strong>{attraction.name}</strong>
                              <p>{attraction.destination}</p>
                            </Popup>
                          </Marker>
                        ))}

                      {segmentLabels.map((label, index) => (
                        <Marker
                          key={`segment-${index}`}
                          position={[label.lat, label.lng]}
                          icon={L.divIcon({
                            className: "",
                            html: `<div style='background:rgba(0,0,0,.65);color:#fff;padding:2px 6px;border-radius:999px;font-size:11px'>${label.text}</div>`,
                          })}
                        >
                          <Popup>{label.text}</Popup>
                        </Marker>
                      ))}

                      {showMemberLocations && myLocation && (
                        <Marker position={myLocation}>
                          <Popup>My Location</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RoutePlanner;
