import { useState, useRef, useEffect } from "react"; // ✨ Added useRef, useEffect
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
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  
  // ✨ Ref for the profile dropdown container
  const profileRef = useRef<HTMLDivElement>(null);

  // ✨ Handle Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the dropdown is open AND the click is NOT inside the profileRef container
      if (
        isProfileOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Unbind the event listener on cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const navItems = [
    { icon: MapPin, label: "Route Planner", href: "/route-planner" },
    { icon: Leaf, label: "Eco Insights", href: "/#sustainability" },
    { icon: BarChart3, label: "Dashboard", href: "/#dashboard" },
    { icon: Sparkles, label: "Destination Genie", href: "/destination-genie" },
    { icon: Calculator, label: "Fuel Estimator", href: "/fuel-estimator" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
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
            
            {/* View Cart Button */}
            <Button asChild className="shadow-card bg-primary text-primary-foreground hover:shadow-xl transition-all">
              <Link to="/cart">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
              </Link>
            </Button>

            {/* ✨ User Profile Dropdown (Wrapped with Ref) */}
            <div className="relative ml-2" ref={profileRef}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-border bg-background hover:bg-muted"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <User className="w-5 h-5 text-foreground" />
              </Button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground">user@example.com</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
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
              <Button asChild className="w-full justify-start" onClick={() => setIsOpen(false)}>
                <Link to="/cart">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart
                </Link>
              </Button>
              
              {/* Mobile Logout */}
              <Button 
                variant="destructive" 
                className="w-full justify-start"
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
  );
};

export default Navigation;