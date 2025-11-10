import { useState, useEffect, useRef } from "react";
// ✨ --- IMPORT THE HOOK --- ✨
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer, Polyline } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Fuel, Route, Zap, Loader2 } from "lucide-react"; // Added Loader2 for loading state

interface RouteOption {
  id: string;
  name: string;
  distance: string;
  duration: string;
  fuelCost: string;
  type: "fastest" | "eco" | "scenic";
  description: string;
  highlights: string[];
}

// This is the library you need for the hook
const libraries: Libraries = ["places"];

const RoutePlanner = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // This is for API calculation
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [fallbackPath, setFallbackPath] = useState<google.maps.LatLngLiteral[] | null>(null);
  // Custom greenish map style (inspired by natural / eco theme)
  const greenMapStyle: google.maps.MapTypeStyle[] = [
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e1f3d8" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#d5f0c4" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#c8e6b8" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#b5e3a4" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5d6b57" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d2e6c2" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#a8d3e6" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a6b78" }] },
    { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#5d6b57" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#cfe7bb" }] },
    { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
  ];

  // ✨ --- USE THE HOOK TO LOAD THE SCRIPT --- ✨
  // It safely loads the Google Maps script using your .env variable
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // --- Fetch Distance using Google Maps JS SDK ---
  const getDistanceData = async () => {
    if (!origin || !destination) {
      alert("Enter both origin and destination");
      return;
    }

    // isLoaded is from the hook, it checks if the Google script is ready
    if (!isLoaded) {
      alert("Google Maps script is not loaded yet.");
      return;
    }

  setLoading(true);
  // reset previous state so a new blue line can render
  setDirections(null);
  setOriginCoords(null);
  setDestinationCoords(null);
  setMapCenter(null);

  // We can now safely use `window.google`
  const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
          const element = response.rows[0].elements[0];
          const distanceText = element.distance.text;
          const durationText = element.duration.text;

          const fuelCost = calculateFuelCost(distanceText);

          const routeData: RouteOption[] = [
            {
              id: "fastest",
              name: "Fastest Route",
              distance: distanceText,
              duration: durationText,
              fuelCost,
              type: "fastest",
              description: "Optimized route with minimal travel time",
              highlights: ["Efficient highways", `From ${response.originAddresses[0]}`, `To ${response.destinationAddresses[0]}`],
            },
          ];

          setRoutes(routeData);
          setSelectedRoute("fastest"); // Auto-select the route

          // Geocode origin & destination for map markers (optional)
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: origin }, (results, geoStatus) => {
            if (geoStatus === "OK" && results && results[0]) {
              const loc = results[0].geometry.location;
              setOriginCoords({ lat: loc.lat(), lng: loc.lng() });
            }
          });
          geocoder.geocode({ address: destination }, (results, geoStatus) => {
            if (geoStatus === "OK" && results && results[0]) {
              const loc = results[0].geometry.location;
              setDestinationCoords({ lat: loc.lat(), lng: loc.lng() });
            }
          });
          // Also request directions directly using the text inputs (fast path to draw the blue line)
          requestDirections(origin, destination);
          // If both geocoded later we'll set center via effect; quick provisional center remains null until coords ready.
        } else {
          console.error("Error:", status, response);
          // Even if Distance Matrix fails, still try to draw route using Directions API
          requestDirections(origin, destination);
        }
        setLoading(false);
      }
    );
  };

  // Request directions and render polyline; accepts place strings
  const requestDirections = (from: string, to: string) => {
    if (!isLoaded) return;
    const dirService = new google.maps.DirectionsService();
    dirService.route(
      {
        origin: from,
        destination: to,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setOriginCoords({ lat: leg.start_location.lat(), lng: leg.start_location.lng() });
            setDestinationCoords({ lat: leg.end_location.lat(), lng: leg.end_location.lng() });
          }
          const bounds = result.routes[0]?.bounds;
          if (bounds && mapRef.current) mapRef.current.fitBounds(bounds);
          const overview = result.routes[0]?.overview_path || [];
          if (overview.length) setFallbackPath(overview.map((p) => ({ lat: p.lat(), lng: p.lng() })));
        } else {
          console.warn("Directions request failed:", status, result);
        }
      }
    );
  };
  // Optionally, if you still want to request directions once coords exist, you can keep an effect here.

  // When directions change later (e.g., new query), fit bounds again
  useEffect(() => {
    if (directions && mapRef.current) {
      const bounds = directions.routes[0]?.bounds;
      if (bounds) mapRef.current.fitBounds(bounds);
    }
  }, [directions]);

  // --- Helper to calculate mock fuel cost ---
  const calculateFuelCost = (distanceText: string): string => {
    const km = parseFloat(distanceText.replace(/[^\d.]/g, ""));
    const fuelPricePerLiter = 100; // ₹100 per liter
    const mileage = 15; // km/l
    const cost = (km / mileage) * fuelPricePerLiter;
    return `₹${cost.toFixed(2)}`;
  };

  // ✨ --- FIXED URL --- ✨
  // This now uses the correct Google Maps URL format to open directions
  const handleViewFullMap = () => {
    if (origin && destination) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      window.open(googleMapsUrl, "_blank");
    } else {
      alert("Please enter both an origin and a destination.");
    }
  };

  const getRouteIcon = (type: RouteOption["type"]) => {
    switch (type) {
      case "fastest":
        return <Navigation className="w-5 h-5" />;
      case "eco":
        return <Zap className="w-5 h-5" />;
      case "scenic":
        return <Route className="w-5 h-5" />;
    }
  };

  const getRouteColor = (type: RouteOption["type"]) => {
    switch (type) {
      case "fastest":
        return "bg-primary text-primary-foreground";
      case "eco":
        return "bg-green-500 text-white";
      case "scenic":
        return "bg-blue-500 text-white";
    }
  };

  // ✨ --- ADDED LOADING/ERROR STATES FOR THE SCRIPT --- ✨
  if (loadError) {
    return <div>Error loading maps. Check your API key.</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="ml-4 text-lg">Loading Maps...</p>
      </div>
    );
  }

  // --- Render the original component ---
  return (
    <section id="routes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-accent/10 rounded-full px-4 py-2 mb-4">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Smart Route Planning</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Your Perfect Route
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare multiple route options optimized for speed, fuel efficiency, or scenic beauty.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Route Input */}
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-primary" />
                <span>Plan Your Route</span>
              </CardTitle>
              <CardDescription>
                Enter your starting point and destination to get optimized route suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="origin">From</Label>
                  <Input
                    id="origin"
                    placeholder="Enter starting location"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">To</Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={getDistanceData} className="w-full md:w-auto" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Routes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Route Options */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground mb-6">Route Options</h3>
              {routes.map((route) => (
                <Card
                  key={route.id}
                  className={`cursor-pointer transition-all duration-200 shadow-card hover:shadow-xl ${
                    selectedRoute === route.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedRoute(route.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 mb-4 md:mb-0">
                        <div className={`p-2 rounded-lg ${getRouteColor(route.type)}`}>
                          {getRouteIcon(route.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{route.name}</h4>
                          <p className="text-sm text-muted-foreground">{route.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {route.type === "fastest" && "Fastest"}
                      </Badge>
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
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Fuel className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">{route.fuelCost}</p>
                        <p className="text-xs text-foreground">Fuel Cost</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Route Highlights:</p>
                      <div className="flex flex-wrap gap-2">
                        {route.highlights.map((highlight, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Interactive Map */}
              <Card className="shadow-card">
                <CardContent className="p-0">
                  <div className="h-96 w-full rounded-lg overflow-hidden relative">
                    {origin && destination && (
                      <div className="absolute left-3 bottom-3 z-10">
                        <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white" onClick={handleViewFullMap}>
                          Open in Google Maps
                        </Button>
                      </div>
                    )}
                    {originCoords || destinationCoords ? (
                      <GoogleMap
                        mapContainerClassName="h-96 w-full"
                        center={mapCenter || originCoords || destinationCoords || { lat: 20.5937, lng: 78.9629 }}
                        zoom={originCoords && destinationCoords ? 7 : 5}
                        options={{
                          streetViewControl: false,
                          mapTypeControl: false,
                          styles: greenMapStyle,
                        }}
                        onLoad={(map) => {
                          mapRef.current = map;
                        }}
                      >
                        {originCoords && <Marker position={originCoords} label="A" />}
                        {destinationCoords && <Marker position={destinationCoords} label="B" />}
                        {directions && (
                          <DirectionsRenderer
                            directions={directions}
                            options={{
                              suppressMarkers: true,
                              polylineOptions: {
                                strokeColor: "#1A73E8", // Google Maps blue
                                strokeOpacity: 0.95,
                                strokeWeight: 6,
                              },
                            }}
                          />
                        )}
                        {!directions && fallbackPath && (
                          <Polyline
                            path={fallbackPath}
                            options={{
                              strokeColor: "#1A73E8",
                              strokeOpacity: 0.7,
                              strokeWeight: 5,
                            }}
                          />
                        )}
                      </GoogleMap>
                    ) : (
                      <div className="h-96 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium text-foreground mb-2">Map will appear after route lookup</p>
                          <p className="text-sm text-muted-foreground mb-4">Enter origin and destination and click Find Routes</p>
                          <Button variant="outline" className="bg-green-400" onClick={handleViewFullMap} disabled={!origin || !destination}>
                            Open Full Google Maps
                          </Button>
                        </div>
                      </div>
                    )}
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