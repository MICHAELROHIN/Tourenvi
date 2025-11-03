import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Leaf, MapPin, Calculator, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: Calculator, label: "Cost Calculator", href: "#calculator" },
    { icon: MapPin, label: "Route Planner", href: "#routes" },
    { icon: Leaf, label: "Eco Insights", href: "#sustainability" },
    { icon: BarChart3, label: "Dashboard", href: "#dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">TOURENVI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center space-x-2 hover:text-green-900 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            ))}
            <Button variant="default" className="shadow-card">
              Get Started
            </Button>
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
            isOpen ? "max-h-64 pb-4" : "max-h-0"
          )}
        >
          <div className="space-y-3 pt-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{item.label}</span>
              </a>
            ))}
            <Button variant="default" className="w-full mt-4">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;