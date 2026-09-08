import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTrip } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Users,
  UsersRound,
  MapPin,
  Car,
  Bike,
  Compass,
  Tent,
  Castle,
  Palmtree,
  Wallet,
  Leaf,
  Clock,
  Navigation,
  Building,
  Home,
  Star,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Fuel,
  IndianRupee,
  Loader2,
  Bed,
  Sparkles,
  Calendar,
  LocateFixed,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { getLiveLocationName, getCurrentPositionAsync } from "@/utils/Livelocationservice";
import { API_BASE_URL } from "@/config/api";

interface RealHotel {
  id: string;
  name: string;
  address: string;
  rating: number;
  user_ratings_total: number;
  phone?: string;
  photoUrl: string;
  price_level?: number;
  estimatedPricePerNight: number;
  category: "Boutique" | "Luxury" | "Eco";
}

const stages = [
  "Profile",
  "Route",
  "Fleet",
  "Vibe",
  "Budget",
  "Priority",
  "Lodging",
  "Review",
];

const trackerWidthClasses = [
  "w-[12.5%]",
  "w-[25%]",
  "w-[37.5%]",
  "w-[50%]",
  "w-[62.5%]",
  "w-[75%]",
  "w-[87.5%]",
  "w-full",
];

const FRONTEND_HOTEL_CACHE = new Map<string, RealHotel[]>();

const ElitePlanner = () => {
  const { trip, updateTrip } = useTrip();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentStage, setCurrentStage] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    stepRefs.current[currentStage]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [currentStage]);

  useEffect(() => {
    const step = searchParams.get("step") || searchParams.get("stage");
    if (step === "budget" || step === "4" || step === "5") {
      setCurrentStage(4); // Stage index 4 is Budget (the 5th step)
    }
  }, [searchParams]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carSuggestions, setCarSuggestions] = useState<Array<{ brand: string; model: string; fuel: string; mileage: number }>>([]);
  const [customCarName, setCustomCarName] = useState("");
  const [customMileage, setCustomMileage] = useState(String(trip.mileage || 15));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [fuels, setFuels] = useState<string[]>([]);
  const [liveFuelPrice, setLiveFuelPrice] = useState<number | null>(null);
  const [fuelPriceLoading, setFuelPriceLoading] = useState(false);

  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");

  // Live GPS Location Detection state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const detectLiveLocation = async (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);

    try {
      // Get GPS position with high accuracy (maximumAge: 0 ensures fresh fix)
      const position = await getCurrentPositionAsync({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });

      const { latitude, longitude, accuracy } = position.coords;

      console.log(
        `[ElitePlanner GPS] Raw coordinates: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`
      );

      // Reverse geocode the GPS coordinates to a place name
      const placeName = await getLiveLocationName(latitude, longitude);

      if (placeName) {
        updateTrip("startLocation", placeName);
        setLocationDetected(true);
        if (!silent) {
          toast.success(`📍 Live GPS Location: ${placeName} (±${Math.round(accuracy)}m)`);
        }
        console.log(
          `[ElitePlanner GPS] ✅ Set startLocation to "${placeName}" from GPS (${latitude}, ${longitude}) accuracy: ${accuracy}m`
        );
      } else {
        setLocationDetected(false);
        if (!silent) {
          toast.error("Got your GPS position, but couldn't resolve a place name. Please enter it manually.");
        }
        console.warn(
          `[ElitePlanner GPS] ⚠️ Could not resolve place name for (${latitude}, ${longitude})`
        );
      }
    } catch (err: any) {
      console.warn("Geolocation error/denial:", err);
      setLocationDetected(false);

      if (!silent) {
        if (err?.message === "GEOLOCATION_UNSUPPORTED") {
          toast.error("Geolocation is not supported by your browser.");
        } else if (err?.code === err?.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enter starting location manually.");
        } else if (err?.code === err?.TIMEOUT) {
          toast.error("Timed out getting your GPS location. Please try again or enter it manually.");
        } else if (err?.code === err?.POSITION_UNAVAILABLE) {
          toast.error("Your current location is unavailable right now. Please enter it manually.");
        } else {
          toast.error("Unable to retrieve your current location.");
        }
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    // Auto-detect live GPS location when user reaches Step 2 (Route stage)
    if (currentStage === 1 && !locationDetected) {
      detectLiveLocation(true);
    }
  }, [currentStage, locationDetected]);

  // Real Hotels state
  const [realHotels, setRealHotels] = useState<RealHotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  const sourceCity = trip.startLocation.trim();
  const defaultFuelPrice = trip.fuelType === "diesel" ? 94 : 102.5;

  const fetchLiveFuelPrice = async (city: string, fuelType: string, signal?: AbortSignal) => {
    const normalizedFuel = fuelType.toLowerCase();
    const fallbackPrice = normalizedFuel === "diesel" ? 92.34 : 100.75;

    if (!city.trim()) {
      setLiveFuelPrice(fallbackPrice);
      updateTrip("fuelPrice", fallbackPrice);
      return;
    }

    setFuelPriceLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/fuel-price?city=${encodeURIComponent(city)}&fuelType=${encodeURIComponent(normalizedFuel)}`,
        {
          method: "GET",
          signal,
        },
      );

      if (!response.ok) {
        setLiveFuelPrice(fallbackPrice);
        updateTrip("fuelPrice", fallbackPrice);
        return;
      }

      const data = await response.json();
      const price = Number(data?.price);

      if (Number.isFinite(price) && price > 0) {
        setLiveFuelPrice(price);
        updateTrip("fuelPrice", price);
      } else {
        setLiveFuelPrice(fallbackPrice);
        updateTrip("fuelPrice", fallbackPrice);
      }
    } catch (error) {
      console.error("Fuel price fetch failed:", error);
      setLiveFuelPrice(fallbackPrice);
      updateTrip("fuelPrice", fallbackPrice);
    } finally {
      if (!signal?.aborted) {
        setFuelPriceLoading(false);
      }
    }
  };

  useEffect(() => {
    const selectedFuel = trip.vehicleType === "bike" ? "petrol" : trip.fuelType;
    if (!selectedFuel) {
      setLiveFuelPrice(null);
      setFuelPriceLoading(false);
      return;
    }

    const controller = new AbortController();
    void fetchLiveFuelPrice(sourceCity, selectedFuel, controller.signal);

    return () => controller.abort();
  }, [sourceCity, trip.fuelType, trip.vehicleType]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/cars`);
        setCarSuggestions(res.data);
      } catch (err) {
        console.error("Failed to fetch car suggestions:", err);
      }
    };
    fetchCars();

    fetch(`${API_BASE_URL}/brands`)
      .then((r) => r.json())
      .then((data) => setBrands(data || []))
      .catch(() => setBrands([]));
  }, []);

  const onBrandChange = async (value: string) => {
    setCarBrand(value);
    setCarModel("");
    updateTrip("fuelType", "" as any);
    setModels([]);
    setFuels([]);
    try {
      const res = await fetch(`${API_BASE_URL}/models?brand=${encodeURIComponent(value)}`);
      const data = await res.json();
      setModels(data || []);
    } catch (e) { setModels([]); }
  };

  const onModelChange = async (value: string) => {
    setCarModel(value);
    updateTrip("fuelType", "" as any);
    setFuels([]);
    try {
      const res = await fetch(
        `${API_BASE_URL}/fuel?brand=${encodeURIComponent(carBrand)}&model=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setFuels(data || []);
    } catch (e) { setFuels([]); }
  };

  const fetchMileage = async (fuel: string) => {
    if (!carBrand || !carModel || !fuel) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/mileage?brand=${encodeURIComponent(carBrand)}&model=${encodeURIComponent(carModel)}&fuel=${encodeURIComponent(fuel)}`
      );
      const data = await res.json();
      const m = typeof data?.mileage === "number" ? data.mileage : null;
      if (m) {
        updateTrip("mileage", m);
        setCustomMileage(String(m));
        toast.success(`Mileage updated: ${m} km/l`);
      }
    } catch (e) {
      console.error("Failed to fetch mileage");
    }
  };

  const onFuelChange = (val: string) => {
    const normalized = val.toLowerCase();
    if (trip.vehicleType === "bike") {
      updateTrip("fuelType", "petrol" as any);
      fetchMileage("petrol");
      return;
    }

    updateTrip("fuelType", normalized as any);
    fetchMileage(val);
  };

  // Target destination for hotel lookup
  const targetDestination = trip.destinations[0] || trip.startLocation || "Ooty";

  // Calculate nights from trip start/end date
  const tripNights = useMemo(() => {
    if (trip.startDate && trip.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, days);
    }
    return 2; // Default 2 nights
  }, [trip.startDate, trip.endDate]);

  // Fetch real hotels when entering Lodging stage (Stage 6) or when destination changes
  useEffect(() => {
    if (currentStage === 6 && targetDestination) {
      const destKey = targetDestination.trim().toLowerCase();
      if (FRONTEND_HOTEL_CACHE.has(destKey)) {
        setRealHotels(FRONTEND_HOTEL_CACHE.get(destKey)!);
        setHotelsLoading(false);
        setHotelsError(null);
        return;
      }

      const fetchDestinationHotels = async () => {
        setHotelsLoading(true);
        setHotelsError(null);
        try {
          const res = await fetch(`${API_BASE_URL}/get-hotels?destination=${encodeURIComponent(targetDestination)}`);
          if (!res.ok) throw new Error("Failed to fetch real hotels for " + targetDestination);
          const data = await res.json();
          if (data.hotels && data.hotels.length > 0) {
            const mapped: RealHotel[] = data.hotels.map((h: any) => {
              let basePrice = 3500;
              if (h.price_level === 1) basePrice = 2200;
              else if (h.price_level === 2) basePrice = 4500;
              else if (h.price_level === 3) basePrice = 8500;
              else if (h.price_level === 4) basePrice = 14500;
              else if (h.rating) {
                basePrice = h.rating > 4.4 ? 7500 : h.rating > 3.9 ? 4200 : 2500;
              }
              const nameHash = (h.name || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
              const priceOffset = (nameHash % 7) * 150 - 300;
              const estimatedPricePerNight = Math.max(1800, basePrice + priceOffset);

              // Assign lodging category
              let category: "Boutique" | "Luxury" | "Eco" = "Boutique";
              const lowerName = (h.name || "").toLowerCase();
              if (
                h.price_level >= 3 ||
                h.rating >= 4.4 ||
                lowerName.includes("resort") ||
                lowerName.includes("palace") ||
                lowerName.includes("luxury") ||
                lowerName.includes("spa") ||
                lowerName.includes("grand") ||
                lowerName.includes("villas")
              ) {
                category = "Luxury";
              } else if (
                h.price_level <= 1 ||
                lowerName.includes("eco") ||
                lowerName.includes("lodge") ||
                lowerName.includes("nature") ||
                lowerName.includes("farm") ||
                lowerName.includes("guest") ||
                lowerName.includes("cottage") ||
                lowerName.includes("homestay")
              ) {
                category = "Eco";
              } else {
                category = "Boutique";
              }

              return {
                id: h.id,
                name: h.name,
                address: h.address,
                rating: h.rating || 4.2,
                user_ratings_total: h.user_ratings_total || 85,
                phone: h.phone,
                photoUrl: h.photoUrl,
                price_level: h.price_level,
                estimatedPricePerNight,
                category,
              };
            });
            FRONTEND_HOTEL_CACHE.set(destKey, mapped);
            setRealHotels(mapped);
          } else {
            setHotelsError("No hotels found for " + targetDestination);
          }
        } catch (err: any) {
          console.error("Hotel fetch error:", err);
          setHotelsError(err.message || "Failed to load real hotels");
        } finally {
          setHotelsLoading(false);
        }
      };
      fetchDestinationHotels();
    }
  }, [currentStage, targetDestination]);

  // Handle hotel selection & calculate hotel budget addition
  const handleSelectHotel = (hotel: RealHotel) => {
    const nightPrice = hotel.estimatedPricePerNight;
    const rooms = Math.max(1, Math.ceil(trip.numberOfMembers / 2));
    const totalHotelCost = nightPrice * tripNights * rooms;

    updateTrip("selectedHotelName", hotel.name);
    updateTrip("selectedHotelPrice", nightPrice);

    const currentBreakdown = trip.costBreakdown || {
      fuel: 0,
      toll: 0,
      hotel: 0,
      food: 0,
      places: 0,
      misc: 0,
      total: 0,
      perPerson: 0,
    };

    const newHotelCost = totalHotelCost;
    const newTotalCost =
      (currentBreakdown.fuel || 0) +
      (currentBreakdown.toll || 0) +
      newHotelCost +
      (currentBreakdown.food || 0) +
      (currentBreakdown.places || 0) +
      (currentBreakdown.misc || 0);

    const newPerPerson = Math.round(newTotalCost / Math.max(1, trip.numberOfMembers));

    updateTrip("costBreakdown", {
      ...currentBreakdown,
      hotel: newHotelCost,
      total: newTotalCost,
      perPerson: newPerPerson,
    });

    toast.success(`Selected "${hotel.name}" (₹${totalHotelCost.toLocaleString()} added for ${tripNights} night${tripNights > 1 ? "s" : ""})`);
  };

  // Filtered real hotels based on selected lodging style cards
  const filteredHotels = useMemo(() => {
    if (!trip.lodgingType || trip.lodgingType.length === 0) return realHotels;
    return realHotels.filter((h) => trip.lodgingType.includes(h.category));
  }, [realHotels, trip.lodgingType]);

  const FuelPriceCard = () => {
    const displayedPrice = liveFuelPrice ?? defaultFuelPrice;

    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
            <IndianRupee size={16} />
          </span>
          Current Fuel Price (₹/L)
        </div>

        <div className="mt-3 min-h-[56px] rounded-xl border border-white/80 bg-white/80 px-4 py-3">
          {fuelPriceLoading ? (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              Fetching live rate for {sourceCity || "your source city"}...
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-emerald-800">
                ₹{displayedPrice.toFixed(2)}
              </span>
              <span className="pb-1 text-sm font-medium text-gray-500">/ L</span>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            {sourceCity ? `Updated for ${sourceCity}` : "Using fallback until a source city is entered."}
          </p>
        </div>
      </div>
    );
  };

  const isSoloTrip = trip.tripType === "solo";

  useEffect(() => {
    if (isSoloTrip) {
      if (trip.numberOfMembers !== 1) {
        updateTrip("numberOfMembers", 1);
      }
      return;
    }

    if (trip.numberOfMembers < 2) {
      updateTrip("numberOfMembers", trip.tripType === "family" ? 4 : 8);
    }
  }, [isSoloTrip, trip.numberOfMembers, trip.tripType, updateTrip]);

  useEffect(() => {
    if (!isSoloTrip && trip.vehicleType === "bike") {
      updateTrip("vehicleType", "car");
    }
  }, [isSoloTrip, trip.vehicleType, updateTrip]);

  useEffect(() => {
    if (trip.vehicleType === "bike" && trip.fuelType !== "petrol") {
      updateTrip("fuelType", "petrol");
    }
  }, [trip.fuelType, trip.vehicleType, updateTrip]);

  useEffect(() => {
    setCustomMileage(String(trip.mileage || 15));
  }, [trip.mileage]);

  const normalizedCarSuggestions = useMemo(
    () =>
      carSuggestions.map((car) => ({
        ...car,
        label: `${car.brand.charAt(0).toUpperCase() + car.brand.slice(1)} ${car.model
          .split(" ")
          .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
          .join(" ")}`,
      })),
    [carSuggestions],
  );

  const filteredCarSuggestions = useMemo(() => {
    const query = customCarName.trim().toLowerCase();
    if (!query) return normalizedCarSuggestions.slice(0, 6);

    return normalizedCarSuggestions
      .filter((car) =>
        [car.brand, car.model, `${car.brand} ${car.model}`].some((value) =>
          value.toLowerCase().includes(query),
        ),
      )
      .slice(0, 6);
  }, [customCarName, normalizedCarSuggestions]);

  const handleCarSelection = (car: (typeof normalizedCarSuggestions)[number]) => {
    setCustomCarName(car.label);
    setCustomMileage(String(car.mileage));
    updateTrip("vehicleType", "car");
    updateTrip("fuelType", car.fuel.toLowerCase() as any);
    updateTrip("mileage", car.mileage);
    setShowSuggestions(false);
    toast.success(`Selected ${car.label}. Mileage and fuel were auto-filled.`);
  };

  const handleVehicleModelChange = (value: string) => {
    setCustomCarName(value);
    updateTrip("vehicleType", "car");
    setShowSuggestions(true);
  };

  const handleMileageChange = (value: string) => {
    setCustomMileage(value);
    const parsedMileage = Number(value);
    if (Number.isFinite(parsedMileage) && parsedMileage > 0) {
      updateTrip("mileage", parsedMileage);
    }
  };

  const isStageValid = () => {
    switch (currentStage) {
      case 0:
        return !!trip.tripType && trip.numberOfMembers > 0;
      case 1:
        return !!trip.startLocation && trip.destinations.length > 0 && !!trip.destinations[0] && !!trip.startDate && !!trip.endDate;
      case 2:
        if (trip.vehicleType === "car") {
          return !!carBrand && !!carModel && !!trip.fuelType && trip.mileage > 0;
        }
        return !!trip.vehicleType && !!trip.fuelType && trip.mileage > 0;
      case 3:
        return trip.moods && trip.moods.length > 0;
      case 4:
        return trip.budgetCap > 0;
      case 5:
        return !!trip.routePriority;
      case 6:
        return trip.lodgingType && trip.lodgingType.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!isStageValid()) {
      toast.error("Please fill all required details before proceeding.");
      return;
    }
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handlePrev = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/hero");
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/build-itinerary`, {
        tripData: trip
      });

      if (response.data && response.data.success) {
        // Store computed values in localStorage for the dashboard to read
        const calcKey = currentUser?.uid ? `tourenvi.trip.calculations.${currentUser.uid}` : "tourenvi.trip.calculations.guest";
        localStorage.setItem(calcKey, JSON.stringify(response.data));
        toast.success("Bespoke itinerary generated successfully.");
        navigate("/elite-dashboard");
      } else {
        // Show detailed budget error
        toast.error(response.data.message || "Failed to generate plan due to budget constraints.", {
          duration: 10000,
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.status === 422) {
        // Save the error response to localStorage so the dashboard can render the elegant overlay!
        const calcKey = currentUser?.uid ? `tourenvi.trip.calculations.${currentUser.uid}` : "tourenvi.trip.calculations.guest";
        localStorage.setItem(calcKey, JSON.stringify(error.response.data));
        toast.warning("Budget limit exceeded. Loading detailed analysis...");
        navigate("/elite-dashboard");
      } else {
        const errorMsg = error.response?.data?.message || "Failed to connect to backend server. Please make sure the backend is running.";
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gt-offwhite font-sans text-emerald-800 flex flex-col">
      {/* Top Tracker */}
      <div className="w-full bg-white shadow-sm border-b border-gray-100 py-3 sm:py-4 px-3 sm:px-6 md:px-12 z-10 sticky top-16">
        <div className="max-w-6xl mx-auto">
          {/* Mobile stage summary indicator */}
          <div className="flex md:hidden items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
              Step {currentStage + 1} of {stages.length}: <span className="text-emerald-950 font-black">{stages[currentStage]}</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {Math.round(((currentStage + 1) / stages.length) * 100)}% Completed
            </span>
          </div>

          {/* Desktop connecting line */}
          <div className="hidden md:block relative w-full mb-0">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
            <div
              className={`absolute left-0 top-1/2 h-0.5 bg-emerald-500 -z-10 -translate-y-1/2 transition-all duration-500 ${trackerWidthClasses[currentStage] || "w-[12.5%]"}`}
            ></div>
          </div>

          {/* Steps container (scrollable on mobile, evenly distributed on desktop) */}
          <div className="flex items-center justify-start md:justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1 px-1 relative">
            {stages.map((stage, index) => {
              const isActive = index === currentStage;
              const isCompleted = index < currentStage;
              return (
                <div
                  key={stage}
                  ref={(el) => (stepRefs.current[index] = el)}
                  onClick={() => {
                    if (index < currentStage) setCurrentStage(index);
                  }}
                  className={`flex flex-col items-center gap-1 sm:gap-2 shrink-0 px-1 sm:px-2 cursor-pointer transition-all ${
                    index < currentStage ? "hover:opacity-80" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-emerald-700 text-white ring-4 ring-emerald-200 shadow-md scale-105"
                        : isCompleted
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? "text-emerald-900 font-bold block"
                        : isCompleted
                          ? "text-emerald-700 hidden sm:block"
                          : "text-gray-400 hidden md:block"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-3 py-4 sm:p-6 md:p-10 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[480px] flex flex-col border border-gray-100">

          <div className="p-4 sm:p-6 md:p-10 flex-1">
            {/* Stage 1: Profile */}
            {currentStage === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-emerald-800 mb-2 sm:mb-4">Who is traveling?</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 font-sans">Select your travel identity to tailor the experience.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { id: "solo", title: "Solo Explorer", icon: User, desc: "A journey of self-discovery", size: 1 },
                    { id: "family", title: "Family Getaway", icon: Users, desc: "Memories for a lifetime", size: 4 },
                    { id: "group", title: "Group Tour", icon: UsersRound, desc: "Adventures with companions", size: 8 },
                  ].map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => {
                        updateTrip("tripType", profile.id as any);
                        updateTrip("numberOfMembers", profile.id === "solo" ? 1 : profile.size);
                      }}
                      className={`cursor-pointer rounded-xl border-2 p-5 sm:p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 ${trip.tripType === profile.id ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-gray-100 hover:border-gray-300"
                        }`}
                    >
                      <div className={`p-3.5 sm:p-4 rounded-full mb-3 sm:mb-4 ${trip.tripType === profile.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <profile.icon size={30} />
                      </div>
                      <h3 className="font-serif font-medium text-lg sm:text-xl mb-1.5">{profile.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{profile.desc}</p>
                    </div>
                  ))}
                </div>

                {!isSoloTrip && (
                  <div className="mt-6 sm:mt-8 max-w-md mx-auto bg-gray-50 border border-gray-100 rounded-xl p-4 sm:p-6 flex items-center justify-between shadow-inner">
                    <span className="text-sm sm:text-base font-semibold text-emerald-800 font-sans">Refine exact traveler count:</span>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button
                        onClick={() => updateTrip("numberOfMembers", Math.max(2, trip.numberOfMembers - 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-700 hover:text-white transition-all shadow-sm"
                      >
                        -
                      </button>
                      <span className="text-lg sm:text-xl font-bold text-emerald-800 w-6 text-center">{trip.numberOfMembers}</span>
                      <button
                        onClick={() => updateTrip("numberOfMembers", Math.min(20, trip.numberOfMembers + 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-700 hover:text-white transition-all shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stage 2: Route & Travel Dates */}
            {currentStage === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-emerald-800 mb-2 sm:mb-4">Chart Your Course & Travel Dates</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 font-sans">Define your starting point, dream destination, and travel timeline.</p>

                <div className="space-y-5 sm:space-y-6 max-w-2xl mx-auto mt-4 sm:mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs sm:text-sm font-semibold text-emerald-800">Starting Location</label>
                        <button
                          type="button"
                          onClick={() => detectLiveLocation(false)}
                          disabled={isDetectingLocation}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                          title="Auto-detect current GPS location"
                        >
                          <LocateFixed size={13} className={isDetectingLocation ? "animate-spin text-emerald-600" : "text-emerald-600"} />
                          <span>{isDetectingLocation ? "Detecting Live GPS..." : "Auto-detect Live GPS"}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                          value={trip.startLocation}
                          onChange={(e) => updateTrip("startLocation", e.target.value)}
                          placeholder={isDetectingLocation ? "Fetching live GPS location..." : "e.g. Chennai, India"}
                          className="pl-11 pr-24 h-12 sm:h-14 text-base sm:text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20"
                        />
                        {locationDetected && trip.startLocation && !isDetectingLocation && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} className="text-emerald-600" /> GPS Live
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-xs sm:text-sm font-semibold text-emerald-800 mb-2">Destination</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                        <Input
                          value={trip.destinations[0] || ""}
                          onChange={(e) => updateTrip("destinations", [e.target.value])}
                          placeholder="e.g. Ooty, Tamil Nadu"
                          className="pl-11 h-12 sm:h-14 text-base sm:text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-gray-100">
                    <div className="relative">
                      <label className="block text-xs sm:text-sm font-semibold text-emerald-800 mb-2">Start Date</label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={trip.startDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateTrip("startDate", e.target.value)}
                          onClick={(e) => {
                            try {
                              e.currentTarget.showPicker();
                            } catch (err) {
                              console.error("Error opening date picker: ", err);
                            }
                          }}
                          className="h-12 sm:h-14 text-base sm:text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20 focus:ring-2 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-xs sm:text-sm font-semibold text-emerald-800 mb-2">End Date</label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={trip.endDate}
                          min={trip.startDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateTrip("endDate", e.target.value)}
                          onClick={(e) => {
                            try {
                              e.currentTarget.showPicker();
                            } catch (err) {
                              console.error("Error opening date picker: ", err);
                            }
                          }}
                          className="h-12 sm:h-14 text-base sm:text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20 focus:ring-2 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {trip.startDate && trip.endDate && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 flex items-center justify-between text-emerald-800">
                      <span className="text-xs sm:text-sm font-semibold">Calculated Trip Duration:</span>
                      <span className="px-3.5 py-1 bg-emerald-600 text-white font-bold rounded-full text-xs sm:text-sm">
                        {(() => {
                          const startD = new Date(trip.startDate);
                          const endD = new Date(trip.endDate);
                          const diffTime = Math.abs(endD.getTime() - startD.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                          return diffDays > 0 ? `${diffDays} Days` : "Invalid dates selected";
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage 3: Fleet */}
            {currentStage === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-emerald-800 mb-2 sm:mb-4">Fleet Specification</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 font-sans">Select your vehicle for accurate routing and pricing.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                  {(
                    isSoloTrip
                      ? [
                        { id: "car", title: "Premium SUV / Sedan", icon: Car },
                        { id: "bike", title: "Touring Motorcycle", icon: Bike },
                      ]
                      : [{ id: "car", title: "Premium SUV / Sedan", icon: Car }]
                  ).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        updateTrip("vehicleType", v.id);
                        if (v.id === "bike") {
                          updateTrip("fuelType", "petrol"); // Force Petrol for bikes
                          updateTrip("mileage", 38);
                        }
                      }}
                      className={`cursor-pointer rounded-xl border-2 p-5 sm:p-6 flex items-center gap-4 transition-all hover:shadow-md ${trip.vehicleType === v.id ? "border-emerald-500 bg-emerald-50 shadow-md animate-pulse-subtle" : "border-gray-100"
                        }`}
                    >
                      <div className={`p-3 rounded-lg ${trip.vehicleType === v.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <v.icon size={26} />
                      </div>
                      <h3 className="font-serif font-medium text-lg sm:text-xl text-emerald-800">{v.title}</h3>
                    </div>
                  ))}
                </div>

                {/* Vehicle Selection */}
                {trip.vehicleType === "car" ? (
                  <div className="mb-6 sm:mb-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-semibold text-emerald-800">Brand</label>
                        <Select value={carBrand} onValueChange={onBrandChange}>
                          <SelectTrigger className="h-11 sm:h-12 bg-white border-gray-200">
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((b) => (
                              <SelectItem key={b} value={b}>
                                {b.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-semibold text-emerald-800">Model</label>
                        <Select value={carModel} onValueChange={onModelChange} disabled={!carBrand || models.length === 0}>
                          <SelectTrigger className="h-11 sm:h-12 bg-white border-gray-200">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-semibold text-emerald-800">Fuel Type</label>
                        <Select value={trip.fuelType || ""} onValueChange={onFuelChange} disabled={!carModel || fuels.length === 0}>
                          <SelectTrigger className="h-11 sm:h-12 bg-white border-gray-200 capitalize">
                            <SelectValue placeholder="Select fuel" />
                          </SelectTrigger>
                          <SelectContent>
                            {fuels.map((f) => (
                              <SelectItem key={f} value={f.toLowerCase()}>
                                {f.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 items-start">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-emerald-800 mb-2">Expected Mileage (km/L)</label>
                        <div className="relative">
                          <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input
                            type="number"
                            value={trip.mileage}
                            onChange={(e) => updateTrip("mileage", Number(e.target.value))}
                            className="pl-11 h-11 sm:h-12 text-base sm:text-lg bg-gray-50 focus:border-emerald-600 focus:ring-emerald-600/20"
                          />
                        </div>
                      </div>

                      <div className="lg:pt-[31px]">
                        <FuelPriceCard />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 items-start">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-emerald-800 mb-2">Fuel Type</label>
                      <div className="flex gap-4">
                        {["Petrol"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => updateTrip("fuelType", f.toLowerCase() as any)}
                            className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg border font-medium transition-colors ${trip.fuelType === f.toLowerCase() ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-600/50"
                              }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-emerald-800 mb-2">Expected Mileage (km/L)</label>
                      <div className="relative">
                        <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                          type="number"
                          value={trip.mileage}
                          onChange={(e) => updateTrip("mileage", Number(e.target.value))}
                          className="pl-11 h-11 sm:h-12 text-base sm:text-lg bg-gray-50 focus:border-emerald-600 focus:ring-emerald-600/20"
                        />
                      </div>
                    </div>

                    <div className="lg:pt-[31px]">
                      <FuelPriceCard />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stage 4: Vibe/Mood */}
            {currentStage === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-emerald-800 mb-2 sm:mb-4">The Cultured Vibe</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 font-sans">Curate the essence of your journey.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { id: "Heritage", icon: Castle, bg: "bg-emerald-50" },
                    { id: "Wilderness", icon: Tent, bg: "bg-emerald-50" },
                    { id: "Spiritual", icon: Compass, bg: "bg-emerald-50" },
                    { id: "Coastal", icon: Palmtree, bg: "bg-emerald-50" },
                  ].map((mood) => {
                    const isSelected = trip.moods.includes(mood.id as any);
                    return (
                      <div
                        key={mood.id}
                        onClick={() => {
                          const newMoods = isSelected
                            ? trip.moods.filter(m => m !== mood.id)
                            : [...trip.moods, mood.id];
                          updateTrip("moods", newMoods as any);
                        }}
                        className={`cursor-pointer rounded-2xl p-4 sm:p-6 aspect-square flex flex-col items-center justify-center text-center transition-all duration-300 ${isSelected ? "bg-emerald-600 text-white shadow-lg scale-105" : `${mood.bg} text-gray-700 hover:shadow-md`
                          }`}
                      >
                        <mood.icon size={36} className="mb-3 sm:mb-4 opacity-80" />
                        <h3 className="font-serif font-medium text-base sm:text-lg">{mood.id}</h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stage 5: Budget */}
            {currentStage === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-emerald-800 mb-2 sm:mb-4">Financial Blueprint</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-12 font-sans">Set your budget limit for a personalized experience.</p>

                <div className="max-w-2xl mx-auto text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-emerald-800 mb-6 sm:mb-8">
                    ₹{trip.budgetCap.toLocaleString()}
                  </div>

                  <Slider
                    value={[trip.budgetCap]}
                    min={10000}
                    max={500000}
                    step={5000}
                    onValueChange={(vals) => updateTrip("budgetCap", vals[0])}
                    className="mb-6 sm:mb-8"
                  />

                  <div className="flex justify-between text-gray-400 font-medium text-xs sm:text-sm">
                    <span>Economy (₹10K)</span>
                    <span>Premium (₹2.5L)</span>
                    <span>Ultra-Luxury (₹5L+)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 6: Priority */}
            {currentStage === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-emerald-800 mb-2 sm:mb-4">Multi-Factor Priority</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 font-sans">Optimize your route logic.</p>

                <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
                  {[
                    { id: "eco-friendly", title: "Eco-friendly / Fuel Efficient", icon: Leaf, desc: "Minimizes CO2 emissions and saves fuel." },
                    { id: "toll-free", title: "Avoid Tolls", icon: Wallet, desc: "Cost-effective routing via state highways." },
                    { id: "fastest", title: "Express Route (Fastest)", icon: Clock, desc: "Prioritizes speed via major expressways." },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => updateTrip("routePriority", p.id as any)}
                      className={`cursor-pointer rounded-xl border-2 p-4 sm:p-5 flex items-center gap-3.5 sm:gap-5 transition-all ${trip.routePriority === p.id ? "border-emerald-600 bg-emerald-50 shadow-sm" : "border-gray-100 hover:border-gray-200"
                        }`}
                    >
                      <div className={`p-2.5 sm:p-3 rounded-full shrink-0 ${trip.routePriority === p.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <p.icon size={22} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-emerald-800">{p.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{p.desc}</p>
                      </div>
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${trip.routePriority === p.id ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                        }`}>
                        {trip.routePriority === p.id && <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 7: Lodging */}
            {currentStage === 6 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 sm:space-y-8">
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 mb-2">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-emerald-800">Accommodation & Real Stays</h2>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5">
                      <MapPin size={13} /> {targetDestination}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-sans">
                    Filter and choose real hotels & lodges in {targetDestination}. Selected stay will be automatically added to your trip budget calculation.
                  </p>
                </div>

                {/* 3 Lodging Style Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                  {[
                    { id: "Boutique", title: "Boutique Stays", icon: Home, desc: "Intimate, unique & heritage stays." },
                    { id: "Luxury", title: "Luxury Resorts", icon: Star, desc: "5-star amenities & premium villas." },
                    { id: "Eco", title: "Eco-Lodges", icon: Leaf, desc: "Sustainable nature stays & budget lodges." },
                  ].map((l) => {
                    const isSelected = trip.lodgingType?.includes(l.id);
                    return (
                      <div
                        key={l.id}
                        onClick={() => {
                          const current = trip.lodgingType || [];
                          const newTypes = isSelected
                            ? current.filter(x => x !== l.id)
                            : [...current, l.id];
                          updateTrip("lodgingType", newTypes);
                        }}
                        className={`cursor-pointer rounded-2xl border-2 p-4 sm:p-6 flex flex-col items-center text-center transition-all ${isSelected ? "border-emerald-600 bg-emerald-50 shadow-md scale-102" : "border-gray-100 hover:border-gray-200"
                          }`}
                      >
                        <div className={`p-3 sm:p-4 rounded-full mb-2 sm:mb-3 ${isSelected ? "bg-emerald-600 text-white" : "bg-gray-50 text-gray-400"}`}>
                          <l.icon size={24} />
                        </div>
                        <h3 className="font-serif font-medium text-base sm:text-lg text-emerald-800">{l.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{l.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Real Hotels for Destination */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-lg sm:text-xl font-serif font-semibold text-emerald-900 flex items-center gap-2">
                      <Bed className="text-emerald-600" size={20} />
                      Real Hotels & Lodges in {targetDestination}
                    </h3>
                    <span className="text-xs text-gray-500 font-medium">
                      Showing {filteredHotels.length} stay{filteredHotels.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Loading State */}
                  {hotelsLoading && (
                    <div className="py-12 text-center text-gray-500 space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                      <p className="text-xs sm:text-sm font-medium">Searching OpenStreetMap for real hotels in {targetDestination}...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {!hotelsLoading && hotelsError && (
                    <div className="py-6 sm:py-8 text-center text-amber-700 bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <p className="font-semibold text-xs sm:text-sm">{hotelsError}</p>
                      <p className="text-xs mt-1 text-amber-600">Select a stay category above to estimate lodging budget.</p>
                    </div>
                  )}

                  {/* Real Hotel List */}
                  {!hotelsLoading && filteredHotels.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredHotels.map((hotel) => {
                        const isChosen = trip.selectedHotelName === hotel.name;
                        const rooms = Math.max(1, Math.ceil(trip.numberOfMembers / 2));
                        const totalCostForStay = hotel.estimatedPricePerNight * tripNights * rooms;

                        return (
                          <div
                            key={hotel.id}
                            onClick={() => handleSelectHotel(hotel)}
                            className={`cursor-pointer rounded-2xl border-2 overflow-hidden flex flex-col justify-between transition-all group ${isChosen
                              ? "border-emerald-600 bg-emerald-50/90 ring-4 ring-emerald-500/20 shadow-lg scale-102"
                              : "border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md"
                              }`}
                          >
                            <div>
                              <div className="relative h-36 sm:h-40 w-full bg-gray-100 overflow-hidden">
                                <img
                                  src={hotel.photoUrl}
                                  alt={hotel.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${hotel.category === "Luxury"
                                  ? "bg-amber-500/90 text-white"
                                  : hotel.category === "Eco"
                                    ? "bg-emerald-600/90 text-white"
                                    : "bg-blue-600/90 text-white"
                                  }`}>
                                  {hotel.category}
                                </span>
                                {isChosen && (
                                  <span className="absolute top-2.5 right-2.5 p-1 rounded-full bg-emerald-600 text-white shadow-md">
                                    <CheckCircle2 size={16} />
                                  </span>
                                )}
                              </div>

                              <div className="p-3.5 sm:p-4 space-y-1.5">
                                <h4 className="font-serif font-bold text-sm sm:text-base text-emerald-950 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                  {hotel.name}
                                </h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 line-clamp-1">
                                  <MapPin size={12} className="shrink-0 text-gray-400" />
                                  {hotel.address}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold pt-0.5">
                                  <Star size={13} className="fill-amber-400 text-amber-400" />
                                  {hotel.rating}
                                  <span className="text-gray-400 font-normal">({hotel.user_ratings_total} reviews)</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-3.5 sm:p-4 pt-0 border-t border-gray-100 flex items-center justify-between mt-2">
                              <div>
                                <span className="text-base sm:text-lg font-bold text-emerald-700">₹{hotel.estimatedPricePerNight.toLocaleString()}</span>
                                <span className="text-[10px] sm:text-[11px] text-gray-500"> / night</span>
                                <div className="text-[10px] text-emerald-600 font-medium">
                                  Total: ₹{totalCostForStay.toLocaleString()} ({tripNights}N, {rooms} rm{rooms > 1 ? "s" : ""})
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectHotel(hotel);
                                }}
                                className={`px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${isChosen
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                  }`}
                              >
                                {isChosen ? "Selected ✓" : "Select Stay"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage 8: Review */}
            {currentStage === 7 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles size={14} className="text-emerald-600" /> Final Master Review
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-emerald-900 mb-2">
                    Your Bespoke Journey
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-sans max-w-lg mx-auto">
                    Review your curated itinerary preferences before we generate your AI-optimized travel plan.
                  </p>
                </div>

                <div className="bg-gray-50/80 rounded-2xl p-3.5 sm:p-6 md:p-8 border border-gray-200/80 flex-1 space-y-4 sm:space-y-6">
                  {/* Route & Dates Banner */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-emerald-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Planned Route</p>
                        <div className="flex items-start sm:items-center gap-2 flex-wrap">
                          <span className="font-bold text-emerald-950 text-sm sm:text-base flex items-center gap-1">
                            <Navigation size={14} className="text-emerald-600 shrink-0" />
                            {trip.startLocation || "Origin Not Set"}
                          </span>
                          <span className="text-emerald-600 font-bold hidden sm:inline">→</span>
                          <span className="font-bold text-emerald-800 text-sm sm:text-base flex items-center gap-1">
                            <MapPin size={14} className="text-emerald-600 shrink-0" />
                            {trip.destinations[0] || "Destination Not Set"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white font-bold rounded-full text-xs shadow-xs">
                          {tripNights > 0 ? `${tripNights} Night${tripNights > 1 ? "s" : ""} / ${tripNights + 1} Days` : "Duration Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-700">
                        <span className="text-gray-400 uppercase font-bold text-[10px] block">Travel Timeline</span>
                        {trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start Date Pending'}
                        {' — '}
                        {trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'End Date Pending'}
                      </div>
                    </div>
                  </div>

                  {/* 4 Specification Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Profile */}
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                        <Users size={15} className="text-emerald-600" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Profile</span>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-950 text-sm sm:text-base capitalize">{trip.tripType || "Solo"}</p>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {trip.numberOfMembers} Traveler{trip.numberOfMembers !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Fleet */}
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                        <Car size={15} className="text-emerald-600" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Fleet</span>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-950 text-sm sm:text-base capitalize line-clamp-1">
                          {trip.vehicleType === "car" && carBrand && carModel
                            ? `${carBrand} ${carModel}`
                            : `${trip.vehicleType || "Car"}`}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium capitalize">
                          {trip.fuelType || "Petrol"} • {trip.mileage || 15} km/L
                        </p>
                      </div>
                    </div>

                    {/* Budget Cap */}
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                        <Wallet size={15} className="text-emerald-600" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Budget Cap</span>
                      </div>
                      <div>
                        <p className="font-black text-emerald-700 text-sm sm:text-base">
                          ₹{trip.budgetCap.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium">Spending Limit</p>
                      </div>
                    </div>

                    {/* Route Priority */}
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                        <Leaf size={15} className="text-emerald-600" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Priority</span>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-950 text-sm sm:text-base capitalize">
                          {trip.routePriority === "eco-friendly"
                            ? "Eco Friendly"
                            : trip.routePriority === "toll-free"
                              ? "Avoid Tolls"
                              : "Express Route"}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium">Optimal Route</p>
                      </div>
                    </div>
                  </div>

                  {/* Vibe & Lodging Styles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs">
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Selected Vibes</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {trip.moods && trip.moods.length > 0 ? (
                          trip.moods.map((m) => (
                            <span key={m} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                              {m}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None selected</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs">
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lodging Styles</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {trip.lodgingType && trip.lodgingType.length > 0 ? (
                          trip.lodgingType.map((l) => (
                            <span key={l} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                              {l}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected Accommodation & Lodging Budget Card */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-emerald-200 shadow-xs">
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2.5">
                      Selected Accommodation & Lodging Budget
                    </p>
                    {trip.selectedHotelName ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
                            <Bed size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-950 text-sm sm:text-base leading-tight">
                              {trip.selectedHotelName}
                            </p>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">
                              ₹{(trip.selectedHotelPrice || 0).toLocaleString()} / night ({tripNights} Nights • {Math.max(1, Math.ceil(trip.numberOfMembers / 2))} Room{Math.max(1, Math.ceil(trip.numberOfMembers / 2)) > 1 ? "s" : ""})
                            </p>
                          </div>
                        </div>
                        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-200/60 shrink-0">
                          <p className="font-black text-emerald-700 text-base sm:text-lg">
                            ₹{(trip.costBreakdown?.hotel || (trip.selectedHotelPrice || 0) * tripNights * Math.max(1, Math.ceil(trip.numberOfMembers / 2))).toLocaleString()}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Added to Trip Budget</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 italic">
                        No specific hotel selected. Standard category lodging estimate included in the final plan.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls - Sticky and prominent */}
          <div className="p-4 sm:p-6 md:px-12 bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-between items-center rounded-b-2xl sticky bottom-0 z-20 shadow-xs">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="px-4 sm:px-6 h-11 border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 font-medium shadow-sm"
            >
              <ArrowLeft size={16} className="mr-1.5 sm:mr-2" /> Back
            </Button>

            {currentStage < stages.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!isStageValid()}
                className="px-6 sm:px-8 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 shadow-md shadow-emerald-600/20"
              >
                Next <ArrowRight size={16} className="ml-1.5 sm:ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isStageValid()}
                className="px-6 sm:px-8 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {isSubmitting ? "Crafting..." : "Generate Bespoke Plan"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElitePlanner;
