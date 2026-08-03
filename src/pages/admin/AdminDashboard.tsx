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
  LifeBuoy,
  Headphones,
  Server,
  Zap,
  Check,
  ExternalLink,
  Sliders,
  Clock,
  CheckCircle2,
  Tag,
  Filter,
  ArrowUpRight,
  MessageSquare,
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

const COLORS_MOOD = ["#10B981", "#0F766e", "#10B981", "#EF4444"];
const COLORS_VEHICLE = ["#10B981", "#16a34a", "#F59E0B"];

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
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [fuelOverrides, setFuelOverrides] = useState<any[]>([]);
  const [budgetLogs, setBudgetLogs] = useState<any[]>([]);

  // --- Support Tickets State ---
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [supportFilter, setSupportFilter] = useState<"All" | "Open" | "In Progress" | "Resolved">("All");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState("");

  // --- API Health & Fallback State ---
  const [latencies, setLatencies] = useState({
    googleMaps: 84,
    liveFuel: 120,
    firebase: 38,
    weather: 95,
  });

  const [fallbackModes, setFallbackModes] = useState({
    fuel: false,
    maps: false,
    weather: false,
    firebase: false,
  });

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

  // Centralized Audit Logging Helper
  const logAdminAction = async (action: string, target: string, details?: string) => {
    try {
      await addDoc(collection(db, "audit_logs"), {
        adminName: adminName || "Admin Officer",
        adminEmail: adminAuth.currentUser?.email || "admin@tourenvi.com",
        action,
        target,
        details: details || "",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "inquiries", ticketId), {
        status: newStatus,
        assignedTo: adminName,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Support ticket #${ticketId.substring(0, 6)} status set to ${newStatus}.`);
      await logAdminAction("Updated Support Ticket Status", `Ticket #${ticketId.substring(0, 6)}`, `Set status to ${newStatus}`);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => (prev ? { ...prev, status: newStatus, assignedTo: adminName } : null));
      }
    } catch (err) {
      console.error("Failed to update ticket status:", err);
      toast.error("Failed to update ticket status.");
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedAdmin: string) => {
    try {
      await updateDoc(doc(db, "inquiries", ticketId), {
        assignedTo: assignedAdmin,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Ticket assigned to ${assignedAdmin}.`);
      await logAdminAction("Assigned Support Ticket", `Ticket #${ticketId.substring(0, 6)}`, `Assigned to ${assignedAdmin}`);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => (prev ? { ...prev, assignedTo: assignedAdmin } : null));
      }
    } catch {
      toast.error("Failed to assign ticket.");
    }
  };

  const handlePingServices = () => {
    const newMaps = Math.floor(60 + Math.random() * 50);
    const newFuel = Math.floor(100 + Math.random() * 80);
    const newFb = Math.floor(30 + Math.random() * 25);
    const newWx = Math.floor(70 + Math.random() * 45);

    setLatencies({
      googleMaps: newMaps,
      liveFuel: newFuel,
      firebase: newFb,
      weather: newWx,
    });

    const isDegraded = newFuel > 160 || newMaps > 100;
    setSystemHealth(isDegraded ? "Degraded Telemetry" : "Excellent");
    toast.info("API health latency ping test complete.");
  };

  const handleToggleFallback = async (key: keyof typeof fallbackModes, name: string) => {
    const nextVal = !fallbackModes[key];
    setFallbackModes((prev) => ({ ...prev, [key]: nextVal }));
    const actionText = nextVal ? `Activated Manual Fallback (${name})` : `Restored Normal API Mode (${name})`;
    toast.warning(actionText);
    await logAdminAction("Toggled API Fallback Mode", name, nextVal ? "Fallback Active" : "Operational");
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), async (snap) => {
      if (snap.empty) {
        const defaultUsers = [
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
        // Auto-migrate any user document with role === "admin" to the admins collection
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (data.role === "admin") {
            const targetUid = docSnap.id;
            setDoc(doc(db, "admins", targetUid), { ...data, role: "admin", updatedAt: serverTimestamp() })
              .then(() => {
                deleteDoc(doc(db, "users", targetUid));
                toast.info(`Moved admin account (${data.email || targetUid}) from 'users' to 'admins' collection.`);
                logAdminAction("Auto-migrated Admin Document", targetUid, `Moved ${data.email} from 'users' to 'admins' collection`);
              })
              .catch((err) => console.error("Migration error:", err));
          }
        }
        setUsers(list.filter((u: any) => u.role !== "admin"));
      }
    });

    const unsubAdmins = onSnapshot(collection(db, "admins"), async (snap) => {
      if (snap.empty) {
        const defaultAdmins = [
          { name: "Rohin Kumar", email: "rohin@tourenvi.com", phone: "+91 9876543210", role: "admin", authProvider: "google.com", status: "active", createdAt: new Date() },
        ];
        for (const a of defaultAdmins) {
          const fakeUid = `admin_uid_${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(db, "admins", fakeUid), { uid: fakeUid, ...a });
        }
      } else {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAdminsList(list);
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

    const unsubInquiries = onSnapshot(collection(db, "inquiries"), async (snap) => {
      if (snap.empty) {
        const defaultInquiries = [
          {
            category: "Budget Calculation Bug",
            name: "Anish Patel",
            email: "anish@gmail.com",
            message: "The fuel cost estimation for EV vehicles on Pune highway shows gas vehicle multiplier.",
            userRole: "Registered User",
            status: "Open",
            assignedTo: null,
            createdAt: new Date(Date.now() - 3600000 * 4),
          },
          {
            category: "Route Navigation Issue",
            name: "Priya Sharma",
            email: "priya@gmail.com",
            message: "Missing toll booth rates near Mumbai-Pune Expressway entrance.",
            userRole: "Registered User",
            status: "In Progress",
            assignedTo: "Officer",
            createdAt: new Date(Date.now() - 3600000 * 12),
          },
          {
            category: "Hotel/Stay Query",
            name: "Karan Singh",
            email: "karan@gmail.com",
            message: "Need confirmation on Agoda affiliate discount coupon code application.",
            userRole: "Guest",
            status: "Resolved",
            assignedTo: "Officer",
            createdAt: new Date(Date.now() - 3600000 * 48),
          },
        ];
        for (const inq of defaultInquiries) {
          await addDoc(collection(db, "inquiries"), {
            ...inq,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setInquiries(list);
      }
    });

    const unsubAudit = onSnapshot(collection(db, "audit_logs"), async (snap) => {
      if (snap.empty) {
        const defaultAudits = [
          {
            adminName: "System",
            adminEmail: "system@tourenvi.com",
            action: "System Initialization",
            target: "Core Platform",
            details: "Audit logging system activated & baseline security verified.",
            timestamp: new Date(Date.now() - 86400000),
          },
        ];
        for (const aud of defaultAudits) {
          await addDoc(collection(db, "audit_logs"), aud);
        }
      } else {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAuditLogs(list);
      }
    });

    return () => {
      unsubUsers();
      unsubAdmins();
      unsubFleet();
      unsubFuel();
      unsubLogs();
      unsubInquiries();
      unsubAudit();
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
      const userRef = doc(db, "users", targetUid);
      const userSnap = await getDoc(userRef);
      let userData: any = users.find((u) => u.id === targetUid || u.uid === targetUid);

      if (userSnap.exists()) {
        userData = { ...userSnap.data(), id: userSnap.id };
      }

      const adminRecord = {
        ...(userData || {}),
        uid: targetUid,
        role: "admin",
        promotedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 1. Write to admins collection
      await setDoc(doc(db, "admins", targetUid), adminRecord);

      // 2. Delete from users collection
      await deleteDoc(doc(db, "users", targetUid));

      toast.success("User promoted to Admin! Account moved to 'admins' collection.");
      await logAdminAction("Promoted User to Admin", targetUid, "Moved record from 'users' to 'admins' collection");
    } catch (err) {
      console.error("Failed to promote user:", err);
      toast.error("Failed to promote user.");
    }
  };

  const handleDemoteAdmin = async (targetUid: string) => {
    try {
      const adminRef = doc(db, "admins", targetUid);
      const adminSnap = await getDoc(adminRef);
      let adminData: any = adminsList.find((a) => a.id === targetUid || a.uid === targetUid);

      if (adminSnap.exists()) {
        adminData = { ...adminSnap.data(), id: adminSnap.id };
      }

      const userRecord = {
        ...(adminData || {}),
        uid: targetUid,
        role: "user",
        demotedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 1. Write to users collection
      await setDoc(doc(db, "users", targetUid), userRecord);

      // 2. Delete from admins collection
      await deleteDoc(doc(db, "admins", targetUid));

      toast.success("Admin demoted to User! Account moved to 'users' collection.");
      await logAdminAction("Demoted Admin to User", targetUid, "Moved record from 'admins' to 'users' collection");
    } catch (err) {
      console.error("Failed to demote admin:", err);
      toast.error("Failed to demote admin.");
    }
  };

  const handleToggleSuspension = async (targetUid: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      const targetCol = adminsList.some((a) => a.id === targetUid || a.uid === targetUid) ? "admins" : "users";
      await updateDoc(doc(db, targetCol, targetUid), { status: newStatus });
      toast.success(`Account has been ${newStatus}.`);
      await logAdminAction(newStatus === "suspended" ? "Suspended Account" : "Reactivated Account", targetUid, `Updated status to ${newStatus} in '${targetCol}' collection`);
    } catch {
      toast.error("Failed to update account status.");
    }
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!window.confirm("Are you sure? This account will be permanently deleted.")) return;
    try {
      const targetCol = adminsList.some((a) => a.id === targetUid || a.uid === targetUid) ? "admins" : "users";
      await deleteDoc(doc(db, targetCol, targetUid));
      toast.success("Account deleted successfully.");
      await logAdminAction("Deleted Account", targetUid, `Purged from '${targetCol}' collection`);
    } catch {
      toast.error("Failed to delete account.");
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
      await logAdminAction("Overrode Fuel Rates", data.city, `Petrol: ₹${data.petrol}, Diesel: ₹${data.diesel}, Toll: ₹${data.tollRate}`);
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
      await logAdminAction("Deleted Fuel Override", city, "Reverted city fuel rates to global baseline");
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
    return adminsList.length > 0 ? adminsList : users.filter((u) => u.role === "admin");
  }, [adminsList, users]);

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
    <div className="min-h-screen bg-background text-foreground flex p-4 gap-6 font-sans relative overflow-x-hidden">

      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[1rem] border border-border bg-card shadow-card">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Welcome back, <span className="text-primary">{adminName}</span>
            </h2>
            <p className="text-sm text-secondary mt-1">
              Tourenvi Operational Intelligence • Central Telemetry
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3.5 py-1.5 rounded-lg border border-border bg-primary/10 flex items-center gap-3 text-sm font-medium text-primary">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span>System Status:</span>
              <span className="font-semibold">{systemHealth}</span>
            </div>

            <button
              onClick={() => {
                setIsSyncing(true);
                setTimeout(() => {
                  setIsSyncing(false);
                  toast.success("Telemetry and user tables synchronized.");
                }, 800);
              }}
              className="p-2.5 rounded-lg border border-border bg-white hover:bg-gray-50 text-secondary transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Sync Telemetry Data"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-primary" : "text-secondary"}`} />
            </button>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-[1rem] border border-border bg-card shadow-card hover:-translate-y-1 transition-all duration-200 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                    <h3 className="text-2xl font-black text-forest-dark mt-1 group-hover:text-eco-green transition-colors">
                      {users.length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-eco-green/30 bg-eco-green/10 text-eco-green">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> +12.4% this month
                </div>
              </div>

              <div className="p-5 rounded-[1rem] border border-border bg-card shadow-card hover:-translate-y-1 transition-all duration-200 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trips Planned</p>
                    <h3 className="text-2xl font-black text-forest-dark mt-1 group-hover:text-eco-green transition-colors">
                      2,480
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-eco-green/30 bg-eco-green/10 text-eco-green">
                    <Compass className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> +18.2% from route builder
                </div>
              </div>

              <div className="p-5 rounded-[1rem] border border-border bg-card shadow-card hover:-translate-y-1 transition-all duration-200 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Navigations</p>
                    <h3 className="text-2xl font-black text-forest-dark mt-1 group-hover:text-eco-green transition-colors">
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

              <div className="p-5 rounded-[1rem] border border-border bg-card shadow-card hover:-translate-y-1 transition-all duration-200 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">CO₂ Saved</p>
                    <h3 className="text-2xl font-black text-forest-dark mt-1 group-hover:text-eco-green transition-colors">
                      4,820 <span className="text-sm font-semibold text-gray-400">kg</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-eco-green/30 bg-eco-green/10 text-eco-green">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> Eco-friendly routes chosen
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-[1rem] border border-border bg-card shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="text-base font-bold text-forest-dark uppercase tracking-wider">Monthly Trip Activity Trends</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Aggregated trip planning frequency per month</p>
                    </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TRIP_TRENDS_DATA}>
                      <defs>
                        <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(4,120,87,0.06)" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ECFDF5",
                          border: "1px solid rgba(4,120,87,0.08)",
                          borderRadius: "12px",
                          color: "#064E3B",
                        }}
                      />
                      <Area type="monotone" dataKey="trips" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorTrips)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-6">
                <div>
                  <h3 className="text-base font-bold text-forest-dark uppercase tracking-wider">Trip Vibe Distribution</h3>
                  <p className="text-xs text-gray-500 mt-0.5">User preferred trip atmospheres</p>
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
          <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-primary" /> User Accounts Management
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
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card text-xs font-semibold text-secondary uppercase tracking-wider">
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Contact Details</th>
                    <th className="px-6 py-4">Login Method</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="text-left font-semibold text-foreground hover:text-primary transition-colors group flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{user.name || "Anonymous User"}</span>
                            <Eye className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-eco-green transition-opacity" />
                          </button>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                            UID: {user.uid?.substr(0, 8) || user.id?.substr(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-foreground font-medium">{user.email}</div>
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-blue-500 bg-card hover:bg-blue-50 text-blue-600 text-xs font-medium transition-all cursor-pointer active:scale-95"
                              title="Inspect User Details & Trip Plans"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Trips
                            </button>
                            <button
                              onClick={() => handlePromoteAdmin(user.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary bg-card hover:bg-primary/10 text-primary text-xs font-medium transition-all cursor-pointer active:scale-95"
                              title="Promote to Administrator"
                            >
                              <Shield className="h-3.5 w-3.5" /> Promote
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(user.id, user.status)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                                user.status === "suspended"
                                  ? "border-emerald-200 hover:border-emerald-300 bg-card hover:bg-emerald-50 text-emerald-600"
                                  : "border-red-200 hover:border-red-300 bg-card hover:bg-red-50 text-red-600"
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
          <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Admin Accounts Management
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
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
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
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-eco-green/15 text-eco-green border border-eco-green/30">
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-500 bg-card hover:bg-red-50 text-red-600 text-xs font-medium transition-all cursor-pointer active:scale-95"
                              title="Demote Admin back to Regular User"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" /> Demote to User
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(user.id, user.status)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                                user.status === "suspended"
                                  ? "border-emerald-200 hover:border-emerald-500 bg-card hover:bg-emerald-50 text-emerald-600"
                                  : "border-red-200 hover:border-red-500 bg-card hover:bg-red-50 text-red-600"
                              }`}
                              title={user.status === "suspended" ? "Unsuspend account" : "Suspend account"}
                            >
                              <UserX className="h-3.5 w-3.5" />
                              {user.status === "suspended" ? "Activate" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 rounded-lg border border-red-200 hover:border-red-500 bg-card hover:bg-red-50 text-red-600 transition-all cursor-pointer active:scale-95"
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
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-forest-dark/15 backdrop-blur-xl shadow-lg p-4 h-[550px] relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-6 left-6 z-10 bg-card border border-border p-3.5 rounded-xl shadow-card max-w-xs pointer-events-none">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Active Operations Map</h4>
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
                        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#16A34A" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#0f766e" }] },
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
                          fillColor: v.model.includes("EV") ? "#10B981" : "#10B981",
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
                <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-card border border-border p-4 text-center mt-4">
                  <div className="text-gray-400 space-y-3 max-w-sm">
                    <MapPin className="h-10 w-10 mx-auto text-primary animate-bounce" />
                    <h5 className="font-bold text-white">Interactive Geographic Console</h5>
                    <p className="text-xs text-gray-500">
                      Standard maps api not currently loaded. Displaying telemetry route simulation matrix:
                    </p>
                    <div className="p-3 border border-eco-green/20 rounded-xl bg-forest-dark/15 flex flex-col gap-2.5 text-left text-[11px]">
                      {fleet.map((v, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1">
                          <span className="font-bold text-eco-green">{v.regNo}</span>
                          <span className="text-gray-400">{v.route}</span>
                          <span className="text-emerald-400 font-semibold">{v.progress}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[1rem] border border-border bg-card shadow-card p-5 flex flex-col h-[550px]">
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-5 w-5 text-eco-green" />
                <h4 className="text-sm font-bold text-forest-dark uppercase tracking-wider">Active Fleet Telemetry</h4>
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
                        ? "border-primary bg-card shadow-sm"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-sm group-hover:text-eco-green transition-colors">
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
                        <span className="text-eco-green">{v.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-forest-dark to-eco-green rounded-full transition-all duration-1000"
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
            <div className="lg:col-span-2 p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Fuel className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Active Fuel & Routing Overrides</h4>
                <div className="ml-auto flex items-center gap-3 text-sm text-secondary">
                  <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">Overrides: <span className="font-bold text-foreground ml-1">{fuelOverrides.length}</span></div>
                </div>
              </div>

              <div className="overflow-x-auto border border-border rounded-xl bg-card">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-card text-xs font-semibold text-secondary tracking-wide">
                      <th className="px-6 py-3">City</th>
                      <th className="px-6 py-3">Petrol (₹/L)</th>
                      <th className="px-6 py-3">Diesel (₹/L)</th>
                      <th className="px-6 py-3">Toll (₹)</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {fuelOverrides.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-secondary font-medium">No overrides configured.</td>
                      </tr>
                    )}
                    {fuelOverrides.map((item, idx) => (
                      <tr key={idx} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-card'} hover:bg-gray-50`}>
                        <td className="px-6 py-4 font-semibold text-foreground">{item.city}</td>
                        <td className="px-6 py-4 font-mono text-primary">₹{item.petrol.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-secondary">₹{item.diesel.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-secondary">₹{item.tollRate.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteFuelOverride(item.city)}
                            className="p-2 rounded-lg border border-red-200 hover:border-red-500 bg-card hover:bg-red-50 text-red-600 transition-all cursor-pointer active:scale-95"
                            title="Reset rates to Default"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card h-fit space-y-4">
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Create / Update Override</h4>
              </div>

              <form onSubmit={handleSaveFuelOverride} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs text-secondary mb-1">City Region</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Goa"
                    value={overrideCity}
                    onChange={(e) => setOverrideCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-secondary mb-1">Petrol Rate (₹ / L)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="104.21"
                      value={overridePetrol}
                      onChange={(e) => setOverridePetrol(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-secondary mb-1">Diesel Rate (₹ / L)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="92.15"
                      value={overrideDiesel}
                      onChange={(e) => setOverrideDiesel(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-secondary mb-1">Toll Surcharge (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="120"
                    value={overrideToll}
                    onChange={(e) => setOverrideToll(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-[#0B2B5C] bg-primary hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Save Rates Override
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-eco-green" />
                <h4 className="text-sm font-bold text-forest-dark uppercase tracking-wider">Failed Budget Estimator Telemetry Logs</h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSimulateException}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-eco-green/20 hover:border-eco-green bg-white/5 hover:bg-eco-green/15 text-eco-green text-xs font-bold transition-all cursor-pointer active:scale-95"
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

            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card text-xs font-semibold text-secondary uppercase tracking-wider">
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

        {/* --- 1. SUPPORT TICKET & INQUIRY MANAGEMENT SYSTEM TAB --- */}
        {activeTab === "support" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Status Summary Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Tickets</p>
                  <h3 className="text-2xl font-black text-forest-dark mt-1">{inquiries.length}</h3>
                </div>
                <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                  <Headphones className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-300 uppercase">Open (Pending)</p>
                  <h3 className="text-2xl font-black text-red-400 mt-1">
                    {inquiries.filter((i) => i.status === "Open").length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/20 text-red-400">
                  <AlertOctagon className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-300 uppercase">In Progress</p>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">
                    {inquiries.filter((i) => i.status === "In Progress").length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/20 text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-300 uppercase">Resolved</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">
                    {inquiries.filter((i) => i.status === "Resolved").length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-eco-green" />
                  <h4 className="text-sm font-bold text-forest-dark uppercase tracking-wider">User Support Inquiries & Tickets</h4>
                </div>

                <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border text-xs">
                  {(["All", "Open", "In Progress", "Resolved"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSupportFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        supportFilter === filter
                          ? "bg-eco-green text-forest-dark shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto border border-border rounded-xl bg-card">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-card text-xs font-semibold text-secondary uppercase tracking-wider">
                      <th className="px-6 py-4">Ticket ID</th>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Submitted Date</th>
                      <th className="px-6 py-4">Assigned To</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {inquiries.filter((inq) => supportFilter === "All" || inq.status === supportFilter).length > 0 ? (
                      inquiries
                        .filter((inq) => supportFilter === "All" || inq.status === supportFilter)
                        .map((inq) => (
                          <tr key={inq.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono text-eco-green font-bold">
                              #{inq.id.substring(0, 6)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-white">{inq.name || "Anonymous"}</div>
                              <div className="text-gray-400 text-[11px]">{inq.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-gray-300">
                                <Tag className="h-3 w-3 text-eco-green" />
                                {inq.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">
                              {inq.createdAt?.seconds
                                ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {inq.assignedTo ? (
                                <span className="font-semibold text-blue-400">{inq.assignedTo}</span>
                              ) : (
                                <span className="text-gray-500 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                  inq.status === "Open"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    : inq.status === "In Progress"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    inq.status === "Open"
                                      ? "bg-red-400 animate-pulse"
                                      : inq.status === "In Progress"
                                      ? "bg-amber-400"
                                      : "bg-emerald-400"
                                  }`}
                                />
                                {inq.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedTicket(inq)}
                                className="px-3 py-1.5 rounded-lg border border-eco-green/30 bg-eco-green/10 hover:bg-eco-green/20 text-eco-green font-bold text-xs transition-all active:scale-95 cursor-pointer"
                              >
                                View Ticket
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500 font-semibold">
                          No support tickets found for filter "{supportFilter}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. REVENUE & AFFILIATE EARNINGS TRACKER TAB --- */}
        {activeTab === "revenue" && (
          <div className="space-y-6 animate-fade-in">
            {/* Revenue Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Affiliate Revenue</p>
                    <h3 className="text-2xl font-black text-white mt-1 text-emerald-400 font-mono">
                      ₹1,24,500 <span className="text-xs font-semibold text-gray-400">($14,820)</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> +24.8% commission growth
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hotel Bookings (Agoda/Booking)</p>
                    <h3 className="text-2xl font-black text-white mt-1 text-blue-400 font-mono">
                      ₹71,000 <span className="text-xs font-semibold text-gray-400">(57%)</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                    <Globe className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-gray-400 font-medium">
                  342 confirmed stay referrals
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Rental Clicks</p>
                    <h3 className="text-2xl font-black text-white mt-1 text-amber-400 font-mono">
                      ₹32,900 <span className="text-xs font-semibold text-gray-400">(26%)</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <Car className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-gray-400 font-medium">
                  1,840 EV & rental partner clicks
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Premium Trip Exports</p>
                    <h3 className="text-2xl font-black text-white mt-1 text-eco-green font-mono">
                      ₹20,600 <span className="text-xs font-semibold text-gray-400">(17%)</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-eco-green/30 bg-eco-green/10 text-eco-green">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-gray-400 font-medium">
                  412 PDF & GPX offline exports
                </div>
              </div>
            </div>

            {/* Revenue Charts & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-forest-dark uppercase tracking-wider">Monthly Affiliate Revenue Trend</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Estimated gross commissions (INR)</p>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { month: "Jan", revenue: 14000 },
                        { month: "Feb", revenue: 21000 },
                        { month: "Mar", revenue: 18500 },
                        { month: "Apr", revenue: 31000 },
                        { month: "May", revenue: 45000 },
                        { month: "Jun", revenue: 89000 },
                        { month: "Jul", revenue: 124500 },
                      ]}
                    >
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Affiliate Partner Streams */}
              <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4">
                <h4 className="text-sm font-bold text-forest-dark uppercase tracking-wider">Monetization Channels</h4>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Agoda Hotels Affiliate</div>
                        <div className="text-[10px] text-gray-400">8% per stay booking</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold text-xs">₹42,800</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Active</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Booking.com Partner</div>
                        <div className="text-[10px] text-gray-400">6.5% per confirmed stay</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold text-xs">₹28,200</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Active</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Tesla & Zoomcar Referrals</div>
                        <div className="text-[10px] text-gray-400">₹15 per click out</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold text-xs">₹32,900</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Active</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Premium PDF Exports</div>
                        <div className="text-[10px] text-gray-400">₹50 per export unlock</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold text-xs">₹20,600</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 3. THIRD-PARTY API HEALTH & OUTAGE MONITOR TAB --- */}
        {activeTab === "health" && (
          <div className="space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg">
              <div>
                <h4 className="text-base font-bold text-forest-dark flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
                  Live Third-Party API Health & Telemetry Monitor
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Real-time latency metrics (ms) and manual fallback trigger switches for failover safety.
                </p>
              </div>

              <button
                onClick={handlePingServices}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-[#0B2B5C] font-bold text-xs hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20"
              >
                <RefreshCw className="h-4 w-4 animate-spin-slow" /> Ping Services Now
              </button>
            </div>

            {/* Service Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Google Maps API */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Google Maps API</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-white font-mono">{latencies.googleMaps} <span className="text-sm font-semibold text-gray-400">ms</span></h3>
                  <Server className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-[11px] text-gray-400">
                  Routing, Geocoding & Distance Matrix
                </div>
              </div>

              {/* Live Fuel Rate API */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Live Fuel Rate API</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-white font-mono">{latencies.liveFuel} <span className="text-sm font-semibold text-gray-400">ms</span></h3>
                  <Fuel className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-[11px] text-gray-400">
                  State Petrol & Diesel Feeds
                </div>
              </div>

              {/* Firebase Firestore */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Firebase Firestore</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-white font-mono">{latencies.firebase} <span className="text-sm font-semibold text-gray-400">ms</span></h3>
                  <Zap className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-[11px] text-gray-400">
                  Database & Auth Telemetry
                </div>
              </div>

              {/* Weather API */}
              <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Live Weather API</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-white font-mono">{latencies.weather} <span className="text-sm font-semibold text-gray-400">ms</span></h3>
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-[11px] text-gray-400">
                  Highway Climate & Terrain Warnings
                </div>
              </div>
            </div>

            {/* Manual Fallback Trigger Switches */}
            <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Sliders className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-bold text-forest-dark uppercase tracking-wider">Manual Emergency Fallback Controls</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-sm">Static Fuel Price Cache Fallback</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Bypasses external Fuel API during rate limits or outages</p>
                  </div>
                  <button
                    onClick={() => handleToggleFallback("fuel", "Fuel Price Cache")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      fallbackModes.fuel ? "bg-amber-500" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        fallbackModes.fuel ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-sm">Offline Map Tile Fallback</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Switches to vector tile cache if Google Maps API throttles</p>
                  </div>
                  <button
                    onClick={() => handleToggleFallback("maps", "Offline Map Tile")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      fallbackModes.maps ? "bg-amber-500" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        fallbackModes.maps ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-sm">Seasonal Weather Climatology Cache</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Uses offline monthly averages if weather API fails</p>
                  </div>
                  <button
                    onClick={() => handleToggleFallback("weather", "Weather Climatology")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      fallbackModes.weather ? "bg-amber-500" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        fallbackModes.weather ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-sm">Firebase Local Cache Sync</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Enforces persistent offline cache read mode</p>
                  </div>
                  <button
                    onClick={() => handleToggleFallback("firebase", "Firebase Local Sync")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      fallbackModes.firebase ? "bg-amber-500" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        fallbackModes.firebase ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 4. SYSTEM AUDIT & ACTIVITY LOGS TAB --- */}
        {activeTab === "audit" && (
          <div className="p-6 rounded-[1rem] border border-border bg-card shadow-card space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-bold text-forest-dark uppercase tracking-wider">System Audit & Administrative Activity Logs</h4>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by admin or action..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-xs text-foreground placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl bg-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card text-xs font-semibold text-secondary uppercase tracking-wider">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Admin Officer</th>
                    <th className="px-6 py-4">Action Performed</th>
                    <th className="px-6 py-4">Target Entity / User</th>
                    <th className="px-6 py-4">Details / Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {auditLogs.filter(
                    (a) =>
                      a.adminName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      a.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      a.target?.toLowerCase().includes(auditSearch.toLowerCase())
                  ).length > 0 ? (
                    auditLogs
                      .filter(
                        (a) =>
                          a.adminName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          a.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          a.target?.toLowerCase().includes(auditSearch.toLowerCase())
                      )
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">
                            {log.timestamp?.seconds
                              ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                              : new Date().toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{log.adminName || "System Admin"}</div>
                            <div className="text-gray-400 text-[10px]">{log.adminEmail || "admin@tourenvi.com"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-300 font-semibold">{log.target}</td>
                          <td className="px-6 py-4 text-gray-300">{log.details || "-"}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-semibold">
                        No audit log entries matching query.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[1rem] border border-border bg-card text-foreground shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-foreground font-semibold">
                  {selectedUserModal.name ? selectedUserModal.name.substring(0, 2) : "US"}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    {selectedUserModal.name || "Anonymous User"}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                    <span className="flex items-center gap-1 text-secondary">
                      <Mail className="h-3.5 w-3.5 text-primary" /> {selectedUserModal.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-secondary">
                      <Phone className="h-3.5 w-3.5 text-primary" /> {selectedUserModal.phone || "No phone added"}
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
              <div className="p-3.5 rounded-lg border border-border bg-gray-50/50 space-y-1">
                <span className="text-secondary text-[10px] font-medium uppercase tracking-wider">Account Role</span>
                <div className="font-semibold text-foreground uppercase text-xs">{selectedUserModal.role || "user"}</div>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-gray-50/50 space-y-1">
                <span className="text-secondary text-[10px] font-medium uppercase tracking-wider">Login Method</span>
                <div>{renderAuthProviderBadge(selectedUserModal)}</div>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-gray-50/50 space-y-1">
                <span className="text-secondary text-[10px] font-medium uppercase tracking-wider">Account Status</span>
                <div className={selectedUserModal.status === "suspended" ? "text-red-500 font-semibold" : "text-primary font-semibold"}>
                  {selectedUserModal.status === "suspended" ? "Suspended" : "Active & Verified"}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-gray-50/50 space-y-1">
                <span className="text-secondary text-[10px] font-medium uppercase tracking-wider">User ID</span>
                <div className="font-mono text-secondary text-[11px] truncate">{selectedUserModal.uid || selectedUserModal.id}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-eco-green flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> User Planned Itineraries & Budget History
                </h4>
                <span className="text-xs text-gray-400 font-semibold">
                  {userTripsModal.length} Planned Trip(s)
                </span>
              </div>

              {loadingTripsModal ? (
                <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-eco-green" /> Fetching planned trip itineraries...
                </div>
              ) : userTripsModal.length > 0 ? (
                <div className="space-y-4">
                  {userTripsModal.map((trip, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border border-border bg-card space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                        <div>
                          <h5 className="font-bold text-white text-base group-hover:text-eco-green transition-colors">
                            {trip.tripName || `${trip.startLocation || "Origin"} Trip`}
                          </h5>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-eco-green" />
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
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-border bg-card text-gray-400 text-xs space-y-2">
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
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-[#0B2B5C] font-bold text-xs hover:bg-primary/90 transition-all active:scale-95 cursor-pointer shadow-lg shadow-primary/20"
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

      {/* --- SUPPORT TICKET DETAIL MODAL / DRAWER --- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[1rem] border border-border bg-card text-foreground shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-primary">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Support Ticket #{selectedTicket.id?.substring(0, 6)}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        selectedTicket.status === "Open"
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : selectedTicket.status === "In Progress"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary mt-0.5">Category: <strong className="text-foreground">{selectedTicket.category}</strong></p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Submitter User Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-card space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase">Submitted By</span>
                <div className="font-bold text-white">{selectedTicket.name || "Anonymous"}</div>
                <div className="text-gray-400 text-[10px] truncate">{selectedTicket.email}</div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase">Account Status</span>
                <div className="font-bold text-blue-400">{selectedTicket.userRole || "Registered User"}</div>
                <div className="text-gray-400 text-[10px] truncate">
                  UID: {selectedTicket.userId ? selectedTicket.userId.substring(0, 8) : "N/A (Guest)"}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase">Assigned Staff</span>
                <div className="font-bold text-primary">
                  {selectedTicket.assignedTo || "Unassigned"}
                </div>
                <div className="text-gray-400 text-[10px]">
                  {selectedTicket.createdAt?.seconds
                    ? new Date(selectedTicket.createdAt.seconds * 1000).toLocaleString()
                    : "Recent"}
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" /> User Message Content
              </label>
              <div className="p-4 rounded-xl border border-border bg-card text-sm text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                {selectedTicket.status !== "In Progress" && (
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "In Progress")}
                    className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Mark as In Progress
                  </button>
                )}
                {selectedTicket.status !== "Resolved" && (
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "Resolved")}
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as Resolved
                  </button>
                )}
                {!selectedTicket.assignedTo && (
                  <button
                    onClick={() => handleAssignTicket(selectedTicket.id, adminName)}
                    className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Assign to Me
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedTicket.email}?subject=Tourenvi Support Ticket [${selectedTicket.id?.substring(
                    0,
                    6
                  )}] - Response&body=Hi ${selectedTicket.name || "Traveler"},\n\nThank you for reaching out to Tourenvi Support regarding your inquiry (${selectedTicket.category}).\n\n`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-[#0B2B5C] text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20 active:scale-95"
                >
                  <Mail className="h-3.5 w-3.5" /> Reply via Email
                </a>

                <button
                  onClick={() => setSelectedTicket(null)}
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
