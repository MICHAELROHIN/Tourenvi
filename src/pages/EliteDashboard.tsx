import React, { useEffect, useMemo, useState } from "react";
import { useTrip } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Leaf, MapPin, Coffee, Camera, Bed, CheckCircle2, Navigation } from "lucide-react";
import { getRoute } from "@/utils/osmRouteService";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RoadTripBudgetCard } from "@/components/cost/RoadTripBudgetCard";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type RoutePoint = { lat: number; lng: number };

const FitRouteBounds = ({ points }: { points: RoutePoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, points]);

  return null;
};

// Mock coordinates for India
const center = { lat: 20.5937, lng: 78.9629 };

const EliteDashboard = () => {
  const { trip } = useTrip();
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const navigate = useNavigate();

  // Load real calculation data from localStorage (populated by backend)
  const calcData = useMemo(() => {
    const saved = localStorage.getItem("tourenvi.trip.calculations");
    return saved ? JSON.parse(saved) : null;
  }, []);

  const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const mockDistanceKm = calcData?.routeDetails?.distanceKm || 450;
  const fuelExpenditure = calcData?.financials?.fuelCost || 0;
  const totalLodging = calcData?.financials?.lodgingCost || 0;
  const tollPricing = calcData?.financials?.tollCost || 0;
  const foodCost = calcData?.financials?.foodCost || 0;
  const placesCost = calcData?.financials?.placesCost || 0;
  const miscCost = calcData?.financials?.miscCost || 0;
  const totalCost = calcData?.financials?.totalCost || 0;

  const chartData = [
    { name: "Fuel", value: fuelExpenditure, color: "#059669" }, // emerald-600
    { name: "Lodging", value: totalLodging, color: "#D4AF37" }, // gt-gold
    { name: "Tolls", value: tollPricing, color: "#9ca3af" },
    { name: "Food", value: foodCost, color: "#10b981" },
    { name: "Sightseeing", value: placesCost, color: "#ec4899" },
    { name: "Misc", value: miscCost, color: "#8b5cf6" },
  ];

  const co2 = calcData?.ecoData?.co2Emissions || 0;
  const destinationShowcase = useMemo(() => {
    if (Array.isArray(calcData?.destinationAttractions) && calcData.destinationAttractions.length > 0) {
      return calcData.destinationAttractions;
    }

    if (Array.isArray(calcData?.places) && calcData.places.length > 0) {
      return [
        {
          id: "fallback-destination",
          destination: trip.destinations[0] || "Destination",
          matchedDestination: trip.destinations[0] || "Destination",
          region: null,
          attractions: calcData.places,
        },
      ];
    }

    return [];
  }, [calcData, trip.destinations]);

  // Convert Nominatim coordinates to Google LatLng
  const startLatLng = useMemo(() => {
    if (!calcData?.coordinates?.start) return null;
    return {
      lat: calcData.coordinates.start.lat,
      lng: calcData.coordinates.start.lon
    };
  }, [calcData]);

  const endLatLng = useMemo(() => {
    if (!calcData?.coordinates?.end) return null;
    return {
      lat: calcData.coordinates.end.lat,
      lng: calcData.coordinates.end.lon
    };
  }, [calcData]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!startLatLng || !endLatLng) {
        setRoutePath([]);
        return;
      }

      try {
        const route = await getRoute(
          { lat: startLatLng.lat, lon: startLatLng.lng },
          { lat: endLatLng.lat, lon: endLatLng.lng },
        );

        const path = Array.isArray(route?.geometry?.coordinates)
          ? route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))
          : [];

        if (!cancelled) {
          setRoutePath(path);
        }
      } catch {
        if (!cancelled) {
          setRoutePath(startLatLng && endLatLng ? [startLatLng, endLatLng] : []);
        }
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [endLatLng, startLatLng]);

  // Center is midpoint if coordinates exist
  const mapCenter = useMemo(() => {
    if (startLatLng && endLatLng) {
      return {
        lat: (startLatLng.lat + endLatLng.lat) / 2,
        lng: (startLatLng.lng + endLatLng.lng) / 2
      };
    }
    return center;
  }, [startLatLng, endLatLng]);

  if (calcData && !calcData.success) {
    const errorDetails = calcData.financials || {};
    return (
      <div className="h-screen pt-16 bg-gt-offwhite flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border-t-8 border-gt-blue p-8 md:p-12 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-4xl font-serif font-bold text-gt-blue mb-4">Cannot estimate within the given budget.</h2>
          <p className="text-gray-600 font-sans text-lg mb-8 leading-relaxed">
            Please try increasing your budget limit or modifying your travel preferences. Our algorithmic engine strictly enforces budget constraints to ensure premium quality.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-left mb-8 max-w-md mx-auto">
            <h3 className="font-semibold text-gt-blue mb-4 border-b pb-2 text-sm uppercase tracking-wider">Itemized Cost Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fuel Cost:</span>
                <span className="font-semibold text-gray-700">₹{(errorDetails.fuelCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hotel Cost:</span>
                <span className="font-semibold text-gray-700">₹{(errorDetails.hotelCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Car Rental Cost:</span>
                <span className="font-semibold text-gray-700">₹{(errorDetails.carRentalCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Food Cost:</span>
                <span className="font-semibold text-gray-700">₹{(errorDetails.foodCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sightseeing Cost:</span>
                <span className="font-semibold text-gray-700">₹{(errorDetails.sightseeingCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-gt-blue text-base">
                <span>Total Calculated:</span>
                <span>₹{(errorDetails.totalCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-gt-gold text-sm">
                <span>Your Budget Limit:</span>
                <span>₹{(calcData.budgetLimit || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/trip/new")}
            className="px-8 py-4 bg-gt-blue hover:bg-gt-blue/90 text-white font-medium rounded-xl shadow-lg transition-all active:scale-[0.98] inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Step Back to Adjust Budget
          </button>
        </div>
      </div>
    );
  }

  // Dynamic Real-World Itinerary Builder using 3 structured daytime operational slots with ZERO filler text
  const itineraryDays = useMemo(() => {
    // If backend returns a pre-built itinerary array from Gemini / Verified Engine, use it directly!
    if (Array.isArray(calcData?.itinerary) && calcData.itinerary.length > 0) {
      return calcData.itinerary.map((d: any) => ({
        day: d.day,
        title: d.title || `Day ${d.day}: Exploration & Sightseeing`,
        items: (d.items || []).map((item: any) => ({
          ...item,
          iconName: item.type === "food" ? "Coffee" : item.type === "sightseeing" ? "Camera" : item.type === "lodging" ? "Bed" : "MapPin"
        }))
      }));
    }

    // Fallback: format calcData.places into 3 structured daytime operational slots (Morning, Afternoon, Evening)
    const list = calcData?.places || [];
    const daysCount = calcData?.routeDetails?.totalDays || 3;
    const days = [];

    for (let d = 1; d <= daysCount; d++) {
      let dayTitle = `Day ${d}: Sightseeing & Exploration`;
      if (d === 1) dayTitle = `Day 1: Arrival & Core Attractions in ${trip.destinations[0] || "Destination"}`;
      if (d === daysCount) dayTitle = `Day ${d}: Final Highlights & Departure`;

      const startIdx = (d - 1) * 3;
      const dayPlaces = list.slice(startIdx, startIdx + 3);
      const items = [];

      // Morning Slot (08:30 AM - 12:30 PM): 1-2 major nature spots / viewpoints
      const p1 = dayPlaces[0] || list[(d - 1) % Math.max(1, list.length)];
      if (p1) {
        items.push({
          time: "08:30 AM - 10:30 AM",
          type: "sightseeing",
          title: `Explore ${p1.name}`,
          description: p1.description || `Visit top-rated viewpoint and attraction in ${trip.destinations[0] || "destination"}.`,
          image: p1.image || p1.imageUrl,
          iconName: "Camera"
        });
      }

      const p2 = dayPlaces[1] || list[d % Math.max(1, list.length)];
      if (p2) {
        items.push({
          time: "10:30 AM - 12:30 PM",
          type: "sightseeing",
          title: `Nature Walk & Sightseeing at ${p2.name}`,
          description: p2.description || `Scenic landmark and nature trail exploration.`,
          image: p2.image || p2.imageUrl,
          iconName: "Camera"
        });
      }

      // Afternoon Slot (01:30 PM - 05:00 PM): 1-2 secondary sightseeing / waterfalls / parks
      const p3 = dayPlaces[2] || list[(d + 1) % Math.max(1, list.length)];
      if (p3) {
        items.push({
          time: "01:30 PM - 03:30 PM",
          type: "sightseeing",
          title: `Visit ${p3.name}`,
          description: p3.description || `Explore heritage site and surrounding parklands.`,
          image: p3.image || p3.imageUrl,
          iconName: "Camera"
        });
      }

      if (p1) {
        items.push({
          time: "03:30 PM - 05:00 PM",
          type: "sightseeing",
          title: `Panoramic Photo Spot at ${p1.name} Viewpoint`,
          description: `Enjoy high-altitude valley views and photography.`,
          image: p1.image || p1.imageUrl,
          iconName: "Camera"
        });
      }

      // Evening Slot (05:30 PM - 08:30 PM): Local market walk / promenade / dining
      if (p3) {
        items.push({
          time: "05:30 PM - 07:00 PM",
          type: "sightseeing",
          title: `Sunset Walk around ${p3.name}`,
          description: `Tranquil sunset stroll and local market walk.`,
          image: p3.image || p3.imageUrl,
          iconName: "Camera"
        });
      }

      items.push({
        time: "07:00 PM - 08:30 PM",
        type: "food",
        title: `Evening Market Stroll & Dining in ${trip.destinations[0] || "Destination"} Market`,
        description: `Sample authentic local specialties, homemade chocolates, and shop for souvenirs.`,
        image: p2?.image || p2?.imageUrl,
        iconName: "Coffee"
      });

      days.push({ day: d, title: dayTitle, items });
    }
    return days;
  }, [calcData, trip]);

  const handleSaveItinerary = async () => {
    try {
      const tripId = "trip_" + Date.now();
      const newPlannedTrip = {
        id: tripId,
        userId: uid || "anonymous",
        createdAt: new Date().toISOString(),
        tripData: trip,
        financials: {
          fuelExpenditure,
          totalLodging,
          tollPricing,
          foodCost,
          placesCost,
          miscCost,
          totalCost,
        },
        ecoData: { co2 },
        routeDetails: {
          distanceKm: mockDistanceKm,
          vehicleType: trip.vehicleType,
          fuelType: trip.fuelType,
          startLocation: trip.startLocation || "Origin",
          destination: trip.destinations[0] || "Destination",
        },
        itinerary: itineraryDays,
        destinationShowcase,
      };

      // 1. Save to Firestore if authenticated
      if (uid) {
        try {
          await setDoc(doc(db, "trips", tripId), newPlannedTrip);
        } catch (fErr) {
          console.error("Firestore trip save error:", fErr);
        }
      }

      // 2. Save to user-scoped localStorage
      try {
        const userKey = uid ? `tourenvi.planned.trips.${uid}` : "tourenvi.planned.trips.guest";
        const existingRaw = localStorage.getItem(userKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [newPlannedTrip, ...existing.filter((t: any) => t.id !== newPlannedTrip.id)];
        localStorage.setItem(userKey, JSON.stringify(updated));
      } catch (err) {
        console.error("LocalStorage save error:", err);
      }

      // 3. Save to IndexedDB
      const dbRequest = indexedDB.open("TourenviOfflineDB", 1);
      
      dbRequest.onupgradeneeded = (event: any) => {
        const idb = event.target.result;
        if (!idb.objectStoreNames.contains("itineraries")) {
          idb.createObjectStore("itineraries", { keyPath: "id" });
        }
      };

      dbRequest.onsuccess = (event: any) => {
        const idb = event.target.result;
        const transaction = idb.transaction("itineraries", "readwrite");
        const store = transaction.objectStore("itineraries");
        store.put(newPlannedTrip);
      };
    } catch (err) {
      console.error("Save itinerary error:", err);
    }

    toast.success("Trip successfully finalized and saved to Planned Trips!");
    navigate("/trips-planned");
  };

  return (
    <div className="h-screen pt-16 bg-gt-offwhite flex flex-col overflow-hidden">
      {/* Container for the 3 columns */}
      <div className="w-full flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* Column A: The Itinerary (Left) */}
        <div className="w-full lg:w-1/3 p-6 lg:p-8 bg-white border-r border-gray-100 overflow-y-auto h-full custom-scrollbar pb-24">
          <h2 className="text-3xl font-serif font-bold text-gt-blue mb-2">Bespoke Itinerary</h2>
          <p className="text-gray-500 mb-8 font-sans">Crafted exclusively for your {trip.tripType} journey.</p>

          <div className="space-y-8">
            {destinationShowcase.length > 0 ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-serif font-semibold text-gt-blue">Sightseeing Highlights</h3>
                  <p className="text-sm text-gray-500">Curated from the India Tourism Dataset with destination-matched imagery.</p>
                </div>

                {destinationShowcase.map((group: any) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gt-blue">{group.matchedDestination || group.destination}</h4>
                        {group.region ? <p className="text-xs text-gray-500">{group.region}</p> : null}
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-gt-gold font-semibold">Premium Picks</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {(Array.isArray(group.attractions) ? group.attractions : []).slice(0, 4).map((place: any) => (
                        <div key={place.id} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={place.image || place.imageUrl}
                              alt={place.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gt-blue">
                                {place.category || "Tourism"}
                              </span>
                              <h4 className="mt-2 text-lg font-serif font-semibold text-white drop-shadow-sm">{place.name}</h4>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{place.description || "Recommended sightseeing stop from the tourism dataset."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {itineraryDays.map((day, idx) => (
              <div key={idx} className="relative">
                {/* Timeline connector */}
                {idx !== itineraryDays.length - 1 && (
                  <div className="absolute left-[19px] top-12 bottom-[-2rem] w-0.5 bg-gray-100"></div>
                )}

                <h3 className="text-xl font-serif font-semibold text-gt-blue mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gt-gold/10 text-gt-gold flex items-center justify-center font-bold z-10">
                    D{day.day}
                  </div>
                  {day.title}
                </h3>

                <div className="ml-5 pl-8 space-y-6">
                  {day.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="relative group">
                      <div className="absolute -left-10 top-1 w-4 h-4 rounded-full border-2 border-white bg-gray-200 group-hover:bg-gt-gold transition-colors shadow-sm"></div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group-hover:border-gt-gold/30">
                        {item.image && (
                          <div className="relative h-44 w-full overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-3 left-4 right-4">
                              <span className="px-2 py-0.5 bg-gt-gold text-white font-bold rounded text-[10px] uppercase tracking-wider">
                                Sightseeing Landmark
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            {item.type === "food" || item.iconName === "Coffee" ? (
                              <Coffee size={16} className="text-gt-gold animate-bounce-subtle" />
                            ) : item.type === "lodging" || item.iconName === "Bed" ? (
                              <Bed size={16} className="text-gt-gold animate-bounce-subtle" />
                            ) : item.type === "sightseeing" || item.iconName === "Camera" ? (
                              <Camera size={16} className="text-gt-gold animate-bounce-subtle" />
                            ) : (
                              <MapPin size={16} className="text-gt-gold animate-bounce-subtle" />
                            )}
                            <span className="text-xs font-semibold text-gray-500">{item.time}</span>
                          </div>
                          <h4 className="font-semibold text-gt-blue mb-1">{item.title}</h4>
                          {item.description && (
                            <p className="text-xs text-gray-500 font-sans leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* End state placeholder */}
            <div className="relative mt-8">
              <div className="ml-5 pl-8">
                <div className="flex items-center gap-3 text-gray-400">
                  <CheckCircle2 size={24} className="text-green-500" />
                  <span className="font-serif font-medium">Journey Concludes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column B: The Map Infrastructure (Center) */}
        <div className="w-full lg:w-1/3 bg-gray-100 relative h-[400px] lg:h-full flex flex-col">
          <div className="relative h-full w-full">
            <MapContainer
              center={mapCenter}
              zoom={6}
              className="h-full w-full"
              scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FitRouteBounds points={routePath} />
              {startLatLng ? (
                <Marker position={startLatLng}>
                  <Popup>Start point: {trip.startLocation || "Selected origin"}</Popup>
                </Marker>
              ) : null}
              {endLatLng ? (
                <Marker position={endLatLng}>
                  <Popup>Destination: {trip.destinations[0] || "Selected destination"}</Popup>
                </Marker>
              ) : null}
              {routePath.length > 0 ? (
                <Polyline
                  positions={routePath}
                  pathOptions={{
                    color: "#D4AF37",
                    weight: 5,
                    opacity: 0.9,
                  }}
                />
              ) : null}
            </MapContainer>

            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white flex justify-between items-center z-[1000] pointer-events-none">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                <p className="font-bold text-gt-blue text-lg">~{mockDistanceKm} km</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
                <p className="font-bold text-gt-blue text-lg capitalize">{trip.vehicleType}</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fuel</p>
                <p className="font-bold text-gt-blue text-lg capitalize">{trip.fuelType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column C: Financial & Eco Analysis (Right) */}
        <div className="w-full lg:w-1/3 p-6 lg:p-8 bg-white border-l border-gray-100 overflow-y-auto h-full custom-scrollbar pb-24">
          <h2 className="text-3xl font-serif font-bold text-emerald-800 mb-2">Analysis</h2>
          <p className="text-gray-500 mb-8 font-sans">Financial metrics and ecological impact.</p>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Leaf size={100} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="text-green-600" size={24} />
              <h3 className="font-semibold text-gray-700">Eco Leaf Score</h3>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-emerald-800">{co2}</span>
              <span className="text-gray-500">kg CO₂</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {trip.fuelType === "ev" ? "Zero tailpipe emissions! Excellent choice." : "Estimated footprint based on vehicle mileage."}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-6">Financial Breakdown</h3>
            <div className="relative h-64 mb-6 flex items-center justify-center">
              <div 
                className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_10px_20px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] border border-gray-200/60 flex flex-col items-center justify-center text-center pointer-events-none z-10 p-4 transition-all duration-300"
              >
                <Leaf className="text-emerald-600 mb-1 drop-shadow-xs" size={22} />
                {activePieIndex !== null ? (
                  <>
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">
                      {chartData[activePieIndex].name}
                    </span>
                    <span 
                      className="text-lg font-black transition-all duration-300 mt-1.5 leading-none"
                      style={{ color: chartData[activePieIndex].color }}
                    >
                      ₹{chartData[activePieIndex].value.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">
                      Total Cost
                    </span>
                    <span className="text-lg font-black text-emerald-800 mt-1.5 leading-none">
                      ₹{totalCost.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="bevel-filter" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.16" />
                      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                      <feOffset dx="1" dy="1.5" result="offset" />
                      <feSpecularLighting in="blur" surfaceScale="3.5" specularConstant="0.9" specularExponent="16" lighting-color="#ffffff" result="spec">
                        <fePointLight x="-50" y="-80" z="180" />
                      </feSpecularLighting>
                      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
                      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="0.75" k4="0" />
                    </filter>
                  </defs>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    cornerRadius={6}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {chartData.map((entry, index) => {
                      const isActive = activePieIndex === index;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={isActive ? 3.5 : 2}
                          filter="url(#bevel-filter)"
                          style={{
                            outline: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <RechartsTooltip content={() => null} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Premium Interactive Callout Cards Grid (Inspired by the 3D callout labels) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {chartData.map((item, index) => {
                const pct = totalCost > 0 ? Math.round((item.value / totalCost) * 100) : 0;
                const isActive = activePieIndex === index;
                return (
                  <div 
                    key={item.name}
                    onMouseEnter={() => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                    className={`p-3.5 rounded-2xl border transition-all duration-300 text-left ${
                      isActive 
                        ? "bg-emerald-50/40 border-emerald-200/80 shadow-md translate-y-[-2px]" 
                        : "bg-gray-50/50 border-gray-100 shadow-2xs hover:border-gray-200"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white tracking-wider uppercase"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] font-extrabold text-gray-400">{pct}%</span>
                    </div>
                    <div className="text-sm font-black text-gray-800">
                      ₹{item.value.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-500">Total Estimate</span>
                <span className="text-xl font-bold text-emerald-800">
                  ₹{totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Budget Cap</span>
                <span className="text-lg font-semibold text-gt-gold">
                  ₹{(trip.budgetCap || 50000).toLocaleString()}
                </span>
              </div>
            </div>
            </div>

          <RoadTripBudgetCard financials={calcData?.financials} tripData={trip} className="mt-8" />

          <button
            onClick={handleSaveItinerary}
            className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            Finalize & Save Itinerary (Offline Mode)
          </button>
        </div>

      </div>
    </div>
  );
};

export default EliteDashboard;
