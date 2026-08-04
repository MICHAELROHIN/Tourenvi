import React, { useState, useEffect } from "react";
import { adminAuth } from "@/lib/firebaseAdminAuth";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Navigation,
  Fuel,
  FileWarning,
  LogOut,
  Compass,
  UserCheck,
  Headphones,
  DollarSign,
  Activity,
  History,
  AlertTriangle,
  Megaphone,
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "users"
  | "admins"
  | "fleet"
  | "fuel"
  | "logs"
  | "support"
  | "broadcast"
  | "revenue"
  | "health"
  | "audit";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const navigate = useNavigate();

  // Monitor isolated admin authentication state and subscribe to Firestore updates
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(adminAuth, (user) => {
      setAdminUser(user);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (!user) {
        setAdminProfile(null);
        return;
      }

      // Setup a real-time listener on the isolated admin's profile document (check admins collection first)
      unsubscribeDoc = onSnapshot(
        doc(db, "admins", user.uid),
        (snap) => {
          if (snap.exists()) {
            setAdminProfile(snap.data());
          } else {
            onSnapshot(
              doc(db, "users", user.uid),
              (uSnap) => {
                setAdminProfile(uSnap.exists() ? uSnap.data() : null);
              },
              () => setAdminProfile(null)
            );
          }
        },
        () => {
          setAdminProfile(null);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(adminAuth);
      navigate("/admin/login");
    } catch (error) {
      console.error("Admin logout failed:", error);
    }
  };

  const navItems = [
    {
      id: "overview" as AdminTab,
      label: "Overview Analytics",
      icon: LayoutDashboard,
    },
    {
      id: "users" as AdminTab,
      label: "User Management",
      icon: Users,
    },
    {
      id: "admins" as AdminTab,
      label: "Admin Management",
      icon: ShieldCheck,
    },
    {
      id: "fleet" as AdminTab,
      label: "Live Fleet Tracker",
      icon: Navigation,
    },
    {
      id: "fuel" as AdminTab,
      label: "Fuel & Price Overrides",
      icon: Fuel,
    },
    {
      id: "logs" as AdminTab,
      label: "Budget Exceptions",
      icon: FileWarning,
    },
    {
      id: "support" as AdminTab,
      label: "Support & Inquiries",
      icon: Headphones,
    },
    {
      id: "broadcast" as AdminTab,
      label: "Broadcast & Alerts",
      icon: Megaphone,
    },
    /*
    {
      id: "revenue" as AdminTab,
      label: "Revenue & Monetization",
      icon: DollarSign,
    },
    */
    {
      id: "health" as AdminTab,
      label: "System Health",
      icon: Activity,
    },
    {
      id: "audit" as AdminTab,
      label: "System Audit Log",
      icon: History,
    },
  ];

  return (
    <aside className="w-80 h-[calc(100vh-2rem)] sticky top-4 left-4 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0B2B5C]/80 backdrop-blur-md shadow-[0_8px_32px_0_rgba(5,17,36,0.5)] p-6 z-30 transition-all duration-300">
      {/* Header / Brand */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <Compass className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Tourenvi<span className="text-[#D4AF37] ml-1">Admin</span>
            </h1>
            <p className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-bold">
              Operations Center
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 relative group cursor-pointer ${
                  isActive
                    ? "text-[#D4AF37] bg-[#F8F9FA]/5 border-l-4 border-[#D4AF37] shadow-[inset_4px_0_15px_rgba(212,175,55,0.05)]"
                    : "text-gray-300 hover:text-white hover:bg-white/5 hover:translate-x-1"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" : "text-gray-400 group-hover:text-white"
                  }`}
                />
                <span>{item.label}</span>

                {/* Animated active/hover glow element */}
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#051124] text-[#D4AF37]">
            {adminProfile?.name ? (
              <span className="font-bold text-sm uppercase">
                {adminProfile.name.substring(0, 2)}
              </span>
            ) : (
              <UserCheck className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">
              {adminProfile?.name || "System Admin"}
            </h4>
            <p className="text-xs text-gray-400 truncate">
              {adminProfile?.email || adminUser?.email || "admin@tourenvi.com"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-semibold tracking-wide transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_2px_10px_rgba(239,68,68,0.05)]"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Dashboard</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
export { AdminSidebar };
