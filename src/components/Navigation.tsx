import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- FIREBASE IMPORTS ---
import { auth } from "@/firebase"; 
import { signOut, deleteUser, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // State for the Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle Click Outside Logic (Profile Dropdown)
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

  const navItems = [
    { icon: MapPin, label: "Route Planner", href: "/route-planner" },
    { icon: Leaf, label: "Eco Insights", href: "/#sustainability" },
    { icon: BarChart3, label: "Dashboard", href: "/#dashboard" },
    { icon: Sparkles, label: "Destination Genie", href: "/destination-genie" },
    { icon: Calculator, label: "Fuel Estimator", href: "/fuel-estimator" },
  ];

  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isAuthenticated");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // --- FINAL DELETE ACTION (Triggered from Modal) ---
  const confirmDeleteAccount = async () => {
    if (!user) return;

    try {
      await deleteUser(user);
      localStorage.removeItem("isAuthenticated");
      setIsDeleteModalOpen(false); // Close modal
      navigate("/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setIsDeleteModalOpen(false);
      
      if (error.code === 'auth/requires-recent-login') {
        alert("Security Check: Please Sign Out and Log In again before deleting your account.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">TOURENVI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center space-x-2 hover:text-green-900 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <Button asChild className="shadow-card bg-primary text-primary-foreground hover:shadow-xl transition-all">
                <Link to="/cart">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart
                </Link>
              </Button>

              {/* User Profile Dropdown */}
              <div className="relative ml-2" ref={profileRef}>
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
                    
                    {/* Clickable Name triggers Modal (Clean Look) */}
                    <div className="px-2 py-2 border-b border-border">
                      <button 
                        onClick={() => { setIsProfileOpen(false); setIsDeleteModalOpen(true); }}
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

                    {/* ✨ Sign Out Button (Now Red on Hover) */}
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

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div
            className={cn(
              "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
              isOpen ? "max-h-96 pb-4" : "max-h-0"
            )}
          >
            <div className="space-y-3 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{item.label}</span>
                </Link>
              ))}
              
              <div className="flex flex-col gap-3 mt-4 border-t border-border pt-4">
                {/* Mobile User Info (Clean Look) */}
                {user && (
                  <button 
                    onClick={() => { setIsOpen(false); setIsDeleteModalOpen(true); }}
                    className="flex items-center space-x-3 px-2 mb-2 w-full text-left hover:bg-gray-100 p-2 rounded-lg"
                  >
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate text-foreground">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                  </button>
                )}

                <Button asChild className="w-full justify-start" onClick={() => setIsOpen(false)}>
                  <Link to="/cart">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Cart
                  </Link>
                </Button>
                
                {/* ✨ Mobile Sign Out (Red Border & Text) */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
        </div>
      </nav>

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[400px] max-w-[90%] bg-white rounded-xl shadow-2xl p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Confirm Account Deletion
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all your data.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md"
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