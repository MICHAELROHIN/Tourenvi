import React, { useEffect, useMemo, useState } from "react";
import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

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

const ElitePlanner = () => {
  const { trip, updateTrip } = useTrip();
  const [currentStage, setCurrentStage] = useState(0);
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
        `http://localhost:8000/api/fuel-price?city=${encodeURIComponent(city)}&fuelType=${encodeURIComponent(normalizedFuel)}`,
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
        const res = await axios.get("http://localhost:8000/api/cars");
        setCarSuggestions(res.data);
      } catch (err) {
        console.error("Failed to fetch car suggestions:", err);
      }
    };
    fetchCars();
    
    fetch(`http://localhost:8000/brands`)
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
      const res = await fetch(`http://localhost:8000/models?brand=${encodeURIComponent(value)}`);
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
        `http://localhost:8000/fuel?brand=${encodeURIComponent(carBrand)}&model=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setFuels(data || []);
    } catch (e) { setFuels([]); }
  };

  const fetchMileage = async (fuel: string) => {
    if (!carBrand || !carModel || !fuel) return;
    try {
      const res = await fetch(
        `http://localhost:8000/mileage?brand=${encodeURIComponent(carBrand)}&model=${encodeURIComponent(carModel)}&fuel=${encodeURIComponent(fuel)}`
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
      const fetchDestinationHotels = async () => {
        setHotelsLoading(true);
        setHotelsError(null);
        try {
          const res = await fetch(`http://localhost:8000/get-hotels?destination=${encodeURIComponent(targetDestination)}`);
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
      const response = await axios.post("http://localhost:8000/api/build-itinerary", {
        tripData: trip
      });
      
      if (response.data && response.data.success) {
        // Store computed values in localStorage for the dashboard to read
        localStorage.setItem("tourenvi.trip.calculations", JSON.stringify(response.data));
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
        localStorage.setItem("tourenvi.trip.calculations", JSON.stringify(error.response.data));
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
      <div className="w-full bg-white shadow-sm border-b border-gray-100 py-4 px-6 md:px-12 z-10 sticky top-16">
        <div className="max-w-6xl mx-auto flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
          <div 
            className={`absolute left-0 top-1/2 h-0.5 bg-emerald-500 -z-10 -translate-y-1/2 transition-all duration-500 ${trackerWidthClasses[currentStage] || "w-[12.5%]"}`}
          ></div>
          
          {stages.map((stage, index) => {
            const isActive = index === currentStage;
            const isCompleted = index < currentStage;
            return (
              <div key={stage} className="flex flex-col items-center gap-2 bg-white px-2">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                    isActive ? "bg-emerald-700 text-white ring-4 ring-emerald-200" : 
                    isCompleted ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                </div>
                <span className={`text-xs hidden md:block font-medium ${isActive ? "text-emerald-800" : "text-gray-400"}`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
          
          <div className="p-8 md:p-12 flex-1">
            {/* Stage 1: Profile */}
            {currentStage === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-4xl font-serif font-semibold text-emerald-800 mb-4">Who is traveling?</h2>
                <p className="text-gray-500 mb-8 font-sans">Select your travel identity to tailor the experience.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 ${
                        trip.tripType === profile.id ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-4 rounded-full mb-4 ${trip.tripType === profile.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <profile.icon size={32} />
                      </div>
                      <h3 className="font-serif font-medium text-xl mb-2">{profile.title}</h3>
                      <p className="text-sm text-gray-500">{profile.desc}</p>
                    </div>
                  ))}
                </div>

                {!isSoloTrip && (
                  <div className="mt-8 max-w-md mx-auto bg-gray-50 border border-gray-100 rounded-xl p-6 flex items-center justify-between shadow-inner">
                    <span className="text-base font-semibold text-emerald-800 font-sans">Refine exact traveler count:</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => updateTrip("numberOfMembers", Math.max(2, trip.numberOfMembers - 1))}
                        className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-700 hover:text-white transition-all shadow-sm"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-emerald-800 w-6 text-center">{trip.numberOfMembers}</span>
                      <button 
                        onClick={() => updateTrip("numberOfMembers", Math.min(20, trip.numberOfMembers + 1))}
                        className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-700 hover:text-white transition-all shadow-sm"
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
                <h2 className="text-4xl font-serif font-semibold text-emerald-800 mb-4">Chart Your Course & Travel Dates</h2>
                <p className="text-gray-500 mb-8 font-sans">Define your starting point, dream destination, and travel timeline.</p>
                
                <div className="space-y-6 max-w-2xl mx-auto mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="block text-sm font-semibold text-emerald-800 mb-2">Starting Location</label>
                      <div className="relative">
                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                          value={trip.startLocation}
                          onChange={(e) => updateTrip("startLocation", e.target.value)}
                          placeholder="e.g. Chennai, India"
                          className="pl-12 h-14 text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-semibold text-emerald-800 mb-2">Destination</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                        <Input 
                          value={trip.destinations[0] || ""}
                          onChange={(e) => updateTrip("destinations", [e.target.value])}
                          placeholder="e.g. Ooty, Tamil Nadu"
                          className="pl-12 h-14 text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20"
                        />
                      </div>
                    </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                      <div className="relative">
                        <label className="block text-sm font-semibold text-emerald-800 mb-2">Start Date</label>
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
                            className="h-14 text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20 focus:ring-2 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-semibold text-emerald-800 mb-2">End Date</label>
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
                            className="h-14 text-lg bg-gray-50 border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/20 focus:ring-2 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                  {trip.startDate && trip.endDate && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-emerald-800">
                      <span className="font-semibold">Calculated Trip Duration:</span>
                      <span className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-full text-sm">
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
                <h2 className="text-4xl font-serif font-semibold text-emerald-800 mb-4">Fleet Specification</h2>
                <p className="text-gray-500 mb-8 font-sans">Select your vehicle for accurate routing and pricing.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
                        className={`cursor-pointer rounded-xl border-2 p-6 flex items-center gap-4 transition-all hover:shadow-md ${
                          trip.vehicleType === v.id ? "border-emerald-500 bg-emerald-50 shadow-md animate-pulse-subtle" : "border-gray-100"
                        }`}
                      >
                        <div className={`p-3 rounded-lg ${trip.vehicleType === v.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                          <v.icon size={28} />
                        </div>
                        <h3 className="font-serif font-medium text-xl text-emerald-800">{v.title}</h3>
                      </div>
                    ))}
                </div>

                {/* Vehicle Selection based on FuelEstimator.tsx layout */}
                {trip.vehicleType === "car" ? (
                  <div className="mb-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-emerald-800">Brand</label>
                        <Select value={carBrand} onValueChange={onBrandChange}>
                          <SelectTrigger className="h-12 bg-white border-gray-200">
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
                        <label className="block text-sm font-semibold text-emerald-800">Model</label>
                        <Select value={carModel} onValueChange={onModelChange} disabled={!carBrand || models.length === 0}>
                          <SelectTrigger className="h-12 bg-white border-gray-200">
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
                        <label className="block text-sm font-semibold text-emerald-800">Fuel Type</label>
                        <Select value={trip.fuelType || ""} onValueChange={onFuelChange} disabled={!carModel || fuels.length === 0}>
                          <SelectTrigger className="h-12 bg-white border-gray-200 capitalize">
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
                        <label className="block text-sm font-semibold text-emerald-800 mb-2">Expected Mileage (km/L)</label>
                        <div className="relative">
                          <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <Input 
                            type="number"
                            value={trip.mileage}
                            onChange={(e) => updateTrip("mileage", Number(e.target.value))}
                            className="pl-12 h-12 text-lg bg-gray-50 focus:border-emerald-600 focus:ring-emerald-600/20"
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
                      <label className="block text-sm font-semibold text-emerald-800 mb-2">Fuel Type</label>
                      <div className="flex gap-4">
                        {["Petrol"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => updateTrip("fuelType", f.toLowerCase() as any)}
                            className={`px-6 py-3 rounded-lg border font-medium transition-colors ${
                              trip.fuelType === f.toLowerCase() ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-600/50"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-emerald-800 mb-2">Expected Mileage (km/L)</label>
                      <div className="relative">
                        <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                          type="number"
                          value={trip.mileage}
                          onChange={(e) => updateTrip("mileage", Number(e.target.value))}
                          className="pl-12 h-12 text-lg bg-gray-50 focus:border-emerald-600 focus:ring-emerald-600/20"
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
                <h2 className="text-4xl font-serif font-semibold text-emerald-800 mb-4">The Cultured Vibe</h2>
                <p className="text-gray-500 mb-8 font-sans">Curate the essence of your journey.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        className={`cursor-pointer rounded-2xl p-6 aspect-square flex flex-col items-center justify-center text-center transition-all duration-300 ${
                          isSelected ? "bg-emerald-600 text-white shadow-lg scale-105" : `${mood.bg} text-gray-700 hover:shadow-md`
                        }`}
                      >
                        <mood.icon size={40} className="mb-4 opacity-80" />
                        <h3 className="font-serif font-medium text-lg">{mood.id}</h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stage 5: Budget */}
            {currentStage === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-4xl font-serif font-semibold text-emerald-800 mb-4">Financial Blueprint</h2>
                <p className="text-gray-500 mb-12 font-sans">Set your budget limit for a personalized experience.</p>
                
                <div className="max-w-2xl mx-auto text-center">
                  <div className="text-6xl font-serif font-bold text-emerald-800 mb-8">
                    ₹{trip.budgetCap.toLocaleString()}
                  </div>
                  
                  <Slider
                    value={[trip.budgetCap]}
                    min={10000}
                    max={500000}
                    step={5000}
                    onValueChange={(vals) => updateTrip("budgetCap", vals[0])}
                    className="mb-8"
                  />
                  
                  <div className="flex justify-between text-gray-400 font-medium text-sm">
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
                <h2 className="text-4xl font-serif font-semibold text-emerald-800 mb-4">Multi-Factor Priority</h2>
                <p className="text-gray-500 mb-8 font-sans">Optimize your route logic.</p>
                
                <div className="space-y-4 max-w-2xl mx-auto">
                  {[
                    { id: "eco-friendly", title: "Eco-friendly / Fuel Efficient", icon: Leaf, desc: "Minimizes CO2 emissions and saves fuel." },
                    { id: "toll-free", title: "Avoid Tolls", icon: Wallet, desc: "Cost-effective routing via state highways." },
                    { id: "fastest", title: "Express Route (Fastest)", icon: Clock, desc: "Prioritizes speed via major expressways." },
                  ].map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => updateTrip("routePriority", p.id as any)}
                      className={`cursor-pointer rounded-xl border-2 p-5 flex items-center gap-5 transition-all ${
                        trip.routePriority === p.id ? "border-emerald-600 bg-emerald-50 shadow-sm" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className={`p-3 rounded-full ${trip.routePriority === p.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <p.icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-emerald-800">{p.title}</h3>
                        <p className="text-sm text-gray-500">{p.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        trip.routePriority === p.id ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                      }`}>
                        {trip.routePriority === p.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 7: Lodging */}
            {currentStage === 6 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                    <h2 className="text-4xl font-serif font-semibold text-emerald-800">Accommodation & Real Stays</h2>
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5">
                      <MapPin size={14} /> Destination: {targetDestination}
                    </span>
                  </div>
                  <p className="text-gray-500 font-sans">
                    Filter and choose real hotels & lodges in {targetDestination}. Selected stay will be automatically added to your trip budget calculation.
                  </p>
                </div>

                {/* 3 Lodging Style Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        className={`cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center text-center transition-all ${
                          isSelected ? "border-emerald-600 bg-emerald-50 shadow-md scale-102" : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className={`p-4 rounded-full mb-3 ${isSelected ? "bg-emerald-600 text-white" : "bg-gray-50 text-gray-400"}`}>
                          <l.icon size={28} />
                        </div>
                        <h3 className="font-serif font-medium text-lg text-emerald-800">{l.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{l.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Real Hotels for Destination */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif font-semibold text-emerald-900 flex items-center gap-2">
                      <Bed className="text-emerald-600" size={22} />
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
                      <p className="text-sm font-medium">Searching OpenStreetMap for real hotels in {targetDestination}...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {!hotelsLoading && hotelsError && (
                    <div className="py-8 text-center text-amber-700 bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <p className="font-semibold text-sm">{hotelsError}</p>
                      <p className="text-xs mt-1 text-amber-600">Select a stay category above to estimate lodging budget.</p>
                    </div>
                  )}

                  {/* Real Hotel List */}
                  {!hotelsLoading && filteredHotels.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[480px] overflow-y-auto pr-2">
                      {filteredHotels.map((hotel) => {
                        const isChosen = trip.selectedHotelName === hotel.name;
                        const rooms = Math.max(1, Math.ceil(trip.numberOfMembers / 2));
                        const totalCostForStay = hotel.estimatedPricePerNight * tripNights * rooms;

                        return (
                          <div
                            key={hotel.id}
                            onClick={() => handleSelectHotel(hotel)}
                            className={`cursor-pointer rounded-2xl border-2 overflow-hidden flex flex-col justify-between transition-all group ${
                              isChosen
                                ? "border-emerald-600 bg-emerald-50/90 ring-4 ring-emerald-500/20 shadow-lg scale-102"
                                : "border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md"
                            }`}
                          >
                            <div>
                              <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                                <img
                                  src={hotel.photoUrl}
                                  alt={hotel.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                                  hotel.category === "Luxury"
                                    ? "bg-amber-500/90 text-white"
                                    : hotel.category === "Eco"
                                    ? "bg-emerald-600/90 text-white"
                                    : "bg-blue-600/90 text-white"
                                }`}>
                                  {hotel.category}
                                </span>
                                {isChosen && (
                                  <span className="absolute top-3 right-3 p-1.5 rounded-full bg-emerald-600 text-white shadow-md">
                                    <CheckCircle2 size={16} />
                                  </span>
                                )}
                              </div>

                              <div className="p-4 space-y-2">
                                <h4 className="font-serif font-bold text-base text-emerald-950 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                  {hotel.name}
                                </h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 line-clamp-1">
                                  <MapPin size={12} className="shrink-0 text-gray-400" />
                                  {hotel.address}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold pt-1">
                                  <Star size={14} className="fill-amber-400 text-amber-400" />
                                  {hotel.rating}
                                  <span className="text-gray-400 font-normal">({hotel.user_ratings_total} reviews)</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 pt-0 border-t border-gray-100 flex items-center justify-between mt-3">
                              <div>
                                <span className="text-lg font-bold text-emerald-700">₹{hotel.estimatedPricePerNight.toLocaleString()}</span>
                                <span className="text-[11px] text-gray-500"> / night</span>
                                <div className="text-[10px] text-emerald-600 font-medium">
                                  Total: ₹{totalCostForStay.toLocaleString()} ({tripNights}N, {rooms} room{rooms > 1 ? "s" : ""})
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectHotel(hotel);
                                }}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                  isChosen
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
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-serif font-semibold text-emerald-800 mb-3">Your Bespoke Journey</h2>
                  <p className="text-gray-500 font-sans">Review your elegant itinerary preferences before we craft your master plan.</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Route</p>
                      <p className="font-semibold text-emerald-800">{trip.startLocation || "Not set"} → {trip.destinations[0] || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Profile</p>
                      <p className="font-semibold text-emerald-800 capitalize">{trip.tripType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Fleet</p>
                      <p className="font-semibold text-emerald-800 capitalize">
                        {trip.vehicleType === "car" && carBrand && carModel 
                          ? `${carBrand} ${carModel} (${trip.fuelType})` 
                          : `${trip.vehicleType} (${trip.fuelType})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Budget Cap</p>
                      <p className="font-semibold text-emerald-600">₹{trip.budgetCap.toLocaleString()}</p>
                    </div>

                    {/* Travel Dates */}
                    <div className="col-span-2 md:col-span-4 bg-emerald-100/60 border border-emerald-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-sm">
                          <Calendar size={22} />
                        </div>
                        <div>
                          <p className="text-xs text-emerald-800 uppercase tracking-wider font-bold">Selected Travel Dates</p>
                          <p className="font-bold text-emerald-950 text-base">
                            {trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start Date Not Set'}
                            {' → '}
                            {trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'End Date Not Set'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3.5 py-1.5 bg-emerald-700 text-white font-bold rounded-full text-xs shadow-sm">
                          {tripNights > 0 ? `${tripNights} Night${tripNights > 1 ? 's' : ''} / ${tripNights + 1} Days` : 'Duration Not Set'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Vibe</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {trip.moods.map(m => (
                          <span key={m} className="px-3 py-1 bg-white border rounded-full text-xs font-medium text-emerald-800">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Lodging Styles</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {trip.lodgingType?.map(l => (
                          <span key={l} className="px-3 py-1 bg-white border rounded-full text-xs font-medium text-emerald-800">{l}</span>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-4 border-t border-gray-200 pt-4 mt-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Selected Accommodation & Lodging Budget</p>
                      {trip.selectedHotelName ? (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                              <Bed size={22} />
                            </div>
                            <div>
                              <p className="font-bold text-emerald-900 text-sm">{trip.selectedHotelName}</p>
                              <p className="text-xs text-gray-500">₹{(trip.selectedHotelPrice || 0).toLocaleString()} / night ({tripNights} Nights stay)</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-700 text-base">₹{(trip.costBreakdown?.hotel || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">Added to Trip Budget</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No specific hotel selected. Standard category lodging estimate included.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 md:px-12 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
            <Button 
              variant="outline" 
              onClick={handlePrev}
              disabled={isSubmitting}
              className="px-6 border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 font-medium shadow-sm"
            >
              <ArrowLeft size={16} className="mr-2" /> Back
            </Button>

            {currentStage < stages.length - 1 ? (
              <Button 
                onClick={handleNext}
                disabled={!isStageValid()}
                className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
              >
                Next <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !isStageValid()}
                className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-600/30 disabled:opacity-50"
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
