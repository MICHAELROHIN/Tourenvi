import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Leaf,
  MapPin,
  Calculator,
  BarChart3,
  Sparkles,
  User,
  LogOut,
  AlertTriangle,
  MessageSquare,
  LifeBuoy,
  Megaphone,
  CalendarCheck,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import HelpSupportModal from "@/components/shared/HelpSupportModal";
import EmergencyRadarModal from "@/components/shared/EmergencyRadarModal";
import { useAuth } from "@/context/AuthContext";

// --- FIREBASE IMPORTS ---
import { auth, db, logout } from "@/firebase";
import {
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isEmergencyRadarOpen, setIsEmergencyRadarOpen] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState<any[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [imgError, setImgError] = useState(false);
  const { userDoc } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  // Resolve the best profile photo URL:
  // Priority: Firestore userDoc profilePhoto > Firestore userDoc photoURL > Firebase Auth photoURL (Google)
  const resolvedPhotoURL = useMemo(() => {
    const firestorePhoto = userDoc?.profilePhoto || userDoc?.photoURL || userDoc?.profilePicture;
    if (firestorePhoto) return firestorePhoto;
    return user?.photoURL || null;
  }, [userDoc, user]);

  // Resolve the best display name for the fallback initial letter:
  // Priority: Firestore userDoc name (registration name) > Firebase Auth displayName (Google name) > email
  const resolvedDisplayName = useMemo(() => {
    return userDoc?.name || user?.displayName || user?.email || "U";
  }, [userDoc, user]);

  // Get the first letter for the avatar fallback
  const avatarInitial = useMemo(() => {
    return (resolvedDisplayName[0] || "U").toUpperCase();
  }, [resolvedDisplayName]);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setImgError(false);
    });
    return () => unsubscribe();
  }, []);

  // Monitor Active Broadcast Announcements from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "announcements"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs
          .map((doc) => doc.data())
          .filter((a) => a.isActive);
        setActiveAnnouncements(list);
      }
    });
    return () => unsub();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isProfileOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  // Lock body scroll on mobile menu open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { icon: Home, label: "Home", href: "/hero" },
    { icon: Calculator, label: "Trip Builder", href: "/trip/new" },
    { icon: CalendarCheck, label: "Trip Planned", href: "/trips-planned" },
    { icon: MessageSquare, label: "AI Assistant", href: "/chatAI" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteUser(user);
      localStorage.removeItem("isAuthenticated");
      setIsDeleteModalOpen(false);
      navigate("/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setIsDeleteModalOpen(false);
      if (error.code === "auth/requires-recent-login") {
        alert(
          "Security Check: Please Sign Out and Log In again before deleting your account.",
        );
      } else {
        alert("Failed to delete account. Please try again.");
      }
    }
  };

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href.startsWith("/#"))
      return location.pathname === "/" && location.hash === href.slice(1);
    return location.pathname === href;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 w-full">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <div className="w-20 h-20 font-xl flex items-center justify-center">
                <img src="/Transparent logo.png" alt="TOURENVI" />
              </div>
              <span className="text-xl font-bold text-foreground">
                TOURENVI
              </span>
            </Link>

            {/* Desktop Navigation — visible only on lg (1024px+) */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right side actions — Desktop */}
            <div className="hidden lg:flex items-center space-x-2 shrink-0">
              {/* User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 overflow-hidden"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  {resolvedPhotoURL && !imgError ? (
                    <img
                      src={resolvedPhotoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {avatarInitial}
                    </div>
                  )}
                </Button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-border">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-semibold truncate text-foreground">
                          {resolvedDisplayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || "michaelrohin@gmail.com"}
                        </p>
                      </button>
                    </div>

                    <div className="py-1 border-b border-border">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsHelpModalOpen(true);
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors text-left"
                      >
                        <LifeBuoy className="w-4 h-4 mr-2.5 shrink-0 text-[#D4AF37]" />
                        Help & Support
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsEmergencyRadarOpen(true);
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2.5 shrink-0 text-red-500 animate-pulse" />
                        Emergency Assist
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2.5 shrink-0" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile/Tablet Menu Button — visible below lg */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile/Tablet Slide-in Menu */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[280px] sm:w-[320px] bg-background shadow-2xl border-l border-border lg:hidden transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Mobile menu header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <span className="text-lg font-bold text-foreground">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile menu content (scrollable) */}
        <div className="flex flex-col h-[calc(100%-4rem)] overflow-y-auto">
          {/* User info section */}
          {user && (
            <div className="px-4 py-4 border-b border-border bg-muted/30">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDeleteModalOpen(true);
                }}
                className="flex items-center space-x-3 w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {resolvedPhotoURL && !imgError ? (
                  <img
                    src={resolvedPhotoURL}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                    {avatarInitial}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate text-foreground">
                    {resolvedDisplayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Nav links */}
          <div className="flex-1 px-3 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors duration-200",
                  isActive(item.href)
                    ? "text-primary bg-primary/10 font-medium"
                    : "text-foreground hover:bg-muted",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}

            <button
              onClick={() => {
                setIsOpen(false);
                setIsHelpModalOpen(true);
              }}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-colors duration-200 text-left font-semibold"
            >
              <LifeBuoy className="w-5 h-5 shrink-0 text-[#D4AF37]" />
              <span className="text-sm">Help & Support</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setIsEmergencyRadarOpen(true);
              }}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-500 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors duration-200 text-left font-bold"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 animate-pulse" />
              <span className="text-sm">Emergency Assist</span>
            </button>
          </div>

          {/* Bottom actions */}
          <div className="px-3 pb-6 pt-3 border-t border-border space-y-2 mt-auto">
            <Button
              variant="outline"
              className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      {/* --- HELP & SUPPORT MODAL --- */}
      <HelpSupportModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                Confirm Account Deletion
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to permanently delete your account? This
                action cannot be undone and you will lose all your data.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Radar Modal */}
      <EmergencyRadarModal
        isOpen={isEmergencyRadarOpen}
        onClose={() => setIsEmergencyRadarOpen(false)}
      />
    </>
  );
};

export default Navigation;
