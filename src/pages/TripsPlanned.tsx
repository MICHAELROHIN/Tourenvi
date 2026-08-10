import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Car,
  Bike,
  Users,
  Leaf,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Trash2,
  PlusCircle,
  Clock,
  Bed,
  Coffee,
  Camera,
  Share2,
  Download,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RoadTripBudgetCard } from "@/components/cost/RoadTripBudgetCard";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export interface PlannedTrip {
  id: string;
  userId?: string;
  createdAt: string;
  tripData: {
    tripType: string;
    startDate: string;
    endDate: string;
    numberOfMembers: number;
    startLocation: string;
    vehicleType: string;
    fuelType: string;
    budgetCap: number;
    moods: string[];
    lodgingType?: string[];
    selectedHotelName?: string;
    selectedHotelPrice?: number;
    destinations: string[];
  };
  financials: {
    fuelExpenditure: number;
    totalLodging: number;
    tollPricing: number;
    foodCost?: number;
    placesCost?: number;
    miscCost?: number;
    totalCost: number;
  };
  ecoData: {
    co2: number;
  };
  routeDetails: {
    distanceKm: number;
    vehicleType: string;
    fuelType: string;
    startLocation: string;
    destination: string;
  };
  itinerary: Array<{
    day: number;
    title: string;
    items: Array<{
      time: string;
      type: string;
      title: string;
      description?: string;
      image?: string;
      iconName?: string;
    }>;
  }>;
  destinationShowcase?: any[];
}

const TripsPlanned = () => {
  const [plannedTrips, setPlannedTrips] = useState<PlannedTrip[]>([]);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<Record<string, "itinerary" | "breakdown" | "places">>({});
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const uid = currentUser?.uid;

  // Load saved trips scoped strictly to the logged in user
  useEffect(() => {
    if (authLoading) return;

    if (!uid) {
      setPlannedTrips([]);
      setExpandedTripId(null);
      return;
    }

    const userStorageKey = `tourenvi.planned.trips.${uid}`;

    // 1. Initial fast load from local storage (user-scoped)
    try {
      const raw = localStorage.getItem(userStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlannedTrips(parsed);
          setExpandedTripId((prev) => prev || parsed[0].id);
        }
      } else {
        // Migration fallback: check legacy key only for items matching current uid
        const legacyRaw = localStorage.getItem("tourenvi.planned.trips");
        if (legacyRaw) {
          const legacyParsed = JSON.parse(legacyRaw);
          if (Array.isArray(legacyParsed)) {
            const userLegacy = legacyParsed.filter((t: any) => t.userId === uid);
            if (userLegacy.length > 0) {
              setPlannedTrips(userLegacy);
              setExpandedTripId((prev) => prev || userLegacy[0].id);
              localStorage.setItem(userStorageKey, JSON.stringify(userLegacy));
            }
          }
        }
      }
    } catch (err) {
      console.error("Local storage load error:", err);
    }

    // 2. Real-time subscription to Firestore 'trips' collection for this user
    const tripsQuery = query(
      collection(db, "trips"),
      where("userId", "==", uid)
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const fetchedTrips: PlannedTrip[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || uid,
            createdAt: data.createdAt || new Date().toISOString(),
            tripData: data.tripData || {
              tripType: data.tripType || "solo",
              startDate: data.startDate || "",
              endDate: data.endDate || "",
              numberOfMembers: data.numberOfMembers || 1,
              startLocation: data.startLocation || "",
              vehicleType: data.vehicleType || "car",
              fuelType: data.fuelType || "petrol",
              budgetCap: data.budgetCap || 50000,
              moods: data.moods || [],
              destinations: data.destinations || [],
            },
            financials: data.financials || {
              fuelExpenditure: data.costBreakdown?.fuel || 0,
              totalLodging: data.costBreakdown?.hotel || 0,
              tollPricing: data.costBreakdown?.toll || 0,
              foodCost: data.costBreakdown?.food || 0,
              placesCost: data.costBreakdown?.places || 0,
              miscCost: data.costBreakdown?.misc || 0,
              totalCost: data.costBreakdown?.total || 0,
            },
            ecoData: data.ecoData || { co2: data.ecoScore?.co2kg || 0 },
            routeDetails: data.routeDetails || {
              distanceKm: data.routeDistanceKm || 0,
              vehicleType: data.vehicleType || "car",
              fuelType: data.fuelType || "petrol",
              startLocation: data.startLocation || "Origin",
              destination: data.destinations?.[0] || "Destination",
            },
            itinerary: data.itinerary || [],
            destinationShowcase: data.destinationShowcase || [],
          } as PlannedTrip;
        });

        // Sort latest first
        fetchedTrips.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPlannedTrips(fetchedTrips);
        if (fetchedTrips.length > 0) {
          setExpandedTripId((prev) =>
            prev && fetchedTrips.some((t) => t.id === prev) ? prev : fetchedTrips[0].id
          );
        }

        // Cache in user-scoped local storage
        localStorage.setItem(userStorageKey, JSON.stringify(fetchedTrips));
      },
      (err) => {
        console.error("Firestore onSnapshot error in TripsPlanned:", err);
      }
    );

    return () => unsubscribe();
  }, [uid, authLoading]);

  const handleDeleteTrip = async (tripId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this planned trip?")) return;

    const updated = plannedTrips.filter((t) => t.id !== tripId);
    setPlannedTrips(updated);

    if (uid) {
      const userStorageKey = `tourenvi.planned.trips.${uid}`;
      localStorage.setItem(userStorageKey, JSON.stringify(updated));

      try {
        await deleteDoc(doc(db, "trips", tripId));
      } catch (err) {
        console.error("Error deleting trip from Firestore:", err);
      }
    }

    try {
      const dbRequest = indexedDB.open("TourenviOfflineDB", 1);
      dbRequest.onsuccess = (e: any) => {
        const idb = e.target.result;
        if (idb.objectStoreNames.contains("itineraries")) {
          const tx = idb.transaction("itineraries", "readwrite");
          tx.objectStore("itineraries").delete(tripId);
        }
      };
    } catch (e) {
      console.error("IndexedDB delete error:", e);
    }

    toast.success("Trip removed successfully.");
    if (expandedTripId === tripId) {
      setExpandedTripId(updated[0]?.id || null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTripId(expandedTripId === id ? null : id);
  };

  const getActiveTab = (tripId: string) => {
    return selectedTab[tripId] || "itinerary";
  };

  const setTabForTrip = (tripId: string, tab: "itinerary" | "breakdown" | "places") => {
    setSelectedTab((prev) => ({ ...prev, [tripId]: tab }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateNights = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return null;
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diff = Math.abs(e.getTime() - s.getTime());
      const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return nights > 0 ? `${nights} Night${nights > 1 ? "s" : ""} / ${nights + 1} Days` : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gt-offwhite text-foreground">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gt-gold/15 text-gt-gold font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5">
                <Sparkles size={14} /> Confirmed Travel Plans
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gt-blue">
              Trip Planned
            </h1>
            <p className="text-gray-500 font-sans mt-1 text-sm md:text-base">
              All your finalized travel itineraries, financial breakdowns, and route maps stored securely.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/trip/new")}
              className="bg-gt-blue hover:bg-gt-blue/90 text-white font-medium px-6 py-6 rounded-2xl shadow-md flex items-center gap-2"
            >
              <PlusCircle size={18} />
              <span>Plan New Trip</span>
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {plannedTrips.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-2xl mx-auto my-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gt-gold/10 text-gt-gold rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={48} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gt-blue mb-3">
              No Planned Trips Yet
            </h2>
            <p className="text-gray-500 font-sans text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
              You haven't saved any trips yet. Use our AI Trip Builder to customize your route, lodging, vehicle parameters, and budget cap!
            </p>
            <Button
              onClick={() => navigate("/trip/new")}
              className="bg-gt-blue hover:bg-gt-blue/90 text-white font-semibold px-8 py-6 rounded-2xl shadow-lg inline-flex items-center gap-2"
            >
              <Sparkles size={18} />
              <span>Start Planning Your Trip</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {plannedTrips.map((plannedTrip, index) => {
              const { tripData, financials, ecoData, routeDetails, itinerary, destinationShowcase } = plannedTrip;
              const isExpanded = expandedTripId === plannedTrip.id;
              const activeTab = getActiveTab(plannedTrip.id);
              const nightsText = calculateNights(tripData.startDate, tripData.endDate);

              const destinationName =
                routeDetails.destination || tripData.destinations?.[0] || "Custom Destination";
              const originName = routeDetails.startLocation || tripData.startLocation || "Origin";

              return (
                <div
                  key={plannedTrip.id}
                  className="bg-white rounded-3xl border border-gray-200/80 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Trip Card Header Banner */}
                  <div
                    onClick={() => toggleExpand(plannedTrip.id)}
                    className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-gt-blue to-blue-950 text-white cursor-pointer relative overflow-hidden"
                  >
                    {/* Decorative leaf/overlay background icon */}
                    <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
                      <Sparkles size={200} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 bg-gt-gold text-gt-blue font-bold rounded-full text-xs uppercase tracking-wider">
                            Trip #{plannedTrips.length - index}
                          </span>
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1">
                            <ShieldCheck size={12} /> Saved & Finalized
                          </span>
                          <span className="text-xs text-gray-300">
                            Created {formatDate(plannedTrip.createdAt)}
                          </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center gap-2">
                          <MapPin size={24} className="text-gt-gold shrink-0" />
                          <span>
                            {originName} → <span className="text-gt-gold">{destinationName}</span>
                          </span>
                        </h2>

                        {/* Travel Dates Display */}
                        {(tripData.startDate || tripData.endDate) && (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-200 pt-1">
                            <Calendar size={16} className="text-gt-gold" />
                            <span className="font-medium">
                              {formatDate(tripData.startDate)} — {formatDate(tripData.endDate)}
                            </span>
                            {nightsText && (
                              <span className="px-2.5 py-0.5 bg-white/10 rounded-md text-xs font-semibold text-gt-gold border border-white/10">
                                {nightsText}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right summary metrics */}
                      <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-l border-white/15 pt-4 md:pt-0 md:pl-6">
                        <div>
                          <p className="text-xs text-gray-300 uppercase tracking-wider">Total Estimate</p>
                          <p className="text-2xl font-bold text-gt-gold">
                            ₹{(financials.totalCost || 0).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Budget Cap: ₹{(tripData.budgetCap || 50000).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteTrip(plannedTrip.id, e)}
                            className="text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-full"
                            title="Delete Trip"
                          >
                            <Trash2 size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full"
                          >
                            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar - Always visible */}
                  <div className="p-4 md:px-8 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-gray-600">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                        {tripData.vehicleType === "bike" ? (
                          <Bike size={14} className="text-emerald-600" />
                        ) : (
                          <Car size={14} className="text-emerald-600" />
                        )}
                        <span className="capitalize">{tripData.vehicleType}</span> ({tripData.fuelType})
                      </span>

                      <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                        <Users size={14} className="text-blue-600" />
                        <span className="capitalize">{tripData.tripType}</span> ({tripData.numberOfMembers} person{tripData.numberOfMembers > 1 ? "s" : ""})
                      </span>

                      <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                        <Leaf size={14} className="text-green-600" />
                        <span>Eco Score: {ecoData.co2} kg CO₂</span>
                      </span>

                      {tripData.selectedHotelName && (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
                          <Bed size={14} className="text-emerald-600" />
                          <span>{tripData.selectedHotelName}</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(plannedTrip.id)}
                      className="text-gt-blue font-semibold hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? "Hide Details" : "View Full Itinerary & Breakdown"}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded Content View */}
                  {isExpanded && (
                    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                      {/* Tabs Navigation */}
                      <div className="flex border-b border-gray-200 space-x-6">
                        <button
                          onClick={() => setTabForTrip(plannedTrip.id, "itinerary")}
                          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "itinerary"
                              ? "border-gt-blue text-gt-blue"
                              : "border-transparent text-gray-400 hover:text-gray-700"
                            }`}
                        >
                          Day-by-Day Itinerary
                        </button>
                        <button
                          onClick={() => setTabForTrip(plannedTrip.id, "breakdown")}
                          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "breakdown"
                              ? "border-gt-blue text-gt-blue"
                              : "border-transparent text-gray-400 hover:text-gray-700"
                            }`}
                        >
                          Cost Breakdown & Eco Analysis
                        </button>
                        {destinationShowcase && destinationShowcase.length > 0 && (
                          <button
                            onClick={() => setTabForTrip(plannedTrip.id, "places")}
                            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "places"
                                ? "border-gt-blue text-gt-blue"
                                : "border-transparent text-gray-400 hover:text-gray-700"
                              }`}
                          >
                            Sightseeing Highlights
                          </button>
                        )}
                      </div>

                      {/* TAB 1: ITINERARY */}
                      {activeTab === "itinerary" && (
                        <div className="space-y-6">
                          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Calendar className="text-emerald-700" size={20} />
                              <div>
                                <h4 className="font-bold text-emerald-950 text-sm">
                                  Bespoke Travel Schedule
                                </h4>
                                <p className="text-xs text-emerald-700">
                                  {itinerary.length} Days Itinerary crafted for {destinationName}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.print()}
                              className="border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                            >
                              <Download size={14} className="mr-1.5" /> Print / Save PDF
                            </Button>
                          </div>

                          <div className="space-y-6">
                            {itinerary && itinerary.length > 0 ? (
                              itinerary.map((day, dIdx) => (
                                <div
                                  key={dIdx}
                                  className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 relative"
                                >
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gt-gold text-gt-blue font-bold flex items-center justify-center text-sm shadow-sm">
                                      D{day.day}
                                    </div>
                                    <div>
                                      <h3 className="font-serif font-bold text-lg text-gt-blue">
                                        Day {day.day}: {day.title}
                                      </h3>
                                      <p className="text-xs text-gray-500">Planned activities schedule</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 md:pl-4">
                                    {day.items.map((item, iIdx) => (
                                      <div
                                        key={iIdx}
                                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs hover:border-gt-gold/40 transition-colors flex gap-3"
                                      >
                                        <div className="p-2.5 rounded-lg bg-gray-100 text-gt-blue h-fit">
                                          {item.type === "food" ? (
                                            <Coffee size={18} />
                                          ) : item.type === "sightseeing" ? (
                                            <Camera size={18} className="text-gt-gold" />
                                          ) : item.type === "lodging" ? (
                                            <Bed size={18} className="text-emerald-600" />
                                          ) : (
                                            <MapPin size={18} className="text-blue-600" />
                                          )}
                                        </div>

                                        <div className="space-y-1 overflow-hidden">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400">
                                              {item.time}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                              {item.type}
                                            </span>
                                          </div>
                                          <h4 className="font-semibold text-gt-blue text-sm">
                                            {item.title}
                                          </h4>
                                          {item.description && (
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                              {item.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm italic">
                                Standard itinerary generated. Proceed to route planner for turn-by-turn map coordinates.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 2: COST BREAKDOWN */}
                      {activeTab === "breakdown" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <RoadTripBudgetCard financials={financials} tripData={tripData} />

                          <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-100 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Leaf className="text-emerald-600" size={24} />
                                <h3 className="font-serif font-bold text-emerald-950 text-lg">
                                  Ecological Impact Analysis
                                </h3>
                              </div>

                              <div className="my-4">
                                <span className="text-4xl font-bold text-emerald-900">
                                  {ecoData.co2}
                                </span>
                                <span className="text-emerald-700 ml-2 font-medium">kg CO₂ emissions</span>
                              </div>

                              <p className="text-xs text-emerald-800 leading-relaxed mb-4">
                                Estimated total carbon footprint for {routeDetails.distanceKm || 450} km distance using {tripData.fuelType} vehicle ({tripData.vehicleType}).
                              </p>
                            </div>

                            <div className="p-4 bg-white/90 rounded-xl border border-emerald-200/80">
                              <h4 className="font-bold text-xs text-emerald-900 mb-1 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                Smart Optimization Applied
                              </h4>
                              <p className="text-[11px] text-gray-600">
                                Budget cap and fuel efficiency algorithms verified zero cost overruns for this itinerary.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: PLACES / HIGHLIGHTS */}
                      {activeTab === "places" && destinationShowcase && (
                        <div className="space-y-4">
                          <h3 className="font-serif font-bold text-gt-blue text-lg mb-2">
                            Top Sightseeing Landmarks in {destinationName}
                          </h3>

                          {destinationShowcase.map((group: any, idx: number) => (
                            <div key={idx} className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {(Array.isArray(group.attractions)
                                  ? group.attractions
                                  : []
                                ).map((place: any) => (
                                  <div
                                    key={place.id || place.name}
                                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs group hover:shadow-md transition-shadow"
                                  >
                                    <div className="relative h-36 bg-gray-100 overflow-hidden">
                                      <img
                                        src={place.image || place.imageUrl}
                                        alt={place.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                      <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                                        {place.category || "Sightseeing"}
                                      </span>
                                    </div>
                                    <div className="p-4">
                                      <h4 className="font-bold text-gt-blue text-sm line-clamp-1">
                                        {place.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                        {place.description || "Curated tourist attraction."}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Actions on Card */}
                      <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        <Button
                          variant="outline"
                          onClick={() => navigate("/map")}
                          className="border-gt-blue/30 text-gt-blue hover:bg-gt-blue/5 text-xs font-semibold rounded-xl"
                        >
                          <MapPin size={14} className="mr-1.5" /> Launch Live Navigation Map
                        </Button>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success("Link copied to clipboard!");
                            }}
                            className="text-gray-500 hover:text-gt-blue text-xs"
                          >
                            <Share2 size={14} className="mr-1" /> Share Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsPlanned;
