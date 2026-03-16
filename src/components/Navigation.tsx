import { useState, useRef, useEffect } from "react";
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
  ShoppingCart,
  User,
  LogOut,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- FIREBASE IMPORTS ---
import { auth, logout } from "@/firebase";
import {
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
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
    { icon: MapPin, label: "Route Planner", href: "/map" },
    { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
    { icon: Sparkles, label: "Attractions", href: "/attractions" },
    { icon: Calculator, label: "Trip Builder", href: "/trip/new" },
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
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
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
              <Button
                asChild
                size="sm"
                className="shadow-card bg-primary text-primary-foreground hover:shadow-xl transition-all"
              >
                <Link to="/cart">
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  View Cart
                </Link>
              </Button>

              {/* User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border bg-background hover:bg-muted"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-foreground" />
                  )}
                </Button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-sm font-semibold truncate text-foreground">
                          {user?.displayName || "Guest User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || "No email detected"}
                        </p>
                      </button>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </button>
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
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate text-foreground">
                    {user.displayName || "Guest User"}
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
          </div>

          {/* Bottom actions */}
          <div className="px-3 pb-6 pt-3 border-t border-border space-y-2 mt-auto">
            <Button
              asChild
              className="w-full justify-center shadow-card"
              onClick={() => setIsOpen(false)}
            >
              <Link to="/cart">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
              </Link>
            </Button>

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
    </>
  );
};

export default Navigation;
