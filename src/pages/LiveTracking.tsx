import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTrip } from "@/context/TripContext";
import { PlannedTrip } from "@/pages/TripsPlanned";
import { ActiveJourneyGuide } from "@/components/trip/ActiveJourneyGuide";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Navigation,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Clock,
  Compass,
} from "lucide-react";

const LiveTracking = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const navigate = useNavigate();

  const journeyKey = useMemo(() => uid ? `tourenvi.active.journey.${uid}` : "tourenvi.active.journey.guest", [uid]);
  const plannedTripsKey = useMemo(() => uid ? `tourenvi.planned.trips.${uid}` : "tourenvi.planned.trips.guest", [uid]);

  const [activeTrip, setActiveTrip] = useState<PlannedTrip | null>(null);
  const [allPlannedTrips, setAllPlannedTrips] = useState<PlannedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Active Journey and Planned Trips from LocalStorage
  useEffect(() => {
    try {
      // 1. Try loading active journey
      const rawActive = localStorage.getItem(journeyKey);
      if (rawActive) {
        const parsed = JSON.parse(rawActive);
        if (parsed && parsed.id) {
          setActiveTrip(parsed);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback: Load from planned trips
      const rawPlanned = localStorage.getItem(plannedTripsKey);
      if (rawPlanned) {
        const parsedPlanned = JSON.parse(rawPlanned);
        if (Array.isArray(parsedPlanned) && parsedPlanned.length > 0) {
          setAllPlannedTrips(parsedPlanned);
          setActiveTrip(parsedPlanned[0]);
          localStorage.setItem(journeyKey, JSON.stringify(parsedPlanned[0]));
          setIsLoading(false);
          return;
        }
      }

      // 3. Last-resort sample trip for demonstration
      const sampleTrip: PlannedTrip = {
        id: "sample_trip_01",
        createdAt: new Date().toISOString(),
        tripData: {
          tripType: "family",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          numberOfMembers: 4,
          startLocation: "Chennai",
          vehicleType: "car",
          fuelType: "petrol",
          budgetCap: 25000,
          moods: ["Nature", "Heritage"],
          lodgingType: ["Standard"],
          selectedHotelName: "Promenade Heritage Seafront Stay",
          selectedHotelPrice: 3200,
          destinations: ["Pondicherry"],
        },
        financials: {
          fuelExpenditure: 3200,
          totalLodging: 3200,
          tollPricing: 420,
          foodCost: 3500,
          placesCost: 800,
          miscCost: 500,
          totalCost: 11420,
        },
        ecoData: {
          co2: 42,
        },
        routeDetails: {
          distanceKm: 165,
          vehicleType: "car",
          fuelType: "petrol",
          startLocation: "Chennai",
          destination: "Pondicherry",
        },
        itinerary: [
          {
            day: 1,
            title: "Scenic Coastal Drive & French Quarter Discovery",
            items: [
              { time: "08:30 AM - 09:30 AM", type: "food", title: "Breakfast at Adyar Ananda Bhavan (ECR)", description: "Energizing South Indian breakfast & filter coffee before the coastal highway drive." },
              { time: "10:30 AM - 12:30 PM", type: "sightseeing", title: "Mahabalipuram Shore Temple & Stone Reliefs", description: "UNESCO World Heritage site exploration with breezy coastal views." },
              { time: "01:00 PM - 02:00 PM", type: "food", title: "Traditional Seafood & Thali Lunch", description: "Fresh local catches and meals at Kadal Seafood Kitchen." },
              { time: "03:30 PM - 05:30 PM", type: "sightseeing", title: "French Quarter White Town Heritage Walk", description: "Pastel colonial architecture, boutique cafes, and Dumas Street photography." },
              { time: "06:30 PM - 07:30 PM", type: "lodging", title: "Promenade Heritage Hotel Check-in & Rest", description: "Relax by the seafront promenade with evening breeze before dinner." },
            ],
          },
          {
            day: 2,
            title: "Auroville Matrimandir & Paradise Beach Exploration",
            items: [
              { time: "08:30 AM - 09:30 AM", type: "food", title: "Cafe des Arts French Bakery Breakfast", description: "Fresh croissants, artisanal coffee, and crepes." },
              { time: "10:30 AM - 01:00 PM", type: "sightseeing", title: "Auroville Matrimandir Peace Pavilion", description: "Spiritual golden sphere and botanical gardens visit." },
              { time: "01:30 PM - 02:30 PM", type: "food", title: "Organic Garden Lunch at Solar Kitchen", description: "Farm-fresh Mediterranean and healthy lunch bowls." },
              { time: "03:30 PM - 06:00 PM", type: "sightseeing", title: "Paradise Beach Speedboat & Backwaters", description: "Golden sand beach accessed via scenic Chunnambar backwater boat ride." },
              { time: "07:00 PM - 08:00 PM", type: "lodging", title: "Return Journey Prep & Safe Highway Arrival", description: "Concluding day's itinerary safely before 8:00 PM." },
            ],
          },
        ],
      };

      setActiveTrip(sampleTrip);
    } catch (e) {
      console.error("Error loading journey:", e);
    } finally {
      setIsLoading(false);
    }
  }, [journeyKey, plannedTripsKey]);

  // Handle switching active trip if user has multiple planned trips
  const handleSelectTrip = (trip: PlannedTrip) => {
    setActiveTrip(trip);
    localStorage.setItem(journeyKey, JSON.stringify(trip));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Loading Active Guiding Cockpit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#F8FAF9] text-foreground font-sans">
      <div className="container mx-auto px-4 max-w-7xl space-y-6">
        {/* Navigation Breadcrumb / Trip Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <Link to="/hero" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            <Link to="/trips-planned" className="hover:text-emerald-700">Trips Planned</Link>
            <span>/</span>
            <span className="text-emerald-700 flex items-center gap-1 font-bold">
              <Compass size={14} className="animate-spin text-emerald-600" /> Live Guiding System
            </span>
          </div>

          <div className="flex items-center gap-3">
            {allPlannedTrips.length > 1 && (
              <select
                value={activeTrip?.id}
                onChange={(e) => {
                  const selected = allPlannedTrips.find((t) => t.id === e.target.value);
                  if (selected) handleSelectTrip(selected);
                }}
                className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {allPlannedTrips.map((t, idx) => (
                  <option key={t.id} value={t.id}>
                    Trip #{allPlannedTrips.length - idx}: {t.routeDetails?.startLocation} → {t.routeDetails?.destination}
                  </option>
                ))}
              </select>
            )}

            <Button
              onClick={() => navigate("/trips-planned")}
              variant="outline"
              size="sm"
              className="text-xs font-semibold border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl"
            >
              View All Saved Trips
            </Button>
          </div>
        </div>

        {/* Main Active Journey Guide Cockpit */}
        {activeTrip ? (
          <ActiveJourneyGuide
            trip={activeTrip}
            onExit={() => navigate("/trips-planned")}
          />
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Navigation size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Active Journey Found</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Plan and save a trip in the Trip Planner, then click "Start Journey" to begin active turn-by-turn guidance.
            </p>
            <Button
              onClick={() => navigate("/trip/new")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl"
            >
              Plan a New Trip
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
