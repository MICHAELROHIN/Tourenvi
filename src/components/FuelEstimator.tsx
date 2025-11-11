import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Fuel, Car, Gauge } from "lucide-react";

const API_BASE = "http://localhost:8000";

const FuelEstimator = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [fuels, setFuels] = useState<string[]>([]);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");

  const [distanceKm, setDistanceKm] = useState<string>("");
  const [fuelPrice, setFuelPrice] = useState<string>("");

  const [mileage, setMileage] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load brands on mount
    fetch(`${API_BASE}/brands`)
      .then((r) => r.json())
      .then((data) => setBrands(data || []))
      .catch(() => setBrands([]));
  }, []);

  const onBrandChange = async (value: string) => {
    setBrand(value);
    setModel("");
    setFuel("");
    setModels([]);
    setFuels([]);
    setMileage(null);
    setCost(null);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/models?brand=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setModels(data || []);
    } catch (e) {
      setModels([]);
    }
  };

  const onModelChange = async (value: string) => {
    setModel(value);
    setFuel("");
    setFuels([]);
    setMileage(null);
    setCost(null);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/fuel?brand=${encodeURIComponent(
          brand
        )}&model=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setFuels(data || []);
    } catch (e) {
      setFuels([]);
    }
  };

  const fetchMileage = async () => {
    if (!brand || !model || !fuel) return;
    setLoading(true);
    setError(null);
    setMileage(null);
    setCost(null);
    try {
      const res = await fetch(
        `${API_BASE}/mileage?brand=${encodeURIComponent(
          brand
        )}&model=${encodeURIComponent(model)}&fuel=${encodeURIComponent(fuel)}`
      );
      const data = await res.json();
      const m = typeof data?.mileage === "number" ? data.mileage : null;
      setMileage(m);
      return m;
    } catch (e) {
      setError("Failed to fetch mileage");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => {
    const m = await fetchMileage();
    if (m && distanceKm && fuelPrice) {
      const km = parseFloat(distanceKm);
      const price = parseFloat(fuelPrice);
      if (!isNaN(km) && !isNaN(price) && m > 0) {
        const liters = km / m; // km per liter
        const total = liters * price;
        setCost(parseFloat(total.toFixed(2)));
      }
    }
  };

  const resetAll = () => {
    setBrand("");
    setModel("");
    setFuel("");
    setModels([]);
    setFuels([]);
    setDistanceKm("");
    setFuelPrice("");
    setMileage(null);
    setCost(null);
    setError(null);
  };

  return (
    <section id="fuel-estimator" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Fuel className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Fuel Estimator
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Estimate Fuel Cost by Vehicle
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select brand, model and fuel type, then enter distance and fuel
            price to get a precise cost estimate.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-primary" />
                <span>Vehicle & Trip Details</span>
              </CardTitle>
              <CardDescription>
                Use dropdowns to pick your vehicle; enter trip distance and fuel
                price.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Select value={brand} onValueChange={onBrandChange}>
                    <SelectTrigger id="brand">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={model}
                    onValueChange={onModelChange}
                    disabled={!brand}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel">Fuel</Label>
                  <Select
                    value={fuel}
                    onValueChange={setFuel}
                    disabled={!model}
                  >
                    <SelectTrigger id="fuel">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuels.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="500"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Fuel Price (per litre)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={onSearch} disabled={!brand || !model || !fuel}>
                  <Gauge className="w-4 h-4 mr-2" /> Calculate Cost
                </Button>
                <Button variant="outline" onClick={resetAll}>
                  Reset
                </Button>
              </div>

              {loading && (
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  Fetching mileage...
                </div>
              )}
              {error && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-success" />
                <span>Estimate</span>
              </CardTitle>
              <CardDescription>
                Your vehicle's mileage and trip fuel cost
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="font-medium">Mileage</span>
                <span className="text-lg font-bold">
                  {mileage ? `${mileage} km/l` : "—"}
                </span>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="font-medium">Estimated Fuel Cost</span>
                <span className="text-lg font-bold">
                  {cost !== null ? `₹ ${cost}` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FuelEstimator;
