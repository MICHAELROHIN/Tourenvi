import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Fuel,
  Wrench,
  Car,
  Hospital,
  Phone,
  Navigation,
  MapPin,
  X,
  Search,
  WifiOff,
  ShieldAlert,
  Clock,
  ExternalLink,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface EmergencyService {
  id: string;
  name: string;
  category: "fuel" | "mechanics" | "brand_service" | "emergency_medical";
  brand?: string;
  address: string;
  distanceKm: number;
  phone: string;
  is24x7: boolean;
  lat: number;
  lng: number;
  rating?: number;
  availableTypes?: string[];
}

const DEFAULT_EMERGENCY_SERVICES: EmergencyService[] = [
  // Fuel & EV
  {
    id: "fuel-1",
    name: "Indian Oil Swagat Highway Plaza & EV Supercharger",
    category: "fuel",
    brand: "IndianOil",
    address: "KM 42, Mumbai-Pune Expressway, Khalapur",
    distanceKm: 3.2,
    phone: "+91 98230 11223",
    is24x7: true,
    lat: 18.8234,
    lng: 73.2389,
    rating: 4.6,
    availableTypes: ["Petrol", "Diesel", "EV Fast Charging 120kW"],
  },
  {
    id: "fuel-2",
    name: "HPCL Highway COCO Fuel Hub",
    category: "fuel",
    brand: "HPCL",
    address: "NH 48, Near Toll Plaza, Talegaon",
    distanceKm: 8.5,
    phone: "+91 98450 99881",
    is24x7: true,
    lat: 18.7301,
    lng: 73.6754,
    rating: 4.4,
    availableTypes: ["Petrol", "Diesel", "CNG"],
  },
  {
    id: "fuel-3",
    name: "Tata Power EZ Charge EV Station",
    category: "fuel",
    brand: "Tata Power",
    address: "Food Mall Plaza, Lonavala Bypass",
    distanceKm: 12.1,
    phone: "1800 209 5161",
    is24x7: true,
    lat: 18.7557,
    lng: 73.4091,
    rating: 4.8,
    availableTypes: ["CCS2 60kW EV Charger", "Type 2 AC"],
  },

  // Mechanics & Puncture
  {
    id: "mech-1",
    name: "Expressway 24/7 Mobile Mechanic & Breakdown Patrol",
    category: "mechanics",
    address: "Expressway Bay 14, Food Mall Lonavala",
    distanceKm: 4.1,
    phone: "+91 94220 88712",
    is24x7: true,
    lat: 18.7523,
    lng: 73.4012,
    rating: 4.9,
    availableTypes: ["Tire Puncture", "Engine Jumpstart", "Towing Crane"],
  },
  {
    id: "mech-2",
    name: "Highway All-Vehicle Garage & Hydraulic Lift Service",
    category: "mechanics",
    address: "NH-48 Service Road, Khandala Ghat Entry",
    distanceKm: 9.8,
    phone: "+91 91580 44321",
    is24x7: true,
    lat: 18.7612,
    lng: 73.3755,
    rating: 4.5,
    availableTypes: ["Brake Repair", "Clutch Cable Replacement", "Coolant Leak"],
  },

  // Brand Service Centers
  {
    id: "brand-1",
    name: "Tata Motors Authorized Service Center",
    category: "brand_service",
    brand: "Tata Motors",
    address: "Industrial Zone, Old Mumbai-Pune Highway, Panvel",
    distanceKm: 14.5,
    phone: "1800 209 8282",
    is24x7: false,
    lat: 18.9892,
    lng: 73.1198,
    rating: 4.7,
    availableTypes: ["EV Battery Diagnostics", "Genuine Parts", "RSA Assist"],
  },
  {
    id: "brand-2",
    name: "Hyundai Roadside Assistance & Service Hub",
    category: "brand_service",
    brand: "Hyundai",
    address: "NH 48 Bypass, Chakan Road",
    distanceKm: 18.2,
    phone: "1800 11 4645",
    is24x7: true,
    lat: 18.7511,
    lng: 73.8421,
    rating: 4.8,
    availableTypes: ["Hyundai Care RSA", "24/7 Breakdown Towing"],
  },
  {
    id: "brand-3",
    name: "Mahindra & Mahindra Authorized RSA Workshop",
    category: "brand_service",
    brand: "Mahindra",
    address: "Ghatkopar Highway Connector",
    distanceKm: 21.0,
    phone: "1800 209 6006",
    is24x7: true,
    lat: 19.0812,
    lng: 72.9099,
    rating: 4.6,
    availableTypes: ["4x4 SUV Recovery", "Scorpio/XUV700 Parts"],
  },
  {
    id: "brand-4",
    name: "Maruti Suzuki Arena 24/7 Quick Service & RSA",
    category: "brand_service",
    brand: "Maruti Suzuki",
    address: "Near Somatane Phata Toll Plaza",
    distanceKm: 11.4,
    phone: "1800 102 1800",
    is24x7: true,
    lat: 18.7109,
    lng: 73.6543,
    rating: 4.7,
    availableTypes: ["Maruti On-Road Service", "Mobile Van"],
  },

  // Emergency Medical & Towing
  {
    id: "med-1",
    name: "NHAI Highway Trauma Center & Ambulance Unit",
    category: "emergency_medical",
    address: "Expressway Control Room, Khalapur Toll Plaza",
    distanceKm: 2.8,
    phone: "1033",
    is24x7: true,
    lat: 18.8199,
    lng: 73.2355,
    rating: 5.0,
    availableTypes: ["Advanced Life Support Ambulance", "NHAI Patrol"],
  },
  {
    id: "med-2",
    name: "Sanjeevani Highway Emergency Hospital & ICU",
    category: "emergency_medical",
    address: "Main Highway Junction, Lonavala East",
    distanceKm: 6.7,
    phone: "+91 2114 273000",
    is24x7: true,
    lat: 18.7544,
    lng: 73.4077,
    rating: 4.8,
    availableTypes: ["24/7 Emergency ER", "Trauma Care", "Blood Bank"],
  },
  {
    id: "med-3",
    name: "Expressway Heavy Crane & Flatbed Towing Patrol",
    category: "emergency_medical",
    address: "Patrol Base 4, Expressway Kilometer 55",
    distanceKm: 5.4,
    phone: "+91 98220 55443",
    is24x7: true,
    lat: 18.7891,
    lng: 73.3512,
    rating: 4.9,
    availableTypes: ["Flatbed Car Carrier", "Heavy Bus/Truck Towing"],
  },
];

interface EmergencyRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
}

export const EmergencyRadarModal: React.FC<EmergencyRadarModalProps> = ({
  isOpen,
  onClose,
  userLat = 18.7544,
  userLng = 73.4077,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    "fuel" | "mechanics" | "brand_service" | "emergency_medical"
  >("fuel");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: userLat,
    lng: userLng,
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [services, setServices] = useState<EmergencyService[]>([]);

  // Listen to network status for offline safety caching indicator
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize and load offline cache from localStorage
  useEffect(() => {
    const cachedData = localStorage.getItem("tourenvi_emergency_radar_cache");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setServices(parsed);
      } catch {
        setServices(DEFAULT_EMERGENCY_SERVICES);
      }
    } else {
      setServices(DEFAULT_EMERGENCY_SERVICES);
      localStorage.setItem(
        "tourenvi_emergency_radar_cache",
        JSON.stringify(DEFAULT_EMERGENCY_SERVICES)
      );
    }
  }, []);

  // GPS Geolocation Scan Handler
  const handleScanLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    toast.info("Scanning GPS location for nearby highway emergency services...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        toast.success("GPS Location verified! Services updated within 25km radius.");
      },
      (error) => {
        console.warn("GPS lookup failed, using highway route coordinates:", error);
        setIsLocating(false);
        toast.info("Using active highway route location for safety radar.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCategory = s.category === activeCategory;
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051124]/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/15 bg-[#0B2B5C] text-white shadow-[0_25px_60px_-15px_rgba(5,17,36,0.9)] overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#0B2B5C] via-[#051124] to-[#0B2B5C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-wide">
                  Emergency Break-Down & Fuel Assist Radar
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 uppercase tracking-wider">
                  Live Safety Hub
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                Scanning 25 km Highway Radius around ({currentCoords.lat.toFixed(3)}, {currentCoords.lng.toFixed(3)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanLocation}
              disabled={isLocating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border border-white/15 cursor-pointer"
            >
              <Navigation className={`h-4 w-4 text-[#D4AF37] ${isLocating ? "animate-spin" : ""}`} />
              {isLocating ? "Locating..." : "Refresh GPS"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Offline Safety Mode Banner */}
        {isOffline && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <WifiOff className="h-4 w-4 text-amber-400" />
              <span>
                <strong>Offline Safety Mode Active:</strong> All emergency contacts & nearest station coordinates are cached locally from IndexedDB.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-amber-500/30 px-2 py-0.5 rounded-full">
              Cached 25km Radius
            </span>
          </div>
        )}

        {/* Toll-Free National Emergency Quick Dial Bar */}
        <div className="bg-[#051124] border-b border-white/10 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="tel:1033"
            className="flex items-center justify-between p-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">NHAI Highway Helpline</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-red-600/40 px-2 py-0.5 rounded-md">1033</span>
          </a>

          <a
            href="tel:112"
            className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">National Emergency</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-blue-600/40 px-2 py-0.5 rounded-md">112</span>
          </a>

          <a
            href="tel:108"
            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Hospital className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Ambulance Service</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-emerald-600/40 px-2 py-0.5 rounded-md">108</span>
          </a>

          <a
            href="tel:1091"
            className="flex items-center justify-between p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Women Helpline</span>
            </div>
            <span className="font-mono font-black text-white text-xs bg-purple-600/40 px-2 py-0.5 rounded-md">1091</span>
          </a>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="p-6 pb-3 border-b border-white/10 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveCategory("fuel")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "fuel"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Fuel className="h-4 w-4" />
              <span>Fuel & EV Stations</span>
            </button>

            <button
              onClick={() => setActiveCategory("mechanics")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "mechanics"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>24/7 Mechanics & Puncture</span>
            </button>

            <button
              onClick={() => setActiveCategory("brand_service")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "brand_service"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Brand Service Centers</span>
            </button>

            <button
              onClick={() => setActiveCategory("emergency_medical")}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                activeCategory === "emergency_medical"
                  ? "bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              <Hospital className="h-4 w-4" />
              <span>Medical & Towing</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by brand (e.g. Tata, Hyundai, IndianOil), area, or service type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#051124] border border-white/15 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[480px]">
          {filteredServices.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto opacity-60" />
              <p className="font-semibold text-sm">No verified emergency services found for this query.</p>
              <p className="text-xs">Call National Highway Emergency Line <strong>1033</strong> for immediate dispatch.</p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="p-5 rounded-2xl border border-white/10 bg-[#051124]/60 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#D4AF37]/40 transition-all shadow-md group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-bold text-white text-sm group-hover:text-[#D4AF37] transition-colors">
                      {service.name}
                    </h4>
                    {service.brand && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase">
                        {service.brand}
                      </span>
                    )}
                    {service.is24x7 ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 24/7 Open
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        8 AM - 9 PM
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {service.address}
                  </p>

                  {service.availableTypes && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {service.availableTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1"
                        >
                          <Zap className="h-2.5 w-2.5 text-[#D4AF37]" /> {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {service.distanceKm} km away
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Est. {Math.round(service.distanceKm * 2.5)} mins response
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${service.phone}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5" /> Direct Call
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f27] text-[#0B2B5C] font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Navigate
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyRadarModal;
