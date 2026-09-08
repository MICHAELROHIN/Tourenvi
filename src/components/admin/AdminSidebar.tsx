import React, { useState, useEffect } from "react";
import { adminAuth, adminDb } from "@/lib/firebaseAdminAuth";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Crown,
  Navigation,
  Fuel,
  FileWarning,
  LogOut,
  Leaf,
  UserCheck,
  Headphones,
  Activity,
  History,
  Megaphone,
  X,
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "users"
  | "admins"
  | "super_admins"
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
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const navigate = useNavigate();

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

      unsubscribeDoc = onSnapshot(
        doc(adminDb, "admins", user.uid),
        (snap) => {
          if (snap.exists()) {
            setAdminProfile(snap.data());
          } else {
            onSnapshot(
              doc(adminDb, "users", user.uid),
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
      id: "super_admins" as AdminTab,
      label: "Super Admin Management",
      icon: Crown,
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

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  const displayName = adminProfile?.name || adminUser?.displayName || "Michael Rohin";
  const displayEmail = adminProfile?.email || adminUser?.email || "michaelrohin@gmail.com";
  const userInitials = getInitials(displayName, displayEmail);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between text-white select-none">
      {/* Brand Header */}
      <div className="flex-shrink-0 pt-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md text-[#1eb863]">
              <Leaf className="h-6 w-6 fill-[#1eb863]/10" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                Tourenvi Admin
              </h1>
              <p className="text-[10px] tracking-wider text-white/80 uppercase font-semibold">
                Operations Center
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[14px] font-medium tracking-normal transition-all duration-200 cursor-pointer text-left ${
                isActive
                  ? "bg-white/25 text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] font-semibold backdrop-blur-xs"
                  : "text-white/85 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ${
                  isActive ? "text-white scale-105" : "text-white/85"
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="flex-shrink-0 pt-4 mt-2 border-t border-white/15 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-wider shrink-0 border border-white/30">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {displayName}
            </h4>
            <p className="text-[11px] text-white/75 truncate mt-0.5">
              {displayEmail}
            </p>
          </div>
        </div>

        {/* Dedicated Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/30 bg-white/5 hover:bg-white/15 text-white text-xs font-semibold tracking-wide transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-72 xl:w-80 fixed top-5 left-5 h-[calc(100vh-2.5rem)] flex-col rounded-[28px] bg-[#1eb863] shadow-[0_12px_36px_rgba(30,184,99,0.25)] p-5 z-30 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#1eb863] p-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default AdminSidebar;
export { AdminSidebar };
