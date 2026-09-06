import React, { useState, useEffect } from "react";
import { adminAuth, adminDb } from "@/lib/firebaseAdminAuth";
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
  Leaf,
  UserCheck,
  Headphones,
  DollarSign,
  Activity,
  History,
  AlertTriangle,
  Megaphone,
  X,
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

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between overflow-hidden">
      {/* Brand Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white shadow-[0_4px_12px_rgba(46,204,113,0.3)]">
              <Leaf className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1e3b34] leading-tight">
                Tourenvi<span className="text-[#2ecc71] ml-1">Admin</span>
              </h1>
              <p className="text-[9px] tracking-widest text-[#2ecc71] uppercase font-extrabold">
                Operations Center
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation list with balanced compact spacing */}
      <nav className="flex-1 overflow-y-auto pr-0.5 py-2.5 space-y-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-semibold tracking-normal transition-all duration-150 relative group cursor-pointer ${
                isActive
                  ? "text-[#2ecc71] bg-[#2ecc71]/10 shadow-[inset_3px_0_0_#2ecc71]"
                  : "text-slate-600 hover:text-[#1e3b34] hover:bg-slate-50 hover:translate-x-0.5"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                  isActive ? "text-[#2ecc71]" : "text-slate-400 group-hover:text-[#1e3b34]"
                }`}
              />
              <span className="truncate">{item.label}</span>

              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2ecc71] shadow-[0_0_6px_rgba(46,204,113,0.8)] shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout - Compact & Clean */}
      <div className="flex-shrink-0 pt-2.5 mt-1 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between gap-2.5 px-2 py-1 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[#2ecc71] border border-emerald-200 shrink-0 font-bold text-xs uppercase">
              {adminProfile?.name ? (
                adminProfile.name.substring(0, 2)
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-[#1e3b34] truncate leading-tight">
                {adminProfile?.name || "System Admin"}
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                {adminProfile?.email || adminUser?.email || "admin@tourenvi.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold tracking-wide transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sticky Sidebar */}
      <aside className="hidden lg:flex w-72 xl:w-80 fixed top-5 left-5 h-fit max-h-[calc(100vh-2.5rem)] flex-col rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4 z-30 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
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
