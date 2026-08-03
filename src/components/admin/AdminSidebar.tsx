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
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "users"
  | "admins"
  | "fleet"
  | "fuel"
  | "logs"
  | "support"
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
      id: "revenue" as AdminTab,
      label: "Revenue & Monetization",
      icon: DollarSign,
    },
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
    <aside className="w-96 h-[calc(100vh-2rem)] sticky top-6 left-6 flex flex-col justify-between rounded-[1rem] border border-border bg-card text-foreground p-6 z-30 transition-all duration-300">
      {/* Header / Brand */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-eco-green to-accent shadow-card">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Tourenvi <span className="font-bold text-primary/90 ml-1">Admin</span>
            </h1>
            <p className="text-xs text-secondary mt-0.5 uppercase font-medium">Operations</p>
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
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all duration-200 relative group cursor-pointer ${
                  isActive
                    ? "text-primary bg-primary/10 border-l-4 border-primary font-semibold"
                    : "text-secondary hover:text-foreground hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`h-6 w-6 transition-transform duration-200 ${isActive ? "text-primary" : "text-gray-500 group-hover:text-foreground"}`}
                />
                <span>{item.label}</span>

                {/* Animated active/hover glow element */}
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-6 rounded-full bg-primary/80" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="space-y-4 pt-6 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-foreground">
            {adminProfile?.name ? (
              <span className="font-semibold text-sm uppercase">
                {adminProfile.name.substring(0, 2)}
              </span>
            ) : (
              <UserCheck className="h-5 w-5 text-secondary" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {adminProfile?.name || "System Admin"}
            </h4>
            <p className="text-xs text-secondary truncate">
              {adminProfile?.email || adminUser?.email || "admin@tourenvi.com"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-white text-foreground hover:bg-gray-50 text-sm font-medium tracking-wide transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
export { AdminSidebar };
