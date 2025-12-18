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
import { Fuel, Car, Gauge, Loader2, Info } from "lucide-react";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:8000";

// ✨ Configuration for RapidAPI (Real-time Fuel Prices)
// Get your key from: https://rapidapi.com/mi8y-mi8y-default/api/daily-petrol-diesel-lpg-cng-fuel-prices-in-india
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "YOUR_RAPIDAPI_KEY"; 
const RAPIDAPI_HOST = "daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com";

const FuelEstimator = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [fuels, setFuels] = useState<string[]>([]);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [city, setCity] = useState("Chennai"); // Default city for API fetch

  const [distanceKm, setDistanceKm] = useState<string>("");
  const [fuelPrice, setFuelPrice] = useState<string>("");

  const [mileage, setMileage] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/brands`)
      .then((r) => r.json())
      .then((data) => setBrands(data || []))
      .catch(() => setBrands([]));
  }, []);

  // --- Fetch Real-Time Fuel Price from API ---
  const fetchLiveFuelPrice = async (selectedFuel: string) => {
    if (selectedFuel === "Electric") {
        setFuelPrice("20"); // Avg public charging cost/kWh in India
        toast.success("Set estimated EV charging rate: ₹20/kWh");
        return;
    }

    setPriceLoading(true);
    try {
        // Mapping our fuel selection to API query params
        const fuelQuery = selectedFuel.toLowerCase(); // petrol, diesel, cng
        
        const response = await fetch(
            `https://${RAPIDAPI_HOST}/v1/fuel-prices?city=${city}&fuelType=${fuelQuery}`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": RAPIDAPI_HOST,
                },
            }
        );

        if (!response.ok) throw new Error("API Limit Reached or Error");
        
        const data = await response.json();
        // Adjust this path based on the specific API response structure you choose
        // Example: data.price or data.retailPrice
        const price = data?.retailPrice || data?.price; 

        if (price) {
            setFuelPrice(String(price));
            toast.success(`Live ${selectedFuel} price in ${city}: ₹${price}`);
        } else {
            // Fallback if API fails or city not found
            fallbackPrices(selectedFuel);
        }
    } catch (err) {
        console.error("Fuel API Error:", err);
        fallbackPrices(selectedFuel);
    } finally {
        setPriceLoading(false);
    }
  };

  const fallbackPrices = (fType: string) => {
      // Approximate defaults for 2025 if API fails
      let price = "102";
      if (fType.toLowerCase() === "diesel") price = "94";
      if (fType.toLowerCase() === "cng") price = "85";
      setFuelPrice(price);
      toast.error("Live price failed. Using estimation.");
  };

  // --- Vehicle Logic ---
  const onBrandChange = async (value: string) => {
    setBrand(value);
    setModel("");
    setFuelType("");
    setModels([]);
    setFuels([]);
    try {
      const res = await fetch(`${API_BASE}/models?brand=${encodeURIComponent(value)}`);
      const data = await res.json();
      setModels(data || []);
    } catch (e) { setModels([]); }
  };

  const onModelChange = async (value: string) => {
    setModel(value);
    setFuelType("");
    setFuels([]);
    try {
      const res = await fetch(
        `${API_BASE}/fuel?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setFuels(data || []);
    } catch (e) { setFuels([]); }
  };

  const onFuelChange = (val: string) => {
      setFuelType(val);
      fetchLiveFuelPrice(val); // ✨ Auto-fetch price on selection
  };

  const fetchMileage = async () => {
    if (!brand || !model || !fuelType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/mileage?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&fuel=${encodeURIComponent(fuelType)}`
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
    let m = mileage;
    if (!m) m = await fetchMileage();
    
    if (m && distanceKm && fuelPrice) {
      const km = parseFloat(distanceKm);
      const price = parseFloat(fuelPrice);
      if (!isNaN(km) && !isNaN(price) && m > 0) {
        // For EV: Mileage is usually km/full charge or km/kWh. 
        // Assuming standard km/l or km/kWh logic:
        const unitsNeeded = km / m; 
        const total = unitsNeeded * price;
        setCost(parseFloat(total.toFixed(2)));
      }
    }
  };

  const resetAll = () => {
    setBrand("");
    setModel("");
    setFuelType("");
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
            Estimate Fuel Cost (Live Rates)
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select your vehicle and get real-time fuel prices for accurate trip costing.
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
                We auto-fetch daily fuel rates based on your selection.
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
                  <Label htmlFor="fuel">Fuel Type</Label>
                  <Select
                    value={fuelType}
                    onValueChange={onFuelChange}
                    disabled={!model}
                  >
                    <SelectTrigger id="fuel">
                      <SelectValue placeholder="Select fuel" />
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
                  <Label htmlFor="city">City (for rates)</Label>
                  <Input 
                    id="city" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    placeholder="e.g. Chennai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center justify-between">
                    <span>
                        {fuelType === 'Electric' ? 'Cost per kWh' : 'Price / Litre'}
                    </span>
                    {priceLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  </Label>
                  <div className="relative">
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="Fetch or enter"
                        value={fuelPrice}
                        onChange={(e) => setFuelPrice(e.target.value)}
                        className="pr-8"
                    />
                    <div className="absolute right-3 top-2.5 text-muted-foreground text-xs">
                        ₹
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={onSearch} disabled={!brand || !model || !fuelType} className="flex-1">
                  <Gauge className="w-4 h-4 mr-2" /> Calculate
                </Button>
                <Button variant="outline" onClick={resetAll}>
                  Reset
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-success" />
                <span>Trip Estimate</span>
              </CardTitle>
              <CardDescription>
                Based on {mileage ? mileage : "vehicle"} {fuelType === 'Electric' ? 'range' : 'mileage'} and real-time rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="font-medium">
                    {fuelType === 'Electric' ? 'Range / Efficiency' : 'Mileage'}
                </span>
                <span className="text-lg font-bold">
                  {mileage ? `${mileage} ${fuelType === 'Electric' ? 'km/kWh' : 'km/l'}` : "—"}
                </span>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="font-medium">Fuel Rate Used</span>
                <span className="text-lg font-bold">
                  {fuelPrice ? `₹ ${fuelPrice}` : "—"}
                </span>
              </div>

              <div className="p-6 bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Estimated Cost</span>
                <span className="text-4xl font-extrabold text-primary mt-2">
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