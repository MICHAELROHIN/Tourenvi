import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, InfoWindow, Polyline } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

interface ActiveNavigationMapProps {
  origin: google.maps.LatLngLiteral | string;
  destination: google.maps.LatLngLiteral | string;
  vehicleType?: "EV" | "Gas"; // Used for smart recommender
}

// Sample Danger Zones Data (Feature A)
const DANGER_ZONES = [
  { id: "1", location: { lat: 40.730610, lng: -73.935242 }, title: "Severe Traffic Incident", severity: "High" },
  { id: "2", location: { lat: 40.748817, lng: -73.985428 }, title: "Localized Flooding", severity: "Critical" }
];

export const ActiveNavigationMap: React.FC<ActiveNavigationMapProps> = ({ origin, destination, vehicleType = "Gas" }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", 
    // Ensure you provide your key in .env
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  
  // Simulation State
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [pathCoordinates, setPathCoordinates] = useState<google.maps.LatLngLiteral[]>([]);
  const animationRef = useRef<number | null>(null);
  const currentPathIndex = useRef<number>(0);

  // Smart Stops State
  const [smartStops, setSmartStops] = useState<google.maps.LatLngLiteral[]>([]);

  const fetchDirections = useCallback(() => {
    if (!isLoaded || !origin || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Extract path for simulation
          const overviewPath = result.routes[0].overview_path;
          const coords = overviewPath.map(p => ({ lat: p.lat(), lng: p.lng() }));
          setPathCoordinates(coords);
          
          // Inject Smart Stops (Feature B)
          if (coords.length > 10) {
            // Simply injecting a stop at ~50% and ~75% of the trip for demonstration
            const midIndex = Math.floor(coords.length / 2);
            const quarterIndex = Math.floor(coords.length * 0.75);
            setSmartStops([coords[midIndex], coords[quarterIndex]]);
          }
        } else {
          console.error("Error fetching directions, falling back to mock route", result);
          if (typeof origin === 'object' && typeof destination === 'object') {
            const coords: google.maps.LatLngLiteral[] = [];
            const steps = 100;
            for (let i = 0; i <= steps; i++) {
              coords.push({
                lat: origin.lat + (destination.lat - origin.lat) * (i / steps),
                lng: origin.lng + (destination.lng - origin.lng) * (i / steps)
              });
            }
            setPathCoordinates(coords);
            const midIndex = Math.floor(coords.length / 2);
            const quarterIndex = Math.floor(coords.length * 0.75);
            setSmartStops([coords[midIndex], coords[quarterIndex]]);
            // We simulate the polyline by just having pathCoordinates, but we can also mock DirectionsResult if needed
            // Actually DirectionsRenderer needs a valid DirectionsResult. Let's just render Polyline instead if directions is null.
          }
        }
      }
    ).catch(e => {
       console.error("Directions error caught:", e);
       // Handle unauthorized error by falling back to mock
       if (typeof origin === 'object' && typeof destination === 'object') {
            const coords: google.maps.LatLngLiteral[] = [];
            const steps = 100;
            for (let i = 0; i <= steps; i++) {
              coords.push({
                lat: origin.lat + (destination.lat - origin.lat) * (i / steps),
                lng: origin.lng + (destination.lng - origin.lng) * (i / steps)
              });
            }
            setPathCoordinates(coords);
            const midIndex = Math.floor(coords.length / 2);
            const quarterIndex = Math.floor(coords.length * 0.75);
            setSmartStops([coords[midIndex], coords[quarterIndex]]);
       }
    });
  }, [isLoaded, origin, destination]);

  useEffect(() => {
    fetchDirections();
  }, [fetchDirections]);

  // Helper to calculate bearing between two points
  const calculateBearing = (start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral) => {
    const toRad = (val: number) => val * Math.PI / 180;
    const toDeg = (val: number) => val * 180 / Math.PI;

    const dLon = toRad(end.lng - start.lng);
    const lat1 = toRad(start.lat);
    const lat2 = toRad(end.lat);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  };

  const startSimulation = () => {
    if (pathCoordinates.length === 0) return;
    
    currentPathIndex.current = 0;
    setCurrentPosition(pathCoordinates[0]);
    setIsTracking(true);

    const animate = () => {
      currentPathIndex.current += 1;
      
      if (currentPathIndex.current >= pathCoordinates.length) {
        setIsTracking(false);
        return;
      }

      const nextPos = pathCoordinates[currentPathIndex.current];
      const prevPos = pathCoordinates[currentPathIndex.current - 1];
      
      const bearing = calculateBearing(prevPos, nextPos);
      setCurrentPosition(nextPos);
      setCurrentHeading(bearing);

      if (map) {
        map.panTo(nextPos);
        map.setHeading(bearing); // Rotates the map if tilt/heading is supported
      }

      // Simulation speed: update every ~1.5 seconds for visual demonstration
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, 1500);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleStartTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      alert("Please enter a valid License Plate to start tracking.");
      return;
    }
    startSimulation();
  };

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="p-4 text-center">Loading Premium Navigation Map...</div>;

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100 w-full h-full">
      
      {!isTracking && (
        <form onSubmit={handleStartTracking} className="flex flex-col sm:flex-row gap-3 items-end bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex flex-col w-full">
            <label className="text-sm font-bold text-[#0F3057] mb-2">Initiate Live Journey</label>
            <input 
              type="text" 
              placeholder="Vehicle License Plate / Car Number"
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] uppercase"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            className="whitespace-nowrap px-6 py-3 bg-[#0F3057] text-[#D4AF37] font-bold rounded-lg shadow-md hover:bg-[#1a4a85] transition-colors"
          >
            Start Active Navigation Mode
          </button>
        </form>
      )}

      {isTracking && (
        <div className="flex justify-between items-center p-4 bg-[#0F3057] text-white rounded-xl">
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-bold tracking-wide text-[#D4AF37]">LIVE NAVIGATION ACTIVE</span>
          </div>
          <div className="font-mono text-sm opacity-80">Vehicle: {licensePlate.toUpperCase()}</div>
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden border-2 border-[#D4AF37] flex-1 min-h-0">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentPosition || defaultCenter}
          zoom={isTracking ? 18 : 13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            mapId: 'YOUR_MAP_ID_HERE', // Needed for vector map features like heading rotation
            tilt: isTracking ? 45 : 0,
            heading: currentHeading
          }}
        >
          {/* Render Route Polyline - In tracking mode, we disable default markers */}
          {directions ? (
            <DirectionsRenderer 
              directions={directions} 
              options={{ 
                suppressMarkers: isTracking, 
                polylineOptions: { strokeColor: '#0F3057', strokeWeight: 6 } 
              }} 
            />
          ) : (
            pathCoordinates.length > 0 && !isTracking && (
              <Polyline
                path={pathCoordinates}
                options={{ strokeColor: '#0F3057', strokeWeight: 6 }}
              />
            )
          )}

          {/* Active Navigation Arrow */}
          {isTracking && currentPosition && (
            <Marker
              position={currentPosition}
              icon={{
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: "#D4AF37",
                fillOpacity: 1,
                strokeColor: "#0F3057",
                strokeWeight: 2,
                rotation: currentHeading
              }}
              zIndex={999}
            />
          )}

          {/* Feature A: Danger Zones Overlay */}
          {DANGER_ZONES.map(zone => (
            <Marker
              key={zone.id}
              position={zone.location}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='red' width='24px' height='24px'%3E%3Cpath d='M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'/%3E%3C/svg%3E",
                scaledSize: new window.google.maps.Size(32, 32),
              }}
              title={`Warning: ${zone.title} (${zone.severity})`}
            />
          ))}

          {/* Feature B: Smart Stop Recommendations */}
          {smartStops.map((stop, index) => (
            <Marker
              key={`smart-stop-${index}`}
              position={stop}
              icon={{
                url: vehicleType === 'EV' 
                  ? "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981' width='24px' height='24px'%3E%3Cpath d='M7 16V4.46C7 3.1 8.1 2 9.46 2h5.08C15.9 2 17 3.1 17 4.46V16l-5 4-5-4zM9 4v6h6V4H9zm2 14v2h2v-2h-2z'/%3E%3C/svg%3E" 
                  : "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F59E0B' width='24px' height='24px'%3E%3Cpath d='M19.36 10.15l-1.9-5.7A2 2 0 0015.56 3H8.44a2 2 0 00-1.9 1.45l-1.9 5.7A2 2 0 006 13h12a2 2 0 001.36-2.85zM6 15v4a2 2 0 002 2h8a2 2 0 002-2v-4H6z'/%3E%3C/svg%3E",
                scaledSize: new window.google.maps.Size(36, 36),
              }}
              title={`Recommended ${vehicleType === 'EV' ? 'Charging' : 'Fuel'} Stop`}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
};
