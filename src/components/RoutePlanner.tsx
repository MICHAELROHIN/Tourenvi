import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Fuel, Route, Zap } from "lucide-react";

interface RouteOption {
  id: string;
  name: string;
  distance: string;
  duration: string;
  fuelCost: string;
  type: "fastest" | "eco" | "scenic";
  description: string;
  highlights: string[];
}

const RoutePlanner = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const mockRoutes: RouteOption[] = [
    {
      id: "fastest",
      name: "Fastest Route",
      distance: "487 miles",
      duration: "7h 23m",
      fuelCost: "$68.20",
      type: "fastest",
      description: "Direct highway route with minimal stops",
      highlights: ["Interstate highways", "3 rest stops", "No scenic detours"]
    },
    {
      id: "eco",
      name: "Eco-Friendly Route",
      distance: "502 miles",
      duration: "8h 15m",
      fuelCost: "$52.40",
      type: "eco",
      description: "Optimized for fuel efficiency and lower emissions",
      highlights: ["EV charging stations", "Hybrid-friendly roads", "Reduced idling time"]
    },
    {
      id: "scenic",
      name: "Scenic Route",
      distance: "523 miles",
      duration: "9h 45m",
      fuelCost: "$72.80",
      type: "scenic",
      description: "Beautiful landscapes and interesting stops along the way",
      highlights: ["National parks", "Scenic overlooks", "Historic landmarks"]
    }
  ];

  const planRoute = () => {
    if (origin && destination) {
      setRoutes(mockRoutes);
    }
  };

  const getRouteIcon = (type: RouteOption['type']) => {
    switch (type) {
      case 'fastest':
        return <Navigation className="w-5 h-5" />;
      case 'eco':
        return <Zap className="w-5 h-5" />;
      case 'scenic':
        return <Route className="w-5 h-5" />;
    }
  };

  const getRouteColor = (type: RouteOption['type']) => {
    switch (type) {
      case 'fastest':
        return 'bg-primary text-primary-foreground';
      case 'eco':
        return 'bg-success text-success-foreground';
      case 'scenic':
        return 'bg-accent text-accent-foreground';
    }
  };

  return (
    <section id="routes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-accent/10 rounded-full px-4 py-2 mb-4">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Smart Route Planning</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Your Perfect Route
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare multiple route options optimized for speed, fuel efficiency, or scenic beauty.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Route Input */}
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-primary" />
                <span>Plan Your Route</span>
              </CardTitle>
              <CardDescription>
                Enter your starting point and destination to get optimized route suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="origin">From</Label>
                  <Input
                    id="origin"
                    placeholder="Enter starting location"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">To</Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={planRoute} className="w-full md:w-auto" size="lg">
                <MapPin className="w-4 h-4 mr-2" />
                Find Routes
              </Button>
            </CardContent>
          </Card>

          {/* Route Options */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground mb-6">Route Options</h3>
              {routes.map((route) => (
                <Card 
                  key={route.id} 
                  className={`cursor-pointer transition-all duration-200 shadow-card hover:shadow-xl ${
                    selectedRoute === route.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRoute(route.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 mb-4 md:mb-0">
                        <div className={`p-2 rounded-lg ${getRouteColor(route.type)}`}>
                          {getRouteIcon(route.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{route.name}</h4>
                          <p className="text-sm text-muted-foreground">{route.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {route.type === 'fastest' && 'Fastest'}
                        {route.type === 'eco' && 'Most Eco-Friendly'}
                        {route.type === 'scenic' && 'Most Scenic'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <MapPin className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">{route.distance}</p>
                        <p className="text-xs text-muted-foreground">Distance</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">{route.duration}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Fuel className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-sm font-medium text-foreground">{route.fuelCost}</p>
                        <p className="text-xs text-muted-foreground">Fuel Cost</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Route Highlights:</p>
                      <div className="flex flex-wrap gap-2">
                        {route.highlights.map((highlight, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Map Placeholder */}
              <Card className="shadow-card">
                <CardContent className="p-0">
                  <div className="h-96 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">Interactive Map View</p>
                      <p className="text-sm text-muted-foreground">
                        Detailed route visualization with real-time traffic and points of interest
                      </p>
                      <Button variant="outline" className="mt-4">
                        View Full Map
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RoutePlanner;