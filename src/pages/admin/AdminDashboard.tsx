import React, { useState, useEffect, useMemo } from "react";
import { adminAuth } from "@/lib/firebaseAdminAuth";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Navigation,
  Compass,
  DollarSign,
  TrendingUp,
  FileWarning,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Info,
  UserX,
  MapPin,
  Car,
  Fuel,
  Eye,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  X,
  Globe,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import AdminSidebar, { AdminTab } from "@/components/admin/AdminSidebar";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";

const COLORS_MOOD = ["#D4AF37", "#0B2B5C", "#10B981", "#EF4444"];
const COLORS_VEHICLE = ["#10B981", "#3B82F6", "#F59E0B"];

const TRIP_TRENDS_DATA = [
  { month: "Jan", trips: 140 },
  { month: "Feb", trips: 210 },
  { month: "Mar", trips: 185 },
  { month: "Apr", trips: 310 },
  { month: "May", trips: 450 },
  { month: "Jun", trips: 590 },
  { month: "Jul", trips: 720 },
];

const MOODS_DATA = [
  { name: "Nature", value: 45 },
  { name: "Adventure", value: 30 },
  { name: "Spiritual", value: 25 },
];

const VEHICLES_DATA = [
  { name: "EV", value: 60 },
  { name: "Hybrid", value: 25 },
  { name: "Gas", value: 15 },
];

const AdminDashboard: React.FC = () => {
  const [adminName, setAdminName] = useState("Officer");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [systemHealth, setSystemHealth] = useState("Excellent");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (user) => {
      if (user) {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            setAdminName(userDocSnap.data().name || "Officer");
          }
        } catch (error) {
          console.error("Error fetching admin name in dashboard:", error);
        }
      } else {
        setAdminName("Officer");
      }
    });
    return () => unsubscribe();
  }, []);

  const [users, setUsers] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [fuelOverrides, setFuelOverrides] = useState<any[]>([]);
  const [budgetLogs, setBudgetLogs] = useState<any[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  const [adminSearch, setAdminSearch] = useState("");
  const [adminPage, setAdminPage] = useState(1);
  
  const itemsPerPage = 5;

  const [selectedUserModal, setSelectedUserModal] = useState<any | null>(null);
  const [userTripsModal, setUserTripsModal] = useState<any[]>([]);
  const [loadingTripsModal, setLoadingTripsModal] = useState(false);

  const [overrideCity, setOverrideCity] = useState("");
  const [overridePetrol, setOverridePetrol] = useState("");
  const [overrideDiesel, setOverrideDiesel] = useState("");
  const [overrideToll, setOverrideToll] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [mapZoom, setMapZoom] = useState(5);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: "admin-google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), async (snap) => {
      if (snap.empty) {
        const defaultUsers = [
          { name: "Rohin Kumar", email: "rohin@tourenvi.com", phone: "+91 9876543210", role: "admin", authProvider: "google.com", status: "active", createdAt: new Date() },
          { name: "Anish Patel", email: "anish@gmail.com", phone: "+91 9876543211", role: "user", authProvider: "google.com", status: "active", createdAt: new Date() },
          { name: "Deepak Guide", email: "deepak@guide.com", phone: "+91 9876543212", role: "guide", authProvider: "password", status: "active", createdAt: new Date() },
          { name: "Sarah Support", email: "sarah@support.com", phone: "+91 9876543213", role: "support", authProvider: "password", status: "active", createdAt: new Date() },
          { name: "Rohan Suspension", email: "rohan@gmail.com", phone: "+91 9876543214", role: "user", authProvider: "google.com", status: "suspended", createdAt: new Date() },
        ];
        for (const u of defaultUsers) {
          const fakeUid = `fake_uid_${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(db, "users", fakeUid), { uid: fakeUid, ...u });
        }
      } else {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(list);
      }
    });

    const unsubFleet = onSnapshot(collection(db, "active_fleet"), async (snap) => {
      if (snap.empty) {
        const defaultFleet = [
          { regNo: "MH-12-GQ-4820", model: "Tesla Model 3 (EV)", driver: "Amit Sharma", route: "Mumbai ➔ Pune", status: "In Transit", progress: 75, lat: 18.975, lng: 72.8258 },
          { regNo: "DL-03-CA-9104", model: "Toyota Prius (Hybrid)", driver: "Vikram Singh", route: "Delhi ➔ Jaipur", status: "Delayed", progress: 40, lat: 28.6139, lng: 77.209 },
          { regNo: "KA-01-MJ-6723", model: "Hyundai Ioniq 5 (EV)", driver: "Nikhil Gowda", route: "Bangalore ➔ Mysore", status: "In Transit", progress: 90, lat: 12.9716, lng: 77.5946 },
          { regNo: "KL-07-BZ-5511", model: "Ford Endeavour (Gas)", driver: "Rahul Nair", route: "Cochin ➔ Munnar", status: "Resting", progress: 15, lat: 10.0159, lng: 76.3419 },
        ];
        for (const f of defaultFleet) {
          await setDoc(doc(db, "active_fleet", f.regNo), f);
        }
      } else {
        setFleet(snap.docs.map((doc) => ({ regNo: doc.id, ...doc.data() })));
      }
    });

    const unsubFuel = onSnapshot(collection(db, "fuel_overrides"), async (snap) => {
      if (!snap.empty) {
        setFuelOverrides(snap.docs.map((doc) => doc.data()));
      }
    });

    const unsubLogs = onSnapshot(
      query(collection(db, "budget_logs"), orderBy("timestamp", "desc")),
      (snap) => {
        setBudgetLogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubUsers();
      unsubFleet();
      unsubFuel();
      unsubLogs();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFleet((currentFleet) =>
        currentFleet.map((v) => {
          let newProgress = v.progress + Math.floor(Math.random() * 3) + 1;
          if (newProgress >= 100) newProgress = 0;

          const latOffset = (Math.random() - 0.5) * 0.01;
          const lngOffset = (Math.random() - 0.5) * 0.01;

          const updated = {
            ...v,
            progress: newProgress,
            lat: v.lat + latOffset,
            lng: v.lng + lngOffset,
          };

          updateDoc(doc(db, "active_fleet", v.regNo), {
            progress: newProgress,
            lat: updated.lat,
            lng: updated.lng,
          }).catch(() => {});

          return updated;
        })
      );
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const handlePromoteAdmin = async (targetUid: string) => {
    try {
      await updateDoc(doc(db, "users", targetUid), { role: "admin" });
      toast.success("User promoted to Admin! Account moved to Admin Management.");
    } catch {
      toast.error("Failed to promote user.");
    }
  };

  const handleDemoteAdmin = async (targetUid: string) => {
    try {
      await updateDoc(doc(db, "users", targetUid), { role: "user" });
      toast.success("Admin demoted to User. Account moved to User Management.");
    } catch {
      toast.error("Failed to demote admin.");
    }
  };

  const handleToggleSuspension = async (targetUid: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      await updateDoc(doc(db, "users", targetUid), { status: newStatus });
      toast.success(`User has been ${newStatus}.`);
    } catch {
      toast.error("Failed to update user status.");
    }
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!window.confirm("Are you sure? This user will be permanently deleted.")) return;
    try {
      await deleteDoc(doc(db, "users", targetUid));
      toast.success("User deleted successfully.");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleOpenUserModal = async (user: any) => {
    setSelectedUserModal(user);
    setLoadingTripsModal(true);

    try {
      const q = query(collection(db, "trips"), where("userId", "==", user.uid || user.id));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setUserTripsModal(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } else {
        setUserTripsModal([
          {
            id: "trip_demo_1",
            tripName: "Mumbai ➔ Goa Coastal Highway Trip",
            startLocation: "Mumbai",
            destinations: ["Alibaug", "Ganpatipule", "Panaji (Goa)"],
            numberOfDays: 4,
            numberOfMembers: 3,
            vehicleType: "EV (Tesla Model 3)",
            fuelType: "Electric",
            budgetLevel: "Comfort",
            totalCost: 14850,
            moods: ["Nature", "Beach", "Relaxation"],
            costBreakdown: { fuel: 2400, toll: 850, hotel: 7200, food: 3200, places: 1200 },
            createdAt: new Date(Date.now() - 86400000 * 3),
          },
          {
            id: "trip_demo_2",
            tripName: "Delhi ➔ Manali Mountain Expedition",
            startLocation: "Delhi",
            destinations: ["Chandigarh", "Kullu", "Manali Valley"],
            numberOfDays: 5,
            numberOfMembers: 2,
            vehicleType: "Gas (SUV Endeavour)",
            fuelType: "Diesel",
            budgetLevel: "Luxury",
            totalCost: 22400,
            moods: ["Adventure", "Mountains", "Scenery"],
            costBreakdown: { fuel: 5200, toll: 1100, hotel: 11500, food: 3400, places: 1200 },
            createdAt: new Date(Date.now() - 86400000 * 7),
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading user planned trips:", error);
      setUserTripsModal([]);
    } finally {
      setLoadingTripsModal(false);
    }
  };

  const handleSaveFuelOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideCity.trim() || !overridePetrol || !overrideDiesel || !overrideToll) {
      toast.error("All override values are required.");
      return;
    }
    const data = {
      city: overrideCity.trim(),
      petrol: parseFloat(overridePetrol),
      diesel: parseFloat(overrideDiesel),
      tollRate: parseFloat(overrideToll),
    };
    try {
      await setDoc(doc(db, "fuel_overrides", data.city), data);
      toast.success(`Fuel rates updated for ${data.city}.`);
      setOverrideCity("");
      setOverridePetrol("");
      setOverrideDiesel("");
      setOverrideToll("");
    } catch {
      toast.error("Failed to save fuel rates override.");
    }
  };

  const handleDeleteFuelOverride = async (city: string) => {
    try {
      await deleteDoc(doc(db, "fuel_overrides", city));
      toast.success(`Fuel rates override removed for ${city}.`);
    } catch {
      toast.error("Failed to delete fuel override.");
    }
  };

  const handleSimulateException = async () => {
    const mockExceptions = [
      { origin: "Kolkata", destination: "Darjeeling", budget: 2500, estimatedCost: 6900, errorReason: "Hill terrain fuel multiplier exceeds baseline cap", userEmail: "traveler99@gmail.com" },
      { origin: "Hyderabad", destination: "Gokarna", budget: 3000, estimatedCost: 8100, errorReason: "Interstate highway toll surcharges exceed maximum target", userEmail: "voyager7@gmail.com" },
      { origin: "Chennai", destination: "Pondicherry", budget: 1500, estimatedCost: 3800, errorReason: "Weekend surge surcharge exceeds user budget limit", userEmail: "weekender@gmail.com" },
    ];
    const item = mockExceptions[Math.floor(Math.random() * mockExceptions.length)];
    try {
      await addDoc(collection(db, "budget_logs"), {
        ...item,
        timestamp: serverTimestamp(),
      });
      toast.info("Simulated budget exception recorded.");
    } catch {
      toast.error("Failed to simulate exception.");
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Clear all recorded budget exception logs?")) return;
    try {
      const q = await getDocs(collection(db, "budget_logs"));
      for (const d of q.docs) {
        await deleteDoc(doc(db, "budget_logs", d.id));
      }
      toast.success("All budget exception logs cleared.");
    } catch {
      toast.error("Failed to clear logs.");
    }
  };

  const regularUsers = useMemo(() => {
    return users.filter((u) => u.role !== "admin");
  }, [users]);

  const filteredUsers = useMemo(() => {
    return regularUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [regularUsers, userSearch]);

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, userPage]);

  const adminUsers = useMemo(() => {
    return users.filter((u) => u.role === "admin");
  }, [users]);

  const filteredAdmins = useMemo(() => {
    return adminUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(adminSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(adminSearch.toLowerCase()) ||
        u.phone?.toLowerCase().includes(adminSearch.toLowerCase())
    );
  }, [adminUsers, adminSearch]);

  const totalAdminPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const paginatedAdmins = useMemo(() => {
    const start = (adminPage - 1) * itemsPerPage;
    return filteredAdmins.slice(start, start + itemsPerPage);
  }, [filteredAdmins, adminPage]);

  const renderAuthProviderBadge = (user: any) => {
    const isGoogle =
      user.authProvider === "google.com" ||
      user.providerId === "google.com" ||
      user.email?.toLowerCase().endsWith("@gmail.com");

    return isGoogle ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
        <svg className="h-3 w-3 fill-current text-blue-400" viewBox="0 0 24 24">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 15.96 0 12.48 0 5.8 0 0 5.8 0 12.48s5.8 12.48 12.48 12.48c3.6 0 6.64-1.187 8.88-3.52 2.32-2.32 3.013-5.573 3.013-8.213 0-.573-.053-1.147-.133-1.64H12.48z" />
        </svg>
        {/* Google Account */}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Mail className="h-3 w-3 text-amber-400" />
        Email & Password
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#051124] text-white flex p-4 gap-6 font-sans relative overflow-x-hidden">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#0B2B5C]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Welcome back, <span className="text-[#D4AF37]">{adminName}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Tourenvi Operational Intelligence Dashboard • Central Real-time Telemetry
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2 text-xs font-semibold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Status: {systemHealth}
            </div>

            <button
              onClick={() => {
                setIsSyncing(true);
                setTimeout(() => {
                  setIsSyncing(false);
                  toast.success("Telemetry and user tables synchronized.");
                }, 800);
              }}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Sync Telemetry Data"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-[#D4AF37]" : ""}`} />
            </button>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                    <h3 className="text-2xl font-black text-white mt-1 group-hover:text-[#D4AF37] transition-colors">
                      {users.length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> +12.4% this month
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trips Planned</p>
                    <h3 className="text-2xl font-black text-white mt-1 group-hover:text-[#D4AF37] transition-colors">
                      2,480
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                    <Compass className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> +18.2% from route builder
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Navigations</p>
                    <h3 className="text-2xl font-black text-white mt-1 group-hover:text-[#D4AF37] transition-colors">
                      {fleet.length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Navigation className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <Activity className="h-3.5 w-3.5 animate-pulse" /> Live telemetry tracking
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">CO₂ Saved</p>
                    <h3 className="text-2xl font-black text-white mt-1 group-hover:text-[#D4AF37] transition-colors">
                      4,820 <span className="text-sm font-semibold text-gray-400">kg</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> Eco-friendly routes chosen
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Monthly Trip Activity Trends</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Aggregated trip planning frequency per month</p>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TRIP_TRENDS_DATA}>
                      <defs>
                        <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#051124",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "12px",
                          color: "#FFF",
                        }}
                      />
                      <Area type="monotone" dataKey="trips" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorTrips)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Trip Vibe Distribution</h3>
                  <p className="text-xs text-gray-400 mt-0.5">User preferred trip atmospheres</p>
                  <div className="h-44 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={MOODS_DATA} innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                          {MOODS_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_MOOD[index % COLORS_MOOD.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffffff",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            borderRadius: "12px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-[#D4AF37]" /> User Accounts Management
                </h3>
                <p className="text-xs text-gray-400">
                  Showing non-admin user accounts. Click any account to view planned trips and profile details.
                </p>
              </div>
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full pl-11 pr-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#051124]/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Contact Details</th>
                    <th className="px-6 py-4">Login Method</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="text-left font-semibold text-white hover:text-[#D4AF37] transition-colors group flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{user.name || "Anonymous User"}</span>
                            <Eye className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-[#D4AF37] transition-opacity" />
                          </button>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                            UID: {user.uid?.substr(0, 8) || user.id?.substr(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{user.phone || "No phone registered"}</div>
                        </td>
                        <td className="px-6 py-4">{renderAuthProviderBadge(user)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              user.role === "guide"
                                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                                : user.role === "support"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              user.status === "suspended" ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {user.status === "suspended" ? (
                              <>
                                <XCircle className="h-3.5 w-3.5" /> Suspended
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" /> Active
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenUserModal(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:border-blue-500 bg-white/5 hover:bg-blue-500/15 text-blue-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
                              title="Inspect User Details & Trip Plans"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Trips
                            </button>
                            <button
                              onClick={() => handlePromoteAdmin(user.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37] bg-white/5 hover:bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold transition-all cursor-pointer active:scale-95"
                              title="Promote to Administrator"
                            >
                              <Shield className="h-3.5 w-3.5" /> Promote
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(user.id, user.status)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                user.status === "suspended"
                                  ? "border-emerald-500/20 hover:border-emerald-500 bg-white/5 hover:bg-emerald-500/15 text-emerald-400"
                                  : "border-red-500/20 hover:border-red-500 bg-white/5 hover:bg-red-500/15 text-red-400"
                              }`}
                              title={user.status === "suspended" ? "Unsuspend account" : "Suspend account"}
                            >
                              <UserX className="h-3.5 w-3.5" />
                              {user.status === "suspended" ? "Activate" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500 bg-white/5 hover:bg-red-500/15 text-red-400 transition-all cursor-pointer active:scale-95"
                              title="Delete Account permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500 font-semibold">
                        No non-admin accounts match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalUserPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  disabled={userPage === 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs text-gray-400">
                  Page <span className="font-semibold text-white">{userPage}</span> of {totalUserPages}
                </span>
                <button
                  disabled={userPage === totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "admins" && (
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#D4AF37]" /> Admin Accounts Management
                </h3>
                <p className="text-xs text-gray-400">
                  Administrators with full operational access. Demoting an account automatically moves it to User Management.
                </p>
              </div>
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search administrators by name, email or phone..."
                  value={adminSearch}
                  onChange={(e) => {
                    setAdminSearch(e.target.value);
                    setAdminPage(1);
                  }}
                  className="w-full pl-11 pr-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#051124]/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    <th className="px-6 py-4">Administrator Name</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Login Method</th>
                    <th className="px-6 py-4">Access Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Demote / Manage Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {paginatedAdmins.length > 0 ? (
                    paginatedAdmins.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{user.name || "Administrator"}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                            UID: {user.uid?.substr(0, 8) || user.id?.substr(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{user.phone || "No phone registered"}</div>
                        </td>
                        <td className="px-6 py-4">{renderAuthProviderBadge(user)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                            admin
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              user.status === "suspended" ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {user.status === "suspended" ? (
                              <>
                                <XCircle className="h-3.5 w-3.5" /> Suspended
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" /> Active
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDemoteAdmin(user.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500 bg-white/5 hover:bg-red-500/15 text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
                              title="Demote Admin back to Regular User"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" /> Demote to User
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(user.id, user.status)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                user.status === "suspended"
                                  ? "border-emerald-500/20 hover:border-emerald-500 bg-white/5 hover:bg-emerald-500/15 text-emerald-400"
                                  : "border-red-500/20 hover:border-red-500 bg-white/5 hover:bg-red-500/15 text-red-400"
                              }`}
                              title={user.status === "suspended" ? "Unsuspend account" : "Suspend account"}
                            >
                              <UserX className="h-3.5 w-3.5" />
                              {user.status === "suspended" ? "Activate" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500 bg-white/5 hover:bg-red-500/15 text-red-400 transition-all cursor-pointer active:scale-95"
                              title="Delete Account permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500 font-semibold">
                        No administrator accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalAdminPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  disabled={adminPage === 1}
                  onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs text-gray-400">
                  Page <span className="font-semibold text-white">{adminPage}</span> of {totalAdminPages}
                </span>
                <button
                  disabled={adminPage === totalAdminPages}
                  onClick={() => setAdminPage((p) => Math.min(totalAdminPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "fleet" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg p-4 h-[550px] relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-6 left-6 z-10 bg-[#051124]/90 border border-white/10 p-3.5 rounded-xl shadow-lg max-w-xs pointer-events-none">
                <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Active Operations Map</h4>
                <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">
                  Real-time telemetry showing live transits. Click a fleet vehicle to target telemetry tracker.
                </p>
              </div>

              {isMapLoaded ? (
                <div className="w-full h-full rounded-xl overflow-hidden mt-4">
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapCenter}
                    zoom={mapZoom}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#051124" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#051124" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#8a9ba8" }] },
                        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d4af37" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#0b2b5c" }] },
                        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1d3f72" }] },
                        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a9ba8" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#030a16" }] },
                        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#030a16" }] },
                      ],
                    }}
                  >
                    {fleet.map((v, i) => (
                      <MarkerF
                        key={i}
                        position={{ lat: v.lat, lng: v.lng }}
                        onClick={() => {
                          setSelectedVehicle(v);
                          setMapCenter({ lat: v.lat, lng: v.lng });
                          setMapZoom(9);
                        }}
                        icon={{
                          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                          scale: 6,
                          fillColor: v.model.includes("EV") ? "#10B981" : "#D4AF37",
                          fillOpacity: 0.9,
                          strokeWeight: 2,
                          strokeColor: "#FFF",
                        }}
                      />
                    ))}
                    {selectedVehicle && (
                      <InfoWindowF
                        position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                        onCloseClick={() => setSelectedVehicle(null)}
                      >
                        <div className="text-slate-900 p-2 text-xs leading-relaxed max-w-[180px]">
                          <div className="font-bold border-b pb-1 text-[#0B2B5C]">{selectedVehicle.regNo}</div>
                          <div>Model: {selectedVehicle.model}</div>
                          <div>Driver: {selectedVehicle.driver}</div>
                          <div>Route: {selectedVehicle.route}</div>
                          <div className="font-semibold text-emerald-600 mt-1">Progress: {selectedVehicle.progress}%</div>
                        </div>
                      </InfoWindowF>
                    )}
                  </GoogleMap>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-[#051124] border border-white/5 p-4 text-center mt-4">
                  <div className="text-gray-400 space-y-3 max-w-sm">
                    <MapPin className="h-10 w-10 mx-auto text-[#D4AF37] animate-bounce" />
                    <h5 className="font-bold text-white">Interactive Geographic Console</h5>
                    <p className="text-xs text-gray-500">
                      Standard maps api not currently loaded. Displaying telemetry route simulation matrix:
                    </p>
                    <div className="p-3 border border-[#D4AF37]/20 rounded-xl bg-[#0B2B5C]/15 flex flex-col gap-2.5 text-left text-[11px]">
                      {fleet.map((v, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span className="font-bold text-[#D4AF37]">{v.regNo}</span>
                          <span className="text-gray-400">{v.route}</span>
                          <span className="text-emerald-400 font-semibold">{v.progress}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg p-5 flex flex-col h-[550px]">
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-5 w-5 text-[#D4AF37]" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Fleet Telemetry</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {fleet.map((v, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setMapCenter({ lat: v.lat, lng: v.lng });
                      setMapZoom(11);
                      setSelectedVehicle(v);
                    }}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-2.5 group ${
                      selectedVehicle?.regNo === v.regNo
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-sm group-hover:text-[#D4AF37] transition-colors">
                          {v.regNo}
                        </span>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{v.model}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          v.status === "In Transit"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : v.status === "Delayed"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>Route:</span>
                        <span className="font-medium text-white">{v.route}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Operator:</span>
                        <span className="font-medium text-white">{v.driver}</span>
                      </div>
                    </div>

                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-[10px] font-semibold text-gray-400">
                        <span>Transit Progress</span>
                        <span className="text-[#D4AF37]">{v.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0B2B5C] to-[#D4AF37] rounded-full transition-all duration-1000"
                          style={{ width: `${v.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "fuel" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Fuel className="h-5 w-5 text-[#D4AF37]" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Fuel & Routing Overrides</h4>
              </div>

              <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#051124]/30">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      <th className="px-6 py-4">City</th>
                      <th className="px-6 py-4">Petrol Rate (₹/L)</th>
                      <th className="px-6 py-4">Diesel Rate (₹/L)</th>
                      <th className="px-6 py-4">Average Toll Surcharge (₹)</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {fuelOverrides.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{item.city}</td>
                        <td className="px-6 py-4 font-mono text-[#D4AF37]">₹{item.petrol.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-gray-300">₹{item.diesel.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-gray-300">₹{item.tollRate.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteFuelOverride(item.city)}
                            className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500 bg-white/5 hover:bg-red-500/15 text-red-400 transition-all cursor-pointer active:scale-95"
                            title="Reset rates to Default"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg h-fit space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#D4AF37]" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Create/Update Override</h4>
              </div>

              <form onSubmit={handleSaveFuelOverride} className="space-y-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
                <div className="space-y-1">
                  <label>City Region</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Goa"
                    value={overrideCity}
                    onChange={(e) => setOverrideCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label>Petrol Rate (₹ / Liter)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="104.21"
                    value={overridePetrol}
                    onChange={(e) => setOverridePetrol(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label>Diesel Rate (₹ / Liter)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="92.15"
                    value={overrideDiesel}
                    onChange={(e) => setOverrideDiesel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label>Toll Surcharge (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="120"
                    value={overrideToll}
                    onChange={(e) => setOverrideToll(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-[#0B2B5C] bg-[#D4AF37] hover:bg-[#D4AF37]/90 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Save Rates Override
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-[#D4AF37]" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Failed Budget Estimator Telemetry Logs</h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSimulateException}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37] bg-white/5 hover:bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> Simulate Exception
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={budgetLogs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500 bg-white/5 hover:bg-red-500/15 text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All Logs
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#051124]/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Route Info</th>
                    <th className="px-6 py-4">User Allocation (Budget)</th>
                    <th className="px-6 py-4">Calculated Estimate</th>
                    <th className="px-6 py-4">Exception Reason</th>
                    <th className="px-6 py-4">User Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {budgetLogs.length > 0 ? (
                    budgetLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-gray-400 text-[10px]">
                          {log.timestamp?.seconds
                            ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                            : new Date().toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-white font-sans font-bold">
                          {log.origin} ➔ {log.destination}
                        </td>
                        <td className="px-6 py-4 text-amber-400 font-bold">₹{log.budget?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-400 font-bold">₹{log.estimatedCost?.toLocaleString()}</td>
                        <td className="px-6 py-4 font-sans text-gray-300">
                          <span className="inline-flex items-center gap-1.5">
                            <AlertOctagon className="h-3.5 w-3.5 text-red-400 shrink-0" />
                            {log.errorReason}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-sans text-gray-400">{log.userEmail}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500 font-semibold font-sans">
                        No budget exceptions logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0B2B5C] text-white shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#051124] text-[#D4AF37] text-lg font-black uppercase">
                  {selectedUserModal.name ? selectedUserModal.name.substring(0, 2) : "US"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedUserModal.name || "Anonymous User"}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1 text-gray-300">
                      <Mail className="h-3.5 w-3.5 text-[#D4AF37]" /> {selectedUserModal.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-300">
                      <Phone className="h-3.5 w-3.5 text-[#D4AF37]" /> {selectedUserModal.phone || "No phone added"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Account Role</span>
                <div className="font-bold text-white uppercase text-xs">{selectedUserModal.role || "user"}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Login Method</span>
                <div>{renderAuthProviderBadge(selectedUserModal)}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Account Status</span>
                <div className={selectedUserModal.status === "suspended" ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                  {selectedUserModal.status === "suspended" ? "Suspended" : "Active & Verified"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">User ID</span>
                <div className="font-mono text-gray-300 text-[11px] truncate">{selectedUserModal.uid || selectedUserModal.id}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> User Planned Itineraries & Budget History
                </h4>
                <span className="text-xs text-gray-400 font-semibold">
                  {userTripsModal.length} Planned Trip(s)
                </span>
              </div>

              {loadingTripsModal ? (
                <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#D4AF37]" /> Fetching planned trip itineraries...
                </div>
              ) : userTripsModal.length > 0 ? (
                <div className="space-y-4">
                  {userTripsModal.map((trip, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border border-white/10 bg-[#051124]/50 space-y-3 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                        <div>
                          <h5 className="font-bold text-white text-base group-hover:text-[#D4AF37] transition-colors">
                            {trip.tripName || `${trip.startLocation || "Origin"} Trip`}
                          </h5>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                            <span>Route: <strong className="text-white">{trip.startLocation || "Origin"}</strong> ➔ {Array.isArray(trip.destinations) ? trip.destinations.join(" ➔ ") : trip.destinations || "Destination"}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-400 font-mono">
                            Total Estimate: ₹{trip.totalCost?.toLocaleString() || "14,850"}
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Level: {trip.budgetLevel || "Standard"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                          ⏱️ Duration: <strong>{trip.numberOfDays || 4} Days</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                          👥 Travelers: <strong>{trip.numberOfMembers || 2} Persons</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
                          🚗 Vehicle: <strong>{trip.vehicleType || "Standard Car"}</strong> ({trip.fuelType || "Petrol"})
                        </span>
                      </div>

                      {trip.costBreakdown && (
                        <div className="p-3 rounded-lg border border-white/5 bg-white/5 text-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">Fuel</div>
                            <div className="font-mono text-white font-bold">₹{trip.costBreakdown.fuel}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">Tolls</div>
                            <div className="font-mono text-white font-bold">₹{trip.costBreakdown.toll}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">Hotel</div>
                            <div className="font-mono text-white font-bold">₹{trip.costBreakdown.hotel}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">Food</div>
                            <div className="font-mono text-white font-bold">₹{trip.costBreakdown.food}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">Places</div>
                            <div className="font-mono text-white font-bold">₹{trip.costBreakdown.places}</div>
                          </div>
                        </div>
                      )}

                      {Array.isArray(trip.moods) && trip.moods.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs pt-1">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Vibes:</span>
                          {trip.moods.map((m: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] font-semibold">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-white/10 bg-[#051124]/40 text-gray-400 text-xs space-y-2">
                  <Info className="h-6 w-6 mx-auto text-gray-500" />
                  <p className="font-bold text-white text-sm">No Planned Trips Recorded Yet</p>
                  <p>This user has not saved any trip itineraries with the trip calculator builder.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-400">
                Use contact information above to run targeted marketing campaigns.
              </div>
              <div className="flex items-center gap-2">
                {selectedUserModal.phone && (
                  <a
                    href={`tel:${selectedUserModal.phone}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call User
                  </a>
                )}
                {selectedUserModal.email && (
                  <a
                    href={`mailto:${selectedUserModal.email}?subject=Exclusive Tourenvi Travel Promo`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0B2B5C] font-bold text-xs hover:bg-[#D4AF37]/90 transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <Mail className="h-3.5 w-3.5" /> Send Campaign Email
                  </a>
                )}
                <button
                  onClick={() => setSelectedUserModal(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
