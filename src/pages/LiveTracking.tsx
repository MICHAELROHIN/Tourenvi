import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTrip } from "@/context/TripContext";
import { PlannedTrip } from "@/pages/TripsPlanned";
import { ActiveJourneyGuide } from "@/components/trip/ActiveJourneyGuide";
import { WhatsAppTripShareModal } from "@/components/trip/WhatsAppTripShareModal";
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
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

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
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link to="/hero" className="hover:text-emerald-700 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <Link to="/trips-planned" className="hover:text-emerald-700 transition-colors">Trips Planned</Link>
            <span className="text-gray-300">/</span>
            <span className="text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70 flex items-center gap-1.5 font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Compass size={13} className="text-emerald-600" /> Live Guiding Cockpit
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

            {activeTrip && (
              <Button
                onClick={() => setIsWhatsAppModalOpen(true)}
                size="sm"
                className="text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                title="Send today's route & schedule to WhatsApp"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z"/>
                </svg>
                <span>Share WhatsApp</span>
              </Button>
            )}

            <Button
              onClick={() => navigate("/trips-planned")}
              variant="outline"
              size="sm"
              className="text-xs font-bold border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl shadow-2xs cursor-pointer"
            >
              View All Saved Trips
            </Button>
          </div>
        </div>

        {/* Main Active Journey Guide Cockpit */}
        {activeTrip ? (
          <>
            <ActiveJourneyGuide
              trip={activeTrip}
              onExit={() => navigate("/trips-planned")}
            />
            <WhatsAppTripShareModal
              isOpen={isWhatsAppModalOpen}
              onClose={() => setIsWhatsAppModalOpen(false)}
              trip={activeTrip}
            />
          </>
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
