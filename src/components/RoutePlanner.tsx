import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer, InfoWindow } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Route, Loader2, Ticket, Eye, EyeOff, Globe, PlusCircle } from "lucide-react";

// --- 1. REAL TOLL DATASET (2024-2025 Rates) ---
const TOLL_PLAZAS = [
  // --- Chennai -> Salem (via Ulundurpet) ---
  { id: "t_paranur", name: "Paranur Toll Plaza (Chengalpattu)", lat: 12.7235, lng: 80.0068, cost: 70 },
  { id: "t_athur", name: "Athur Toll Plaza (Tindivanam)", lat: 12.3353, lng: 79.7621, cost: 70 },
  { id: "t_vikravandi", name: "Vikravandi Toll Plaza", lat: 12.0658, lng: 79.5372, cost: 105 },
  { id: "t_sengurichi", name: "Sengurichi Toll Plaza (Ulundurpet)", lat: 11.6990, lng: 79.2890, cost: 65 },
  { id: "t_veeracholapuram", name: "Veeracholapuram Toll Plaza", lat: 11.6480, lng: 78.9500, cost: 65 },
  { id: "t_nathakkarai", name: "Nathakkarai Toll Plaza", lat: 11.6500, lng: 78.6500, cost: 65 },
  { id: "t_mettupatti", name: "Mettupatti Toll Plaza (Salem)", lat: 11.5833, lng: 78.4321, cost: 65 },

  // --- Route B: via Bangalore Highway ---
  { id: "t_sriperumbudur", name: "Sriperumbudur Toll Plaza", lat: 12.9432, lng: 79.9821, cost: 50 },
  { id: "t_chennasamudram", name: "Chennasamudram Toll Plaza", lat: 12.8643, lng: 79.4321, cost: 45 },
  { id: "t_pallikonda", name: "Pallikonda Toll Plaza", lat: 12.8990, lng: 78.9500, cost: 110 },
  { id: "t_vaniyambadi", name: "Vaniyambadi Toll Plaza", lat: 12.6500, lng: 78.6500, cost: 105 },
  { id: "t_krishnagiri", name: "Krishnagiri Toll Plaza", lat: 12.5401, lng: 78.1924, cost: 85 },
  { id: "t_thoppur", name: "Thoppur Toll Plaza", lat: 11.9361, lng: 78.0772, cost: 120 },
  { id: "t_omallur", name: "Omallur Toll Plaza", lat: 11.7056, lng: 78.0967, cost: 95 },

  // --- Common Section ---
  { id: "t_vaiguntam", name: "Vaiguntam Toll Plaza", lat: 11.5542, lng: 77.9254, cost: 75 },
  { id: "t_vijayamangalam", name: "Vijayamangalam Toll Plaza", lat: 11.2341, lng: 77.5123, cost: 70 },
  { id: "t_kaniyur", name: "Kaniyur Toll Plaza (Chengapalli)", lat: 11.0832, lng: 77.1654, cost: 120 },
  { id: "t_burliar", name: "Burliar Toll Gate (Ooty Entry)", lat: 11.3450, lng: 76.8000, cost: 30 }
];

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

interface TollMarker {
  lat: number;
  lng: number;
  name: string;
  cost: number;
}

const libraries: Libraries = ["places", "geometry"];

const RoutePlanner = () => {
  const navigate = useNavigate(); 
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Map State
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [activeTolls, setActiveTolls] = useState<TollMarker[]>([]); 
  const [showTolls, setShowTolls] = useState(false); 
  const [selectedToll, setSelectedToll] = useState<TollMarker | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  const mapRef = useRef<google.maps.Map | null>(null);

  const greenMapStyle: google.maps.MapTypeStyle[] = [
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e1f3d8" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#a8d3e6" }] },
  ];

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const calculateTollsOnRoute = (route: google.maps.DirectionsRoute) => {
    if (!window.google) return { count: 0, cost: 0, markers: [] };

    const polyline = new google.maps.Polyline({ path: route.overview_path });
    const foundTolls: TollMarker[] = [];
    let totalCost = 0;

    TOLL_PLAZAS.forEach((toll) => {
      const tollLocation = new google.maps.LatLng(toll.lat, toll.lng);
      // Tolerance ~1km
      const isOnRoute = google.maps.geometry.poly.isLocationOnEdge(tollLocation, polyline, 0.009);

      if (isOnRoute) {
        foundTolls.push({ lat: toll.lat, lng: toll.lng, name: toll.name, cost: toll.cost });
        totalCost += toll.cost;
      }
    });

    return { count: foundTolls.length, cost: totalCost, markers: foundTolls };
  };

  const getDistanceData = async () => {
    if (!origin || !destination) {
      alert("Enter both origin and destination");
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    setDirections(null);
    setActiveTolls([]);
    setRoutes([]);
    setShowTolls(true);

    const dirService = new google.maps.DirectionsService();
    
    dirService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true, 
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          
          // ✨ ONLY take the first route (Fastest)
          const fastestRoute = result.routes[0];
          const leg = fastestRoute.legs[0];
          const tollData = calculateTollsOnRoute(fastestRoute);
          
          setActiveTolls(tollData.markers);
          setOriginCoords({ lat: leg.start_location.lat(), lng: leg.start_location.lng() });

          const routeOption: RouteOption = {
              id: "0",
              name: fastestRoute.summary || "Fastest Route",
              distance: leg.distance?.text || "0 km",
              duration: leg.duration?.text || "0 min",
              tollCost: tollData.cost,
              tollCount: tollData.count,
              type: "fastest",
              description: leg.start_address,
              highlights: [fastestRoute.summary],
          };

          setRoutes([routeOption]); // ✨ Set only ONE route
          setSelectedRoute("0");
        } else {
          alert("Could not find directions.");
        }
        setLoading(false);
      }
    );
  };

  // ✨ Updated Handler: Navigate to Home (#fuel-estimator)
  const handleAddToFuelEstimator = (distanceText: string) => {
    const km = parseFloat(distanceText.replace(/[^\d.]/g, ''));
    if (!isNaN(km)) {
        // Navigates to home page, sets query param, and targets the hash ID
        navigate(`/?distance=${km}#fuel-estimator`);
    }
  };

  const handleViewFullMap = () => {
      if (origin && destination) {
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
        window.open(googleMapsUrl, "_blank");
      }
  };

  if (loadError) return <div>Error loading maps. Check your API key.</div>;
  if (!isLoaded) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /> Loading Maps...</div>;

  return (
    <section id="routes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 py-1 px-4 border-primary/30 bg-primary/5 text-primary">
            <MapPin className="w-3 h-3 mr-2" /> Smart Navigation
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Route & Toll Planner</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
             Get accurate driving directions and <span className="text-primary font-semibold">real 2024 toll gate costs</span>.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-primary" />
                <span>Plan Your Route</span>
              </CardTitle>
              <CardDescription>Enter origin & destination to check toll gates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input placeholder="e.g. Chennai" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input placeholder="e.g. Ooty" value={destination} onChange={(e) => setDestination(e.target.value)} />
                </div>
              </div>
              <Button onClick={getDistanceData} className="w-full md:w-auto" size="lg" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding...</> : <><MapPin className="mr-2 h-4 w-4" /> Find Routes</>}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground mb-6">Fastest Route</h3>
              
              {routes.map((route) => (
                <Card key={route.id} className="cursor-pointer transition-all duration-200 shadow-card hover:shadow-xl ring-2 ring-primary">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 mb-4 md:mb-0">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                           <Navigation className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{route.name}</h4>
                          <p className="text-sm text-muted-foreground">{route.description}</p>
                        </div>
                      </div>
                      <Badge className="w-fit bg-green-600">Recommended</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <MapPin className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">{route.distance}</p>
                        <p className="text-xs text-muted-foreground">Distance</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">{route.duration}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900">
                        <Ticket className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">₹{route.tollCost}</p>
                        <p className="text-xs text-muted-foreground">{route.tollCount > 0 ? `${route.tollCount} Gates` : "Total Toll"}</p>
                      </div>
                    </div>

                    {/* ✨ Add to Fuel Estimator Button */}
                    <div className="mt-4 pt-4 border-t flex justify-end">
                        <Button onClick={() => handleAddToFuelEstimator(route.distance)} className="bg-primary text-white hover:bg-primary/90">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Use Distance for Fuel Estimate
                        </Button>
                    </div>

                  </CardContent>
                </Card>
              ))}

              <Card className="shadow-card relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Button size="sm" variant={showTolls ? "default" : "secondary"} onClick={() => setShowTolls(!showTolls)} className={`shadow-lg border border-input ${showTolls ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-white/90 hover:bg-white"}`}>
                        {showTolls ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showTolls ? "Hide Tolls" : "View Tolls"}
                    </Button>
                    <Button size="sm" variant={mapType === "satellite" ? "default" : "secondary"} onClick={() => setMapType(mapType === "roadmap" ? "satellite" : "roadmap")} className={`shadow-lg border border-input ${mapType === "satellite" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white/90 hover:bg-white"}`}>
                        <Globe className="w-4 h-4 mr-2" />
                        {mapType === "satellite" ? "Show Map" : "Satellite"}
                    </Button>
                </div>
                <div className="absolute bottom-4 left-4 z-10">
                   <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white shadow-md" onClick={handleViewFullMap}>Open in Google Maps</Button>
                </div>
                <CardContent className="p-0">
                  <div className="h-[500px] w-full relative bg-muted">
                    {originCoords ? (
                      <GoogleMap mapContainerClassName="h-full w-full" center={originCoords} zoom={7} mapTypeId={mapType} options={{ styles: mapType === 'roadmap' ? greenMapStyle : undefined, streetViewControl: false, mapTypeControl: false }} onLoad={map => (mapRef.current = map)}>
                        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false, polylineOptions: { strokeColor: mapType === 'satellite' ? "#00BFFF" : "#1A73E8", strokeOpacity: 0.9, strokeWeight: 6 }}} />}
                        {showTolls && activeTolls.map((toll, idx) => (
                          <Marker key={`toll-${idx}`} position={{ lat: toll.lat, lng: toll.lng }} zIndex={999} onClick={() => setSelectedToll(toll)} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#ea580c", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 }} />
                        ))}
                        {selectedToll && showTolls && (
                          <InfoWindow position={{ lat: selectedToll.lat, lng: selectedToll.lng }} onCloseClick={() => setSelectedToll(null)} zIndex={1000}>
                            <div className="p-2 min-w-[160px]">
                              <h4 className="font-bold text-sm flex items-center gap-2 mb-1 text-black"><Ticket className="w-4 h-4 text-orange-600" /> {selectedToll.name}</h4>
                              <div className="border-t pt-2 mt-1"><p className="text-orange-700 font-extrabold text-xl">₹{selectedToll.cost}</p><p className="text-xs text-gray-500">One-way Car/Jeep</p></div>
                            </div>
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    ) : <div className="h-full flex items-center justify-center">Loading Map...</div>}
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