import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TollEstimator from "@/components/cost/TollEstimator";
import { calculateCO2, calculateFoodCost, calculateFuelCost, formatINR, getBudgetLevel } from "@/utils/costUtils";
import { auth, db } from "@/firebase";
import { useTrip } from "@/context/TripContext";

const TripCalculator = () => {
  const { trip, updateTrip } = useTrip();
  const [distance, setDistance] = useState(300);
  const [mileage, setMileage] = useState(15);
  const [fuelPrice, setFuelPrice] = useState(102);
  const [hotelCost, setHotelCost] = useState(5000);
  const [misc, setMisc] = useState(1200);
  const [vehicleType, setVehicleType] = useState("suv");
  const [tollCost, setTollCost] = useState(0);

  const days = useMemo(() => {
    if (!trip.startDate || !trip.endDate) {
      return 1;
    }
    return Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000));
  }, [trip.endDate, trip.startDate]);

  const fuelCost = calculateFuelCost(distance, mileage, fuelPrice, 1.15);
  const foodCost = calculateFoodCost(trip.numberOfMembers || 1, days, 500);
  const total = fuelCost + tollCost + hotelCost + foodCost + misc;
  const perPerson = total / Math.max(1, trip.numberOfMembers || 1);
  const co2kg = calculateCO2(distance, vehicleType as "twoWheeler" | "hatchback" | "sedan" | "suv" | "tempo" | "electric");
  const budgetLevel = getBudgetLevel(perPerson);

  const saveTrip = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    await addDoc(collection(db, "trips"), {
      userId: uid,
      tripName: `${trip.startLocation || "My"} Trip`,
      tripType: trip.tripType,
      startDate: trip.startDate,
      endDate: trip.endDate,
      numberOfDays: days,
      numberOfMembers: trip.numberOfMembers,
      startLocation: trip.startLocation,
      vehicleType,
      fuelType: trip.fuelType,
      fuelPrice,
      mileage,
      moods: trip.moods,
      genres: trip.genres,
      destinations: trip.destinations,
      itinerary: trip.itinerary,
      costBreakdown: {
        fuel: fuelCost,
        toll: tollCost,
        hotel: hotelCost,
        food: foodCost,
        misc,
        total,
        perPerson,
      },
      ecoScore: {
        co2kg,
        tip: co2kg > 60 ? "Try a rail segment or EV for lower emissions" : "Great eco-friendly profile",
      },
      status: "draft",
      memberIds: [uid],
      createdAt: serverTimestamp(),
    });

    localStorage.setItem(
      "tourenvi.offline.trip",
      JSON.stringify({
        tripName: `${trip.startLocation || "My"} Trip`,
        destinations: trip.destinations,
        updatedAt: new Date().toISOString(),
      }),
    );

    updateTrip("costBreakdown", {
      fuel: fuelCost,
      toll: tollCost,
      hotel: hotelCost,
      food: foodCost,
      misc,
      total,
      perPerson,
    });
  };

  return (
    <section className="py-8">
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
            <CardDescription>Fuel + Toll + Hotel + Food + Misc with eco score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Distance (km)</Label>
                <Input type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value || 0))} />
              </div>
              <div>
                <Label>Mileage (km/l)</Label>
                <Input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value || 0))} />
              </div>
              <div>
                <Label>Fuel Price</Label>
                <Input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(Number(e.target.value || 0))} />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twoWheeler">Two Wheeler</SelectItem>
                    <SelectItem value="hatchback">Hatchback</SelectItem>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="tempo">Tempo</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hotel Cost</Label>
                <Input type="number" value={hotelCost} onChange={(e) => setHotelCost(Number(e.target.value || 0))} />
              </div>
              <div>
                <Label>Miscellaneous</Label>
                <Input type="number" value={misc} onChange={(e) => setMisc(Number(e.target.value || 0))} />
              </div>
            </div>

            <TollEstimator
              startLocation={trip.startLocation}
              destinations={trip.destinations}
              vehicleType={vehicleType}
              onTollComputed={setTollCost}
            />

            <Button onClick={saveTrip} className="w-full">Save Trip</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between"><span>Fuel</span><span>{formatINR(fuelCost)}</span></p>
            <p className="flex justify-between"><span>Toll</span><span>{formatINR(tollCost)}</span></p>
            <p className="flex justify-between"><span>Hotel</span><span>{formatINR(hotelCost)}</span></p>
            <p className="flex justify-between"><span>Food</span><span>{formatINR(foodCost)}</span></p>
            <p className="flex justify-between"><span>Misc</span><span>{formatINR(misc)}</span></p>
            <hr />
            <p className="flex justify-between font-semibold"><span>Total</span><span>{formatINR(total)}</span></p>
            <p className="flex justify-between"><span>Per Person</span><span>{formatINR(perPerson)}</span></p>
            <p className="flex justify-between"><span>Eco Score (CO2)</span><span>{co2kg.toFixed(1)} kg</span></p>
            <Badge variant={budgetLevel === "budget" ? "secondary" : budgetLevel === "moderate" ? "default" : "destructive"}>
              {budgetLevel === "budget" ? "Budget" : budgetLevel === "moderate" ? "Moderate" : "High"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TripCalculator;
