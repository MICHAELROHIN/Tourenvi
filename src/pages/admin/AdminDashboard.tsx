import React, { useState, useEffect, useMemo } from "react";
import { adminAuth, adminDb } from "@/lib/firebaseAdminAuth";
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
  History,
  Megaphone,
  Download,
  Send,
  Menu,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  Leaf,
} from "lucide-react";
import { exportToCSV } from "@/utils/csvExporter";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

const COLORS_MOOD = ["#10B981", "#F59E0B", "#06B6D4", "#8B5CF6"];
const COLORS_VEHICLE = ["#10B981", "#3B82F6", "#F59E0B"];

const TRIP_TRENDS_DATA = [
  { month: "Jan", trips: 420, lastYear: 280 },
  { month: "Feb", trips: 380, lastYear: 310 },
  { month: "Mar", trips: 510, lastYear: 350 },
  { month: "Apr", trips: 290, lastYear: 210 },
  { month: "May", trips: 620, lastYear: 430 },
  { month: "Jun", trips: 540, lastYear: 390 },
  { month: "Jul", trips: 720, lastYear: 480 },
];

const MOODS_DATA = [
  { name: "Nature", value: 45, color: "#10B981", percent: "39%" },
  { name: "Adventure", value: 30, color: "#F59E0B", percent: "26%" },
  { name: "Spiritual", value: 25, color: "#06B6D4", percent: "22%" },
  { name: "Culture", value: 15, color: "#8B5CF6", percent: "13%" },
];

const TOTAL_VIBE_COUNT = MOODS_DATA.reduce((acc, curr) => acc + curr.value, 0);

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
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isAdminsLoading, setIsAdminsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<"bar" | "area">("bar");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

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

  // --- Broadcast Announcements State ---
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newBroadcastTitle, setNewBroadcastTitle] = useState("");
  const [newBroadcastMsg, setNewBroadcastMsg] = useState("");
  const [newBroadcastCategory, setNewBroadcastCategory] = useState<"Route Alert" | "Weather Warning" | "System Advisory" | "Promotion">("Route Alert");
  const [newBroadcastTarget, setNewBroadcastTarget] = useState<"All Travelers" | "EV Drivers" | "Highway Drivers">("All Travelers");
  const [newBroadcastSeverity, setNewBroadcastSeverity] = useState<"Normal" | "High" | "Urgent">("Normal");

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
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "user" | "guide" | "support">("all");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "suspended">("all");
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
      await addDoc(collection(adminDb, "audit_logs"), {
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
      await updateDoc(doc(adminDb, "inquiries", ticketId), {
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
      await updateDoc(doc(adminDb, "inquiries", ticketId), {
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

  // Master Auth & Realtime Firestore Listeners Lifecycle
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(adminAuth, async (user) => {
      // Clean up any existing listeners on auth change
      unsubs.forEach((unsub) => {
        try { unsub(); } catch { }
      });
      unsubs = [];

      if (!user) {
        setAdminName("Officer");
        setIsUsersLoading(false);
        setIsAdminsLoading(false);
        return;
      }

      // 1. Fetch Admin Display Name safely
      try {
        const adminDocSnap = await getDoc(doc(adminDb, "admins", user.uid));
        if (adminDocSnap.exists()) {
          const data = adminDocSnap.data();
          setAdminName(data.name || data.displayName || data.email?.split("@")[0] || "Officer");
        } else {
          const userDocSnap = await getDoc(doc(adminDb, "users", user.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setAdminName(data.name || data.displayName || data.email?.split("@")[0] || "Officer");
          }
        }
      } catch (error) {
        console.warn("Could not fetch admin name document:", error);
      }

      // 2. Users Snapshot Listener
      const unsubUsers = onSnapshot(
        collection(adminDb, "users"),
        (snap) => {
          const list = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            return {
              id: docId,
              uid: data.uid || docId,
              name: data.name || data.displayName || data.fullName || data.username || (data.email ? data.email.split("@")[0] : "Traveler"),
              email: data.email || "No email registered",
              phone: data.phone || data.phoneNumber || data.mobile || "",
              role: data.role || "user",
              status: data.status || "active",
              authProvider: data.authProvider || data.providerId || (data.email ? "password" : "unknown"),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
              ...data,
            };
          });
          setUsers(list);
          setIsUsersLoading(false);
        },
        (err) => {
          console.warn("Users Firestore onSnapshot listener notice:", err.message);
          setIsUsersLoading(false);
        }
      );
      unsubs.push(unsubUsers);

      // 3. Admins Snapshot Listener
      const unsubAdmins = onSnapshot(
        collection(adminDb, "admins"),
        (snap) => {
          const list = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            return {
              id: docId,
              uid: data.uid || docId,
              name: data.name || data.displayName || data.fullName || data.username || (data.email ? data.email.split("@")[0] : "Admin Officer"),
              email: data.email || "No email registered",
              phone: data.phone || data.phoneNumber || data.mobile || "",
              role: "admin",
              status: data.status || "active",
              authProvider: data.authProvider || data.providerId || "password",
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
              ...data,
            };
          });
          setAdminsList(list);
          setIsAdminsLoading(false);
        },
        (err) => {
          console.warn("Admins Firestore onSnapshot listener notice:", err.message);
          setIsAdminsLoading(false);
        }
      );
      unsubs.push(unsubAdmins);

      // 4. Active Fleet Listener
      const unsubFleet = onSnapshot(
        collection(adminDb, "active_fleet"),
        async (snap) => {
          if (snap.empty) {
            const defaultFleet = [
              { regNo: "MH-12-GQ-4820", model: "Tesla Model 3 (EV)", driver: "Amit Sharma", route: "Mumbai ➔ Pune", status: "In Transit", progress: 75, lat: 18.975, lng: 72.8258 },
              { regNo: "DL-03-CA-9104", model: "Toyota Prius (Hybrid)", driver: "Vikram Singh", route: "Delhi ➔ Jaipur", status: "Delayed", progress: 40, lat: 28.6139, lng: 77.209 },
              { regNo: "KA-01-MJ-6723", model: "Hyundai Ioniq 5 (EV)", driver: "Nikhil Gowda", route: "Bangalore ➔ Mysore", status: "In Transit", progress: 90, lat: 12.9716, lng: 77.5946 },
              { regNo: "KL-07-BZ-5511", model: "Ford Endeavour (Gas)", driver: "Rahul Nair", route: "Cochin ➔ Munnar", status: "Resting", progress: 15, lat: 10.0159, lng: 76.3419 },
            ];
            for (const f of defaultFleet) {
              await setDoc(doc(adminDb, "active_fleet", f.regNo), f).catch(() => {});
            }
          } else {
            setFleet(snap.docs.map((docSnap) => ({ regNo: docSnap.id, ...docSnap.data() })));
          }
        },
        (err) => console.warn("Fleet listener notice:", err.message)
      );
      unsubs.push(unsubFleet);

      // 5. Fuel Overrides Listener
      const unsubFuel = onSnapshot(
        collection(adminDb, "fuel_overrides"),
        (snap) => {
          if (!snap.empty) {
            setFuelOverrides(snap.docs.map((docSnap) => docSnap.data()));
          }
        },
        (err) => console.warn("Fuel overrides listener notice:", err.message)
      );
      unsubs.push(unsubFuel);

      // 6. Budget Logs Listener
      const unsubLogs = onSnapshot(
        query(collection(adminDb, "budget_logs"), orderBy("timestamp", "desc")),
        (snap) => {
          setBudgetLogs(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        },
        (err) => console.warn("Budget logs listener notice:", err.message)
      );
      unsubs.push(unsubLogs);

      // 7. Inquiries Listener
      const unsubInquiries = onSnapshot(
        collection(adminDb, "inquiries"),
        async (snap) => {
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
              await addDoc(collection(adminDb, "inquiries"), {
                ...inq,
                updatedAt: serverTimestamp(),
              }).catch(() => {});
            }
          } else {
            const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            setInquiries(list);
          }
        },
        (err) => console.warn("Inquiries listener notice:", err.message)
      );
      unsubs.push(unsubInquiries);

      // 8. Audit Logs Listener
      const unsubAudit = onSnapshot(
        collection(adminDb, "audit_logs"),
        async (snap) => {
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
              await addDoc(collection(adminDb, "audit_logs"), aud).catch(() => {});
            }
          } else {
            const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            setAuditLogs(list);
          }
        },
        (err) => console.warn("Audit listener notice:", err.message)
      );
      unsubs.push(unsubAudit);

      // 9. Announcements Listener
      const unsubAnnouncements = onSnapshot(
        collection(adminDb, "announcements"),
        async (snap) => {
          if (snap.empty) {
            const defaultAnnouncements = [
              {
                title: "Heavy Monsoon Rainfall Advisory: Mumbai-Pune Expressway",
                message: "Waterlogging reported near Khalapur toll. Drive with fog lights and keep speed below 60 km/h.",
                category: "Route Alert",
                targetAudience: "All Travelers",
                severity: "High",
                isActive: true,
                publisher: "Operations Team",
                createdAt: new Date(),
              },
              {
                title: "Toll Tariff Adjustment Notice",
                message: "State Highway 14 FASTag surcharges updated across Maharashtra toll plazas.",
                category: "System Advisory",
                targetAudience: "Highway Drivers",
                severity: "Normal",
                isActive: true,
                publisher: "Operations Team",
                createdAt: new Date(Date.now() - 3600000 * 24),
              },
            ];
            for (const ann of defaultAnnouncements) {
              await addDoc(collection(adminDb, "announcements"), ann).catch(() => {});
            }
          } else {
            const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            setAnnouncements(list);
          }
        },
        (err) => console.warn("Announcements listener notice:", err.message)
      );
      unsubs.push(unsubAnnouncements);
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach((unsub) => {
        try { unsub(); } catch { }
      });
    };
  }, []);

  // Fleet live simulated telemetry progression
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

          updateDoc(doc(adminDb, "active_fleet", v.regNo), {
            progress: newProgress,
            lat: updated.lat,
            lng: updated.lng,
          }).catch(() => { });

          return updated;
        })
      );
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const handleForceSyncData = async () => {
    setIsSyncing(true);
    try {
      const [userSnap, adminSnap] = await Promise.all([
        getDocs(collection(adminDb, "users")),
        getDocs(collection(adminDb, "admins")),
      ]);

      const uList = userSnap.docs.map((d) => ({
        id: d.id,
        uid: d.data().uid || d.id,
        name: d.data().name || d.data().displayName || d.data().fullName || (d.data().email ? d.data().email.split("@")[0] : "Traveler"),
        email: d.data().email || "No email",
        phone: d.data().phone || d.data().phoneNumber || "",
        role: d.data().role || "user",
        status: d.data().status || "active",
        authProvider: d.data().authProvider || d.data().providerId || "password",
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(),
        ...d.data(),
      }));

      const aList = adminSnap.docs.map((d) => ({
        id: d.id,
        uid: d.data().uid || d.id,
        name: d.data().name || d.data().displayName || (d.data().email ? d.data().email.split("@")[0] : "Admin Officer"),
        email: d.data().email || "No email",
        phone: d.data().phone || d.data().phoneNumber || "",
        role: "admin",
        status: d.data().status || "active",
        authProvider: d.data().authProvider || "password",
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(),
        ...d.data(),
      }));

      setUsers(uList);
      setAdminsList(aList);
      toast.success(`Database sync complete: ${uList.length} users, ${aList.length} admins.`);
    } catch (err: any) {
      console.error("Force sync error:", err);
      toast.error("Failed to sync database: " + (err.message || "Unknown error"));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastTitle.trim() || !newBroadcastMsg.trim()) {
      toast.error("Please provide both an announcement title and message.");
      return;
    }

    try {
      await addDoc(collection(adminDb, "announcements"), {
        title: newBroadcastTitle.trim(),
        message: newBroadcastMsg.trim(),
        category: newBroadcastCategory,
        targetAudience: newBroadcastTarget,
        severity: newBroadcastSeverity,
        isActive: true,
        publisher: adminName || "Admin",
        createdAt: serverTimestamp(),
      });

      toast.success("Broadcast Announcement published to user dashboards!");
      await logAdminAction("Published Announcement", newBroadcastTitle.trim(), `Broadcasted to ${newBroadcastTarget}`);
      setNewBroadcastTitle("");
      setNewBroadcastMsg("");
    } catch {
      toast.error("Failed to publish announcement.");
    }
  };

  const handleToggleBroadcastStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(adminDb, "announcements", id), { isActive: !currentStatus });
      toast.success(`Announcement ${!currentStatus ? "activated" : "deactivated"}.`);
    } catch {
      toast.error("Failed to update announcement status.");
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm("Delete this broadcast announcement?")) return;
    try {
      await deleteDoc(doc(adminDb, "announcements", id));
      toast.success("Announcement deleted.");
    } catch {
      toast.error("Failed to delete announcement.");
    }
  };

  const handlePromoteAdmin = async (targetUid: string) => {
    try {
      const userRef = doc(adminDb, "users", targetUid);
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
      await setDoc(doc(adminDb, "admins", targetUid), adminRecord);

      // 2. Delete from users collection
      await deleteDoc(doc(adminDb, "users", targetUid));

      toast.success("User promoted to Admin! Account moved to 'admins' collection.");
      await logAdminAction("Promoted User to Admin", targetUid, "Moved record from 'users' to 'admins' collection");
    } catch (err) {
      console.error("Failed to promote user:", err);
      toast.error("Failed to promote user.");
    }
  };

  const handleDemoteAdmin = async (targetUid: string) => {
    try {
      const adminRef = doc(adminDb, "admins", targetUid);
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
      await setDoc(doc(adminDb, "users", targetUid), userRecord);

      // 2. Delete from admins collection
      await deleteDoc(doc(adminDb, "admins", targetUid));

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
      await updateDoc(doc(adminDb, targetCol, targetUid), { status: newStatus });
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
      await deleteDoc(doc(adminDb, targetCol, targetUid));
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
      const targetUid = user.uid || user.id;
      const q = query(collection(adminDb, "trips"), where("userId", "==", targetUid));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setUserTripsModal(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      } else {
        setUserTripsModal([]);
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
      await setDoc(doc(adminDb, "fuel_overrides", data.city), data);
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
      await deleteDoc(doc(adminDb, "fuel_overrides", city));
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
      await addDoc(collection(adminDb, "budget_logs"), {
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
      const q = await getDocs(collection(adminDb, "budget_logs"));
      for (const d of q.docs) {
        await deleteDoc(doc(adminDb, "budget_logs", d.id));
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
    const q = userSearch.trim().toLowerCase();
    return regularUsers.filter((u) => {
      if (userRoleFilter !== "all" && (u.role || "user").toLowerCase() !== userRoleFilter) {
        return false;
      }
      if (userStatusFilter !== "all" && (u.status || "active").toLowerCase() !== userStatusFilter) {
        return false;
      }
      if (!q) return true;
      const nameStr = (u.name || "").toLowerCase();
      const emailStr = (u.email || "").toLowerCase();
      const phoneStr = (u.phone || "").toLowerCase();
      const roleStr = (u.role || "").toLowerCase();
      const idStr = (u.uid || u.id || "").toLowerCase();
      return (
        nameStr.includes(q) ||
        emailStr.includes(q) ||
        phoneStr.includes(q) ||
        roleStr.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [regularUsers, userSearch, userRoleFilter, userStatusFilter]);

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, userPage]);

  const allAdminAccounts = useMemo(() => {
    const directAdmins = adminsList;
    const userAdmins = users.filter((u) => u.role === "admin");
    const combined = [...directAdmins];
    for (const ua of userAdmins) {
      if (!combined.some((a) => a.id === ua.id || a.uid === ua.uid)) {
        combined.push(ua);
      }
    }
    return combined;
  }, [adminsList, users]);

  const filteredAdmins = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return allAdminAccounts.filter((u) => {
      if (!q) return true;
      const nameStr = (u.name || "").toLowerCase();
      const emailStr = (u.email || "").toLowerCase();
      const phoneStr = (u.phone || "").toLowerCase();
      const idStr = (u.uid || u.id || "").toLowerCase();
      return (
        nameStr.includes(q) ||
        emailStr.includes(q) ||
        phoneStr.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [allAdminAccounts, adminSearch]);

  const totalAdminPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const paginatedAdmins = useMemo(() => {
    const start = (adminPage - 1) * itemsPerPage;
    return filteredAdmins.slice(start, start + itemsPerPage);
  }, [filteredAdmins, adminPage]);

  const renderAuthProviderBadge = (user: any) => {
    const isGoogle =
      user.authProvider === "google.com" ||
      user.providerId === "google.com" ||
      user.providerData?.[0]?.providerId === "google.com";

    return isGoogle ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
        <svg className="h-3 w-3 fill-current text-blue-500" viewBox="0 0 24 24">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 15.96 0 12.48 0 5.8 0 0 5.8 0 12.48s5.8 12.48 12.48 12.48c3.6 0 6.64-1.187 8.88-3.52 2.32-2.32 3.013-5.573 3.013-8.213 0-.573-.053-1.147-.133-1.64H12.48z" />
        </svg>
        Google Account
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        <Mail className="h-3 w-3 text-amber-500" />
        Email & Password
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col lg:flex-row p-3 sm:p-5 lg:p-6 gap-4 lg:gap-6 font-['Poppins',sans-serif] relative overflow-x-hidden">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#2ecc71]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-96 h-96 bg-[#2ecc71]/5 rounded-full blur-3xl pointer-events-none" />

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={isMobileMenuOpen}
        setMobileOpen={setIsMobileMenuOpen}
      />

      {/* Spacer to prevent layout shift with fixed sidebar */}
      <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0" />

      <main className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 z-10 w-full min-w-0">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#1e3b34] transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e3b34] flex items-center gap-2">
                Welcome back, <span className="text-[#2ecc71]">{adminName}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tourenvi Operational Intelligence Dashboard • Central Real-time Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* <div className="px-3.5 py-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Status: {systemHealth}
            </div> */}

            <button
              onClick={handleForceSyncData}
              disabled={isSyncing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#1e3b34] transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
              title="Force Sync Telemetry & Database Records"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-[#2ecc71]" : ""}`} />
            </button>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* 4 Stat Cards with Image 3 Soft Pastel Aesthetic & White Icon Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Total Users - Soft Purple / Lavender */}
              <div className="p-5 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-[#f8f5ff] via-[#fbf9ff] to-[#f3ebff] shadow-[0_4px_20px_-4px_rgba(168,85,247,0.12)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                    <h3 className="text-2xl sm:text-3xl font-semibold font-black text-slate-900 mt-1 group-hover:text-purple-700 transition-colors">
                      {users.length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-white text-purple-600 border border-purple-100/80 shadow-xs group-hover:scale-105 transition-transform">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> +12.4% this month
                </div>
              </div>

              {/* Trips Planned - Soft Blue */}
              <div className="p-5 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-[#f0f7ff] via-[#f8faff] to-[#e4f1ff] shadow-[0_4px_20px_-4px_rgba(59,130,246,0.12)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Trips Planned</p>
                    <h3 className="text-2xl sm:text-3xl font-semibold font-black text-slate-900 mt-1 group-hover:text-blue-700 transition-colors">
                      2,480
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-white text-blue-600 border border-blue-100/80 shadow-xs group-hover:scale-105 transition-transform">
                    <Compass className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> +18.2% from route builder
                </div>
              </div>

              {/* Active Navigations - Soft Mint / Emerald */}
              <div className="p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-[#f0fdf4] via-[#f9fefb] to-[#def7ec] shadow-[0_4px_20px_-4px_rgba(16,185,129,0.12)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Navigations</p>
                    <h3 className="text-2xl sm:text-3xl font-semibold font-black text-slate-900 mt-1 group-hover:text-emerald-700 transition-colors">
                      {fleet.length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-white text-emerald-600 border border-emerald-100/80 shadow-xs group-hover:scale-105 transition-transform">
                    <Navigation className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <Activity className="h-3.5 w-3.5 animate-pulse" /> Live telemetry tracking
                </div>
              </div>

              {/* CO2 Saved - Soft Warm Amber / Cream */}
              <div className="p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-[#fffbeb] via-[#fffdf5] to-[#fef3c7] shadow-[0_4px_20px_-4px_rgba(245,158,11,0.12)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">CO₂ Saved</p>
                    <h3 className="text-2xl sm:text-3xl font-semibold font-black text-slate-900 mt-1 group-hover:text-amber-700 transition-colors">
                      4,820 <span className="text-sm font-semibold text-slate-400">kg</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-white text-amber-600 border border-amber-100/80 shadow-xs group-hover:scale-105 transition-transform">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> Eco-friendly routes chosen
                </div>
              </div>
            </div>

            {/* Graphs Grid: Left = Image 2 Style Comparison Bar/Wave Chart, Right = Image 3 Financial Breakdown Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Activity Trends - Styled like Image 2 "Overview Income" */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 className="h-4.5 w-4.5 text-purple-600" /> Monthly Trip Activity Trends
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Comparative monthly trip telemetry & frequency</p>
                  </div>

                  {/* Chart controls matching Image 2 */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-sm bg-purple-600"></span> This year
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span> Last year
                      </span>
                    </div>

                    <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setChartViewMode("bar")}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          chartViewMode === "bar"
                            ? "bg-white text-purple-700 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Bars
                      </button>
                      <button
                        onClick={() => setChartViewMode("area")}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          chartViewMode === "area"
                            ? "bg-white text-purple-700 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Wave
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartViewMode === "bar" ? (
                      <BarChart data={TRIP_TRENDS_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl text-xs">
                                  <p className="font-bold text-slate-800 mb-1">{label} Telemetry</p>
                                  <p className="text-purple-600 font-semibold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                    This year: <span className="font-black">{payload[0]?.value}</span> trips
                                  </p>
                                  {payload[1] && (
                                    <p className="text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                      Last year: <span className="font-black">{payload[1]?.value}</span> trips
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="trips" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={14} name="This year" />
                        <Bar dataKey="lastYear" fill="#E2E8F0" radius={[6, 6, 0, 0]} barSize={14} name="Last year" />
                      </BarChart>
                    ) : (
                      <AreaChart data={TRIP_TRENDS_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTripsVibrant" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                            color: "#0F172A",
                            fontSize: "12px",
                          }}
                        />
                        <Area type="monotone" dataKey="trips" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorTripsVibrant)" name="Trips Planned" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trip Vibe Distribution - Exact Image 3 Layout (3D Center Badge + 2x2 Callout Cards) */}
              <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-600" /> Trip Vibe Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">User preferred trip atmospheres</p>
                </div>

                {/* 3D-effect Circular Donut with Center Leaf Badge */}
                <div className="relative h-56 flex items-center justify-center">
                  <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-white to-slate-50 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_10px_20px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] border border-slate-200/60 flex flex-col items-center justify-center text-center pointer-events-none z-10 p-3 transition-all duration-300">
                    <Leaf className="text-emerald-600 mb-0.5" size={20} />
                    {activePieIndex !== null ? (
                      <>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                          {MOODS_DATA[activePieIndex].name}
                        </span>
                        <span
                          className="text-lg font-black transition-all duration-300 mt-1 leading-none"
                          style={{ color: MOODS_DATA[activePieIndex].color }}
                        >
                          {MOODS_DATA[activePieIndex].value}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                          Total Vibes
                        </span>
                        <span className="text-lg font-black text-slate-800 mt-1 leading-none">
                          100%
                        </span>
                      </>
                    )}
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOODS_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={88}
                        paddingAngle={4}
                        cornerRadius={6}
                        dataKey="value"
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(null)}
                      >
                        {MOODS_DATA.map((entry, index) => {
                          const isActive = activePieIndex === index;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#FFFFFF"
                              strokeWidth={isActive ? 3.5 : 2}
                              style={{ outline: "none", cursor: "pointer", transition: "all 0.2s ease" }}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip content={() => null} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 2x2 Callout Cards Grid - Exact Image 3 Layout */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {MOODS_DATA.map((item, index) => {
                    const isActive = activePieIndex === index;
                    return (
                      <div
                        key={item.name}
                        onMouseEnter={() => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(null)}
                        className={`p-3 rounded-2xl border transition-all duration-300 text-left cursor-pointer ${
                          isActive
                            ? "bg-slate-50 border-slate-300 shadow-md translate-y-[-2px]"
                            : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white tracking-wider uppercase"
                            style={{ backgroundColor: item.color }}
                          >
                            {item.name}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400">{item.percent}</span>
                        </div>
                        <div className="text-sm font-black text-slate-800">
                          {item.value} <span className="text-xs font-semibold text-slate-400">trips</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-[#2ecc71]" /> User Accounts Management
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-1">
                    {regularUsers.length} total
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing registered traveler, guide & support accounts from Firebase. Click any account to view planned trips and profile details.
                </p>
              </div>
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, role..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2ecc71] focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={handleForceSyncData}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Re-fetch users collection directly from Firebase"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-[#2ecc71]" : ""}`} />
                  Sync
                </button>
                <button
                  onClick={() => exportToCSV("Tourenvi_Users_Report", regularUsers)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#2ecc71] text-white font-bold text-xs hover:bg-[#27ae60] transition-all shrink-0 cursor-pointer shadow-xs"
                  title="Export User Accounts CSV Report"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Quick Filter Badges for Role & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Role:</span>
                {(["all", "user", "guide", "support"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setUserRoleFilter(r);
                      setUserPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      userRoleFilter === r
                        ? "bg-[#1e3b34] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {r === "all" ? "All Roles" : r}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
                {(["all", "active", "suspended"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setUserStatusFilter(s);
                      setUserPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      userStatusFilter === s
                        ? "bg-[#2ecc71] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s === "all" ? "All Status" : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4 whitespace-nowrap">Full Name</th>
                    <th className="px-6 py-4 whitespace-nowrap">Contact Details</th>
                    <th className="px-6 py-4 whitespace-nowrap">Login Method</th>
                    <th className="px-6 py-4 whitespace-nowrap">Role</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#2ecc71]" />
                        <span className="font-semibold text-xs">Fetching users from Firebase database...</span>
                      </td>
                    </tr>
                  ) : paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="text-left font-bold text-slate-900 hover:text-[#2ecc71] transition-colors group inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{user.name || user.displayName || "Anonymous User"}</span>
                            <Eye className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-[#2ecc71] transition-opacity" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium text-xs">{user.email}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{user.phone || "No phone registered"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderAuthProviderBadge(user)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              user.role === "guide"
                                ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                : user.role === "support"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              user.status === "suspended" ? "text-red-600" : "text-emerald-600"
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
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => handleOpenUserModal(user)}
                              className="p-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="View User Details & Saved Trips"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePromoteAdmin(user.id)}
                              className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Promote to Administrator"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(user.id, user.status)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-2xs ${
                                user.status === "suspended"
                                  ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
                              }`}
                              title={user.status === "suspended" ? "Unsuspend / Activate Account" : "Suspend Account"}
                            >
                              {user.status === "suspended" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <UserX className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Delete Account permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500 space-y-2">
                        <UsersIcon className="h-8 w-8 mx-auto text-slate-300" />
                        <div className="font-semibold text-sm text-slate-700">No user accounts found</div>
                        <p className="text-xs text-slate-400">
                          {userSearch || userRoleFilter !== "all" || userStatusFilter !== "all"
                            ? "Try adjusting your search query or filter options."
                            : "Click 'Sync' above to fetch records from your Firebase 'users' collection."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalUserPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  disabled={userPage === 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-800">{userPage}</span> of {totalUserPages}
                </span>
                <button
                  disabled={userPage === totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "admins" && (
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#2ecc71]" /> Admin Accounts Management
                </h3>
                <p className="text-xs text-slate-500">
                  Administrators with full operational access. Demoting an account automatically moves it to User Management.
                </p>
              </div>
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search administrators by name, email or phone..."
                  value={adminSearch}
                  onChange={(e) => {
                    setAdminSearch(e.target.value);
                    setAdminPage(1);
                  }}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2ecc71] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4 whitespace-nowrap">Administrator Name</th>
                    <th className="px-6 py-4 whitespace-nowrap">Contact Info</th>
                    <th className="px-6 py-4 whitespace-nowrap">Login Method</th>
                    <th className="px-6 py-4 whitespace-nowrap">Access Role</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedAdmins.length > 0 ? (
                    paginatedAdmins.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{user.name || "Administrator"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium text-xs">{user.email}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{user.phone || "No phone registered"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderAuthProviderBadge(user)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            admin
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              user.status === "suspended" ? "text-red-600" : "text-emerald-600"
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
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => handleDemoteAdmin(user.id)}
                              className="p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Demote Admin back to Regular User"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(user.id, user.status)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-2xs ${
                                user.status === "suspended"
                                  ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                  : "border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
                              }`}
                              title={user.status === "suspended" ? "Unsuspend / Activate Account" : "Suspend Account"}
                            >
                              {user.status === "suspended" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <UserX className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Delete Account permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 font-semibold">
                        No administrator accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalAdminPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  disabled={adminPage === 1}
                  onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-800">{adminPage}</span> of {totalAdminPages}
                </span>
                <button
                  disabled={adminPage === totalAdminPages}
                  onClick={() => setAdminPage((p) => Math.min(totalAdminPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "fleet" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-xs p-4 h-[550px] relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-xs border border-slate-200/80 p-3.5 rounded-xl shadow-md max-w-xs pointer-events-none">
                <h4 className="text-xs font-bold text-[#2ecc71] uppercase tracking-widest">Active Operations Map</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
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
                        { elementType: "geometry", stylers: [{ color: "#F8FAFC" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
                        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#2ecc71" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#E2E8F0" }] },
                        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#CBD5E1" }] },
                        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#E0F2FE" }] },
                        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0284C7" }] },
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
                          fillColor: v.model?.includes("EV") ? "#10B981" : "#2ecc71",
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
                          <div className="font-bold border-b pb-1 text-[#1e3b34]">{selectedVehicle.regNo}</div>
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
                <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-4 text-center mt-4">
                  <div className="text-slate-500 space-y-3 max-w-sm">
                    <MapPin className="h-10 w-10 mx-auto text-[#2ecc71] animate-bounce" />
                    <h5 className="font-bold text-slate-800">Interactive Geographic Console</h5>
                    <p className="text-xs text-slate-500">
                      Standard maps api not currently loaded. Displaying telemetry route simulation matrix:
                    </p>
                    <div className="p-3 border border-slate-200 rounded-xl bg-white flex flex-col gap-2.5 text-left text-[11px] shadow-2xs">
                      {fleet.map((v, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-1">
                          <span className="font-bold text-[#1e3b34]">{v.regNo}</span>
                          <span className="text-slate-500">{v.route}</span>
                          <span className="text-emerald-600 font-semibold">{v.progress}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 flex flex-col h-[550px]">
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-5 w-5 text-[#2ecc71]" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Fleet Telemetry</h4>
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
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 group ${
                      selectedVehicle?.regNo === v.regNo
                        ? "border-[#2ecc71] bg-emerald-50/40 shadow-xs"
                        : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm group-hover:text-[#2ecc71] transition-colors">
                          {v.regNo}
                        </span>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{v.model}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          v.status === "In Transit"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : v.status === "Delayed"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Route:</span>
                        <span className="font-semibold text-slate-800">{v.route}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Operator:</span>
                        <span className="font-semibold text-slate-800">{v.driver}</span>
                      </div>
                    </div>

                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>Transit Progress</span>
                        <span className="text-[#2ecc71] font-bold">{v.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-[#2ecc71] rounded-full transition-all duration-700"
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
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Fuel className="h-5 w-5 text-[#2ecc71]" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Fuel & Routing Overrides</h4>
              </div>

              <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="px-6 py-4">City</th>
                      <th className="px-6 py-4">Petrol Rate (₹/L)</th>
                      <th className="px-6 py-4">Diesel Rate (₹/L)</th>
                      <th className="px-6 py-4">Average Toll Surcharge (₹)</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {fuelOverrides.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{item.city}</td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-600">₹{item.petrol.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">₹{item.diesel.toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">₹{item.tollRate.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteFuelOverride(item.city)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
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

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs h-fit space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#2ecc71]" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Create/Update Override</h4>
              </div>

              <form onSubmit={handleSaveFuelOverride} className="space-y-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                <div className="space-y-1">
                  <label>City Region</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Goa"
                    value={overrideCity}
                    onChange={(e) => setOverrideCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-[#2ecc71] focus:bg-white transition-all font-normal"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-[#2ecc71] focus:bg-white transition-all font-normal"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-[#2ecc71] focus:bg-white transition-all font-normal"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-[#2ecc71] focus:bg-white transition-all font-normal"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-[#2ecc71] hover:bg-[#27ae60] transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Save Rates Override
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Failed Budget Estimator Telemetry Logs</h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSimulateException}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Simulate Exception
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={budgetLogs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All Logs
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Route Info</th>
                    <th className="px-6 py-4">User Allocation (Budget)</th>
                    <th className="px-6 py-4">Calculated Estimate</th>
                    <th className="px-6 py-4">Exception Reason</th>
                    <th className="px-6 py-4">User Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {budgetLogs.length > 0 ? (
                    budgetLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 text-slate-400 text-[10px]">
                          {log.timestamp?.seconds
                            ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                            : new Date().toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-sans font-bold">
                          {log.origin} ➔ {log.destination}
                        </td>
                        <td className="px-6 py-4 text-amber-600 font-bold">₹{log.budget?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-600 font-bold">₹{log.estimatedCost?.toLocaleString()}</td>
                        <td className="px-6 py-4 font-sans text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <AlertOctagon className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            {log.errorReason}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-sans text-slate-400">{log.userEmail}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 font-semibold font-sans">
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
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Tickets</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{inquiries.length}</h3>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Headphones className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase">Open (Pending)</p>
                  <h3 className="text-2xl font-black text-red-600 mt-1">
                    {inquiries.filter((i) => i.status === "Open").length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-red-100 text-red-600 border border-red-200">
                  <AlertOctagon className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase">In Progress</p>
                  <h3 className="text-2xl font-black text-amber-600 mt-1">
                    {inquiries.filter((i) => i.status === "In Progress").length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-100 text-amber-600 border border-amber-200">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase">Resolved</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">
                    {inquiries.filter((i) => i.status === "Resolved").length}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-[#2ecc71]" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">User Support Inquiries & Tickets</h4>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {(["All", "Open", "In Progress", "Resolved"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSupportFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        supportFilter === filter
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inquiries Table */}
              <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="px-6 py-4 whitespace-nowrap">Traveler Details</th>
                      <th className="px-6 py-4 whitespace-nowrap">Inquiry Category</th>
                      <th className="px-6 py-4 whitespace-nowrap">Submitted Date</th>
                      <th className="px-6 py-4 whitespace-nowrap">Assigned Staff</th>
                      <th className="px-6 py-4 whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {inquiries.filter((inq) => supportFilter === "All" || inq.status === supportFilter).length > 0 ? (
                      inquiries
                        .filter((inq) => supportFilter === "All" || inq.status === supportFilter)
                        .map((inq) => (
                          <tr key={inq.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 text-xs">{inq.name || "Anonymous Traveler"}</div>
                              <div className="text-slate-400 text-[11px]">{inq.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                                <Tag className="h-3 w-3 text-[#2ecc71]" />
                                {inq.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {inq.createdAt?.seconds
                                ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                              {inq.assignedTo ? (
                                <span className="font-semibold text-blue-600">{inq.assignedTo}</span>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                  inq.status === "Open"
                                    ? "bg-red-50 text-red-600 border border-red-200"
                                    : inq.status === "In Progress"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    inq.status === "Open"
                                      ? "bg-red-500 animate-pulse"
                                      : inq.status === "In Progress"
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                />
                                {inq.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedTicket(inq)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Inquiry
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 font-semibold">
                          No support inquiries found for filter "{supportFilter}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. REVENUE & AFFILIATE EARNINGS TRACKER TAB (COMMENTED OUT - UNCOMMENT WHEN NEEDED) --- */}
        {/*
        activeTab === "revenue" && (
          <div className="space-y-6 animate-fade-in">
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
                    <h3 className="text-2xl font-black text-white mt-1 text-[#D4AF37] font-mono">
                      ₹20,600 <span className="text-xs font-semibold text-gray-400">(17%)</span>
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-gray-400 font-medium">
                  412 PDF & GPX offline exports
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Affiliate Revenue Trend</h4>
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

              <div className="p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl shadow-lg space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Monetization Channels</h4>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 flex items-center justify-between">
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

                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
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

                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 flex items-center justify-between">
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

                  <div className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/40 flex items-center justify-between">
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
        )
        */}

        {/* --- 3. THIRD-PARTY API HEALTH & OUTAGE MONITOR TAB --- */}
        {activeTab === "health" && (
          <div className="space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <div>
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600 animate-pulse" />
                  Live Third-Party API Health & Telemetry Monitor
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time latency metrics (ms) and operational status across all external integrations.
                </p>
              </div>

              <button
                onClick={handlePingServices}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2ecc71] text-white font-bold text-xs hover:bg-[#27ae60] active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-4 w-4 animate-spin-slow" /> Ping Services Now
              </button>
            </div>

            {/* Service Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Google Maps API */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Google Maps API</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-slate-900 font-mono">
                    {latencies.googleMaps} <span className="text-sm font-semibold text-slate-400">ms</span>
                  </h3>
                  <Server className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-[11px] text-slate-400">
                  Routing, Geocoding & Distance Matrix
                </div>
              </div>

              {/* Live Fuel Rate API */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Live Fuel Rate API</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-slate-900 font-mono">
                    {latencies.liveFuel} <span className="text-sm font-semibold text-slate-400">ms</span>
                  </h3>
                  <Fuel className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-[11px] text-slate-400">
                  State Petrol & Diesel Feeds
                </div>
              </div>

              {/* Firebase Firestore */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Firebase Firestore</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-slate-900 font-mono">
                    {latencies.firebase} <span className="text-sm font-semibold text-slate-400">ms</span>
                  </h3>
                  <Zap className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-[11px] text-slate-400">
                  Database & Auth Telemetry
                </div>
              </div>

              {/* Weather API */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Live Weather API</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black text-slate-900 font-mono">
                    {latencies.weather} <span className="text-sm font-semibold text-slate-400">ms</span>
                  </h3>
                  <Globe className="h-5 w-5 text-slate-400" />
                </div>
                <div className="text-[11px] text-slate-400">
                  Highway Climate & Terrain Warnings
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- BROADCAST ANNOUNCEMENT & PUSH NOTIFICATION MANAGER TAB --- */}
        {activeTab === "broadcast" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Broadcasts</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                      {announcements.filter((a) => a.isActive).length} Live
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Megaphone className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Active on user route banners</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sent Broadcasts</p>
                    <h3 className="text-2xl font-black text-[#1e3b34] mt-1 font-mono">
                      {announcements.length} Published
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Send className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Pushed across all traveler channels</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Audience Reach</p>
                    <h3 className="text-2xl font-black text-purple-600 mt-1 font-mono">
                      14,890 Travelers
                    </h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Active GPS highway subscribers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-[#2ecc71]" /> Publish New Broadcast
                </h4>

                <form onSubmit={handlePublishBroadcast} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Announcement Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Heavy Rainfall Advisory on Highway 48"
                      value={newBroadcastTitle}
                      onChange={(e) => setNewBroadcastTitle(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#2ecc71] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Category</label>
                      <select
                        value={newBroadcastCategory}
                        onChange={(e) => setNewBroadcastCategory(e.target.value as any)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#2ecc71] focus:bg-white"
                      >
                        <option value="Route Alert">Route Alert</option>
                        <option value="Weather Warning">Weather Warning</option>
                        <option value="System Advisory">System Advisory</option>
                        <option value="Promotion">Promotion</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Audience</label>
                      <select
                        value={newBroadcastTarget}
                        onChange={(e) => setNewBroadcastTarget(e.target.value as any)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#2ecc71] focus:bg-white"
                      >
                        <option value="All Travelers">All Travelers</option>
                        <option value="EV Drivers">EV Drivers</option>
                        <option value="Highway Drivers">Highway Drivers</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Severity Level</label>
                    <select
                      value={newBroadcastSeverity}
                      onChange={(e) => setNewBroadcastSeverity(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#2ecc71] focus:bg-white"
                    >
                      <option value="Normal">Normal Advisory</option>
                      <option value="High">High Priority Warning</option>
                      <option value="Urgent">Urgent Emergency Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Message Body</label>
                    <textarea
                      rows={3}
                      placeholder="Enter detailed broadcast instructions or safety advisories..."
                      value={newBroadcastMsg}
                      onChange={(e) => setNewBroadcastMsg(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#2ecc71] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Send className="h-4 w-4" /> Publish Broadcast Now
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Published Broadcast Announcements ({announcements.length})
                  </h4>
                  <button
                    onClick={() => exportToCSV("Tourenvi_Announcements_Report", announcements)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2ecc71] text-white font-bold text-xs hover:bg-[#27ae60] transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-3">Title & Message</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Audience</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {announcements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No broadcasts published yet.
                          </td>
                        </tr>
                      ) : (
                        announcements.map((ann) => (
                          <tr key={ann.id} className="hover:bg-slate-50/70 transition-all">
                            <td className="p-3">
                              <div className="font-bold text-slate-900 text-xs">{ann.title}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">{ann.message}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{ann.category}</td>
                            <td className="p-3 text-blue-600 font-medium">{ann.targetAudience}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ann.severity === "Urgent"
                                    ? "bg-red-50 text-red-600 border border-red-200"
                                    : ann.severity === "High"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {ann.severity}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleBroadcastStatus(ann.id, ann.isActive)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                  ann.isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                {ann.isActive ? "Live / Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteBroadcast(ann.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 4. SYSTEM AUDIT & ACTIVITY LOGS TAB --- */}
        {activeTab === "audit" && (
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#2ecc71]" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">System Audit & Administrative Activity Logs</h4>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by admin or action..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2ecc71] focus:bg-white"
                  />
                </div>
                <button
                  onClick={() => exportToCSV("Tourenvi_Audit_Logs_Report", auditLogs)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2ecc71] text-white font-bold text-xs hover:bg-[#27ae60] transition-all shrink-0 cursor-pointer shadow-xs"
                  title="Export Audit Logs CSV Report"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Admin Officer</th>
                    <th className="px-6 py-4">Action Performed</th>
                    <th className="px-6 py-4">Target Entity / User</th>
                    <th className="px-6 py-4">Details / Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
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
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                            {log.timestamp?.seconds
                              ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                              : new Date().toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{log.adminName || "System Admin"}</div>
                            <div className="text-slate-400 text-[10px]">{log.adminEmail || "admin@tourenvi.com"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700 font-semibold">{log.target}</td>
                          <td className="px-6 py-4 text-slate-600">{log.details || "-"}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 font-semibold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white text-slate-800 shadow-2xl p-4 sm:p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 text-lg font-black uppercase shadow-xs">
                  {selectedUserModal.name ? selectedUserModal.name.substring(0, 2) : "US"}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    {selectedUserModal.name || "Anonymous User"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-emerald-600" /> {selectedUserModal.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" /> {selectedUserModal.phone || "No phone added"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Account Role</span>
                <div className="font-bold text-slate-800 uppercase text-xs">{selectedUserModal.role || "user"}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Login Method</span>
                <div>{renderAuthProviderBadge(selectedUserModal)}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Account Status</span>
                <div className={selectedUserModal.status === "suspended" ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>
                  {selectedUserModal.status === "suspended" ? "Suspended" : "Active & Verified"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Member Since</span>
                <div className="font-semibold text-slate-700 text-xs">
                  {selectedUserModal.createdAt?.toLocaleDateString
                    ? selectedUserModal.createdAt.toLocaleDateString()
                    : selectedUserModal.createdAt?.seconds
                    ? new Date(selectedUserModal.createdAt.seconds * 1000).toLocaleDateString()
                    : "Registered Traveler"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> User Planned Itineraries & Budget History
                </h4>
                <span className="text-xs text-slate-500 font-semibold">
                  {userTripsModal.length} Planned Trip(s)
                </span>
              </div>

              {loadingTripsModal ? (
                <div className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" /> Fetching planned trip itineraries...
                </div>
              ) : userTripsModal.length > 0 ? (
                <div className="space-y-3">
                  {userTripsModal.map((trip, idx) => {
                    const startLoc = trip.startLocation || trip.routeDetails?.startLocation || trip.tripData?.startLocation || "Origin";
                    const destList = Array.isArray(trip.destinations) && trip.destinations.length
                      ? trip.destinations
                      : Array.isArray(trip.tripData?.destinations) && trip.tripData.destinations.length
                        ? trip.tripData.destinations
                        : trip.routeDetails?.destination
                          ? [trip.routeDetails.destination]
                          : [];
                    const destStr = destList.join(" ➔ ") || "Destination";
                    const title = trip.tripName || `${startLoc} ➔ ${destStr} Trip`;
                    const totalCostVal = trip.totalCost || trip.financials?.totalCost || trip.costBreakdown?.total || 0;
                    const daysVal = trip.numberOfDays || trip.itinerary?.length || 3;
                    const membersVal = trip.numberOfMembers || trip.tripData?.numberOfMembers || 1;
                    const vehicleVal = trip.vehicleType || trip.routeDetails?.vehicleType || trip.tripData?.vehicleType || "Car";
                    const fuelVal = trip.fuelType || trip.routeDetails?.fuelType || trip.tripData?.fuelType || "Petrol";
                    const budgetVal = trip.budgetLevel || trip.tripData?.genres?.[0] || "Standard";
                    const breakdown = trip.costBreakdown || (trip.financials ? {
                      fuel: trip.financials.fuelExpenditure || 0,
                      toll: trip.financials.tollPricing || 0,
                      hotel: trip.financials.totalLodging || 0,
                      food: trip.financials.foodCost || 0,
                      places: trip.financials.placesCost || 0,
                      misc: trip.financials.miscCost || 0,
                    } : null);
                    const moodsList = (Array.isArray(trip.moods) && trip.moods.length)
                      ? trip.moods
                      : (Array.isArray(trip.tripData?.moods) && trip.tripData.moods.length)
                        ? trip.tripData.moods
                        : [];

                    return (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3 relative overflow-hidden group hover:border-emerald-300 hover:bg-slate-50/80 transition-all shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/60 pb-3">
                          <div>
                            <h5 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition-colors">
                              {title}
                            </h5>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Route: <strong className="text-slate-700">{startLoc}</strong> ➔ {destStr}</span>
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <div className="text-sm font-bold text-emerald-600 font-mono">
                              Total Estimate: ₹{totalCostVal.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              Level: {budgetVal}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium">
                            ⏱️ Duration: <strong>{daysVal} Days</strong>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium">
                            👥 Travelers: <strong>{membersVal} Persons</strong>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium">
                            🚗 Vehicle: <strong>{vehicleVal}</strong> ({fuelVal})
                          </span>
                        </div>

                        {breakdown && (
                          <div className="p-3 rounded-lg border border-slate-200/70 bg-white text-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Fuel</div>
                              <div className="font-mono text-slate-800 font-bold">₹{breakdown.fuel?.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tolls</div>
                              <div className="font-mono text-slate-800 font-bold">₹{breakdown.toll?.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Hotel</div>
                              <div className="font-mono text-slate-800 font-bold">₹{breakdown.hotel?.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Food</div>
                              <div className="font-mono text-slate-800 font-bold">₹{breakdown.food?.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Places</div>
                              <div className="font-mono text-slate-800 font-bold">₹{breakdown.places?.toLocaleString()}</div>
                            </div>
                          </div>
                        )}

                        {moodsList.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs pt-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Vibes:</span>
                            {moodsList.map((m: string, mIdx: number) => (
                              <span key={mIdx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-500 text-xs space-y-2">
                  <Info className="h-6 w-6 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-700 text-sm">No Planned Trips Recorded Yet</p>
                  <p>This user has not saved any trip itineraries with the trip calculator builder.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                Use contact information above to run targeted marketing campaigns.
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedUserModal.phone && (
                  <a
                    href={`tel:${selectedUserModal.phone}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call User
                  </a>
                )}
                {selectedUserModal.email && (
                  <a
                    href={`mailto:${selectedUserModal.email}?subject=Exclusive Tourenvi Travel Promo`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Mail className="h-3.5 w-3.5" /> Send Campaign Email
                  </a>
                )}
                <button
                  onClick={() => setSelectedUserModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUPPORT INQUIRY DETAIL MODAL / DRAWER --- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-800 shadow-2xl p-4 sm:p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 shadow-xs">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      Support Inquiry
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedTicket.status === "Open"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : selectedTicket.status === "In Progress"
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Category: <strong className="text-slate-700">{selectedTicket.category}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Submitter User Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Submitted By</span>
                <div className="font-bold text-slate-800">{selectedTicket.name || "Anonymous Traveler"}</div>
                <div className="text-slate-500 text-[10px] truncate">{selectedTicket.email}</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Account Status</span>
                <div className="font-bold text-blue-600">{selectedTicket.userRole || "Registered User"}</div>
                <div className="text-slate-500 text-[10px]">
                  Verified Account
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Assigned Staff</span>
                <div className="font-bold text-slate-800">
                  {selectedTicket.assignedTo || "Unassigned"}
                </div>
                <div className="text-slate-500 text-[10px]">
                  {selectedTicket.createdAt?.seconds
                    ? new Date(selectedTicket.createdAt.seconds * 1000).toLocaleString()
                    : "Recent"}
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-500" /> User Message Content
              </label>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {selectedTicket.status !== "In Progress" && (
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "In Progress")}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Mark as In Progress
                  </button>
                )}
                {selectedTicket.status !== "Resolved" && (
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "Resolved")}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Mark as Resolved
                  </button>
                )}
                {!selectedTicket.assignedTo && (
                  <button
                    onClick={() => handleAssignTicket(selectedTicket.id, adminName)}
                    className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Assign to Me
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={`mailto:${selectedTicket.email}?subject=Tourenvi Support Inquiry - Response&body=Hi ${selectedTicket.name || "Traveler"},\n\nThank you for reaching out to Tourenvi Support regarding your inquiry (${selectedTicket.category}).\n\n`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Mail className="h-3.5 w-3.5" /> Reply via Email
                </a>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
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

