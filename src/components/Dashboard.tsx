import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { MapPin, Calendar, Bookmark, Target, Clock, Sparkles, Route as RouteIcon } from "lucide-react";

interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  savedAt: string; // ISO date
}

interface LastTripSummary {
  totalCost: string;
  fuelCost: string;
  accommodationCost: string;
  tollCharges: string;
  carbonFootprint?: string;
}

const sampleRoutes: SavedRoute[] = [
  { id: "1", origin: "Chennai", destination: "Madurai", savedAt: new Date().toISOString() },
  { id: "2", origin: "Bengaluru", destination: "Coimbatore", savedAt: new Date(Date.now() - 86400000).toISOString() },
];

const Dashboard = () => {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [lastTrip, setLastTrip] = useState<LastTripSummary | null>(null);

  useEffect(() => {
    try {
      const storedRoutes = JSON.parse(localStorage.getItem("savedRoutes") || "null");
      const storedLast = JSON.parse(localStorage.getItem("lastTripResults") || "null");
      setRoutes(Array.isArray(storedRoutes) && storedRoutes.length ? storedRoutes : sampleRoutes);
      setLastTrip(storedLast && typeof storedLast === "object" ? storedLast : null);
    } catch {
      setRoutes(sampleRoutes);
      setLastTrip(null);
    }
  }, []);

  const budgetProgress = useMemo(() => {
    if (!lastTrip?.totalCost) return 40; // demo progress
    const total = parseFloat(lastTrip.totalCost);
    const cap = Math.max(1, total * 1.5);
    return Math.min(100, Math.round((total / cap) * 100));
  }, [lastTrip]);

  const openInMaps = (o: string, d: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <section id="dashboard" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-accent/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Your Travel Dashboard</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Plan, Save and Resume</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Quick access to your routes, recent costs, and handy actions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Overview */}
          <Card className="shadow-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Trip Summary</span>
              </CardTitle>
              <CardDescription>Your latest planning snapshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budget progress</span>
                <span className="text-sm font-medium">{budgetProgress}%</span>
              </div>
              <Progress value={budgetProgress} />
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Last total</p>
                  <p className="text-lg font-semibold">${lastTrip?.totalCost ?? "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">CO₂</p>
                  <p className="text-lg font-semibold">{lastTrip?.carbonFootprint ? `${lastTrip.carbonFootprint} kg` : "—"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => window.location.assign('#calculator')}>Open Calculator</Button>
                <Button size="sm" variant="outline" onClick={() => window.location.assign('#routes')}>Plan Route</Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Routes */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RouteIcon className="w-5 h-5 text-primary" />
                <span>Saved Routes</span>
              </CardTitle>
              <CardDescription>Your recent and favorite directions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {routes.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">#{r.id}</Badge>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {r.origin}
                        <span className="text-muted-foreground">→</span>
                        {r.destination}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(r.savedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openInMaps(r.origin, r.destination)}>Open Maps</Button>
                    <Button size="sm" onClick={() => {
                      localStorage.setItem('draftRoute', JSON.stringify({ origin: r.origin, destination: r.destination }));
                      window.location.assign('#routes');
                    }}>Load</Button>
                  </div>
                </div>
              ))}
              {routes.length === 0 && (
                <p className="text-sm text-muted-foreground">No routes yet. Plan your first route and save it.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Jump to common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" onClick={() => window.location.assign('#calculator')} className="justify-start"><Clock className="w-4 h-4 mr-2"/>Estimate Costs</Button>
                <Button variant="outline" onClick={() => window.location.assign('#routes')} className="justify-start"><MapPin className="w-4 h-4 mr-2"/>New Route</Button>
                <Button variant="outline" onClick={() => window.location.assign('#sustainability')} className="justify-start"><Target className="w-4 h-4 mr-2"/>Eco Insights</Button>
                <Button variant="outline" onClick={() => window.location.assign('#locgenie')} className="justify-start"><Sparkles className="w-4 h-4 mr-2"/>Destination Genie</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
