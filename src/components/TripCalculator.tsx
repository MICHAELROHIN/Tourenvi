import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Car, Home, MapPin as Road, Fuel, DollarSign } from "lucide-react";

interface TripData {
  distance: number;
  fuelEfficiency: number;
  fuelPrice: number;
  accommodationType: string;
  accommodationNights: number;
  tollCharges: number;
  vehicleType: string;
}

interface ResultData {
  fuelCost: string;
  accommodationCost: string;
  tollCharges: string;
  totalCost: string;
  carbonFootprint: string;
}

const TripCalculator = () => {
  const [tripData, setTripData] = useState<TripData>({
    distance: 0,
    fuelEfficiency: 25,
    fuelPrice: 3.5,
    accommodationType: "hotel",
    accommodationNights: 2,
    tollCharges: 0,
    vehicleType: "gasoline"
  });

  const [results, setResults] = useState<ResultData | null>(null);

  const accommodationPrices = {
    budget: 60,
    hotel: 120,
    luxury: 250,
    camping: 25
  };

  const calculateTrip = () => {
    const fuelCost = (tripData.distance / tripData.fuelEfficiency) * tripData.fuelPrice;
    const accommodationCost = accommodationPrices[tripData.accommodationType as keyof typeof accommodationPrices] * tripData.accommodationNights;
    const totalCost = fuelCost + accommodationCost + tripData.tollCharges;
    
    // Calculate carbon footprint (rough estimation)
    const carbonFootprint = tripData.vehicleType === 'electric' ? 
      tripData.distance * 0.1 : // kg CO2 per mile for electric
      tripData.distance * 0.4;   // kg CO2 per mile for gasoline

    setResults({
      fuelCost: fuelCost.toFixed(2),
      accommodationCost: accommodationCost.toFixed(2),
      tollCharges: tripData.tollCharges.toFixed(2),
      totalCost: totalCost.toFixed(2),
      carbonFootprint: carbonFootprint.toFixed(1)
    });
  };

  return (
    <section id="calculator" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Trip Cost Calculator</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Plan Your Budget with Precision
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get accurate cost estimates for your trip including fuel, accommodation, and additional expenses.
          </p>
        </div>

        <div className={`max-w-6xl mx-auto gap-8 transition-all duration-300 ${results ? 'grid grid-cols-1 lg:grid-cols-2' : 'flex justify-center'}`}>          
          {/* Input Form */}
          <Card className={`shadow-card transition-all duration-300 ${!results ? 'w-full max-w-xl' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-primary" />
                <span>Trip Details</span>
              </CardTitle>
              <CardDescription>
                Enter your trip information to get a detailed cost breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (miles)</Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="500"
                    value={tripData.distance || ''}
                    onChange={(e) => setTripData({...tripData, distance: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-efficiency">Fuel Efficiency (MPG)</Label>
                  <Input
                    id="fuel-efficiency"
                    type="number"
                    placeholder="25"
                    value={tripData.fuelEfficiency || ''}
                    onChange={(e) => setTripData({...tripData, fuelEfficiency: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel-price">Fuel Price ($/gallon)</Label>
                  <Input
                    id="fuel-price"
                    type="number"
                    step="0.01"
                    placeholder="3.50"
                    value={tripData.fuelPrice || ''}
                    onChange={(e) => setTripData({...tripData, fuelPrice: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <Select value={tripData.vehicleType} onValueChange={(value) => setTripData({...tripData, vehicleType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accommodation">Accommodation Type</Label>
                  <Select value={tripData.accommodationType} onValueChange={(value) => setTripData({...tripData, accommodationType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget Hotel ($60/night)</SelectItem>
                      <SelectItem value="hotel">Standard Hotel ($120/night)</SelectItem>
                      <SelectItem value="luxury">Luxury Hotel ($250/night)</SelectItem>
                      <SelectItem value="camping">Camping ($25/night)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nights">Number of Stay</Label>
                  <Input
                    id="nights"
                    type="number"
                    placeholder="2"
                    value={tripData.accommodationNights || ''}
                    onChange={(e) => setTripData({...tripData, accommodationNights: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tolls">Toll Charges ($)</Label>
                <Input
                  id="tolls"
                  type="number"
                  placeholder="25"
                  value={tripData.tollCharges || ''}
                  onChange={(e) => setTripData({...tripData, tollCharges: Number(e.target.value)})}
                />
              </div>

              <Button onClick={calculateTrip} className="w-full" size="lg">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Trip Cost
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card className="shadow-card transition-opacity duration-300 animate-in fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  <span>Cost Breakdown</span>
                </CardTitle>
                <CardDescription>
                  Your detailed trip cost analysis and environmental impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Fuel className="w-5 h-5 text-primary" />
                      <span className="font-medium">Fuel Cost</span>
                    </div>
                    <span className="text-lg font-bold">${results.fuelCost}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Home className="w-5 h-5 text-accent" />
                      <span className="font-medium">Accommodation</span>
                    </div>
                    <span className="text-lg font-bold">${results.accommodationCost}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Road className="w-5 h-5 text-warning" />
                      <span className="font-medium">Toll Charges</span>
                    </div>
                    <span className="text-lg font-bold">${results.tollCharges}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-6 bg-gradient-sustainability/10 rounded-lg border-2 border-success/20">
                  <div>
                    <p className="text-2xl font-bold text-foreground">${results.totalCost}</p>
                    <p className="text-sm text-muted-foreground">Total Trip Cost</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-eco-green">{results.carbonFootprint} kg CO₂</p>
                    <p className="text-sm text-muted-foreground">Carbon Footprint</p>
                  </div>
                </div>

                <div className="p-4 bg-eco-green/10 rounded-lg border border-eco-green/20">
                  <p className="text-sm text-eco-green font-medium mb-2">💚 Eco Tip</p>
                  <p className="text-sm text-muted-foreground">
                    {tripData.vehicleType === 'electric' 
                      ? "Great choice! Electric vehicles significantly reduce your carbon footprint."
                      : "Consider renting an electric or hybrid vehicle to reduce your environmental impact by up to 60%."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default TripCalculator;