import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  calculateCO2,
  calculateFoodCost,
  calculateFuelCost,
  formatINR,
  getBudgetLevel,
} from "@/utils/costUtils";
import { auth, db } from "@/firebase";
import { useTrip } from "@/context/TripContext";

type TollEstimateResponse = {
  estimatedToll: number;
  breakdown: Array<{ segment: string; distanceKm: number; toll: number }>;
};

type DestinationPlacesResponse = {
  places: Array<{ id: string; name: string }>;
  destinationMeta?: {
    budgetActivitiesRange?: [number, number] | null;
    midActivitiesRange?: [number, number] | null;
    luxuryActivitiesRange?: [number, number] | null;
  };
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();

const TripCalculator = () => {
  const { trip, updateTrip } = useTrip();
  const [hotelCost, setHotelCost] = useState(0);
  const [placesCost, setPlacesCost] = useState(0);
  const [misc, setMisc] = useState(0);
  const [tollCost, setTollCost] = useState(0);
  const [loadingToll, setLoadingToll] = useState(false);
  const [loadingHotel, setLoadingHotel] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const days = useMemo(() => {
    if (!trip.startDate || !trip.endDate) {
      return 1;
    }
    return Math.max(
      1,
      Math.ceil(
        (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
          86400000,
      ),
    );
  }, [trip.endDate, trip.startDate]);

  const destination = trip.destinations[0] || "";
  const distance = Math.max(0, trip.routeDistanceKm || 0);
  const mileage = Math.max(1, trip.mileage || 1);
  const fuelPrice = Math.max(0, trip.fuelPrice || 0);

  const vehicleType = useMemo(() => {
    const normalized = trip.vehicleType?.toLowerCase() || "car";
    if (normalized.includes("bike") || normalized.includes("2")) return "twoWheeler";
    if (normalized.includes("hatch")) return "hatchback";
    if (normalized.includes("sedan")) return "sedan";
    if (normalized.includes("suv")) return "suv";
    if (normalized.includes("tempo") || normalized.includes("van")) return "tempo";
    if (normalized.includes("electric") || normalized.includes("ev")) return "electric";
    return "sedan";
  }, [trip.vehicleType]);

  const tollVehicleType = useMemo(() => {
    if (vehicleType === "twoWheeler") return "twoWheeler";
    if (vehicleType === "tempo") return "tempo";
    if (vehicleType === "suv") return "suv";
    return "car";
  }, [vehicleType]);

  const budgetType = useMemo(() => {
    const selected = trip.genres.map((genre) => genre.toLowerCase());
    if (selected.some((genre) => genre.includes("budget"))) return "budget";
    if (selected.some((genre) => genre.includes("luxury"))) return "luxury";
    return "mid";
  }, [trip.genres]);

  useEffect(() => {
    if (!trip.startLocation || !destination) {
      setTollCost(0);
      return;
    }

    const controller = new AbortController();
    const fetchToll = async () => {
      setLoadingToll(true);
      try {
        const response = await fetch(`${API_BASE}/api/toll-estimate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startLocation: trip.startLocation,
            destinations: [destination],
            vehicleType: tollVehicleType,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch toll estimate");
        }

        const payload = (await response.json()) as TollEstimateResponse;
        const computedDistance = payload.breakdown.reduce(
          (sum, row) => sum + (Number(row.distanceKm) || 0),
          0,
        );

        setTollCost(payload.estimatedToll || 0);
        updateTrip("routeToll", payload.estimatedToll || 0);
        if (computedDistance > 0 && (!trip.routeDistanceKm || trip.routeDistanceKm <= 0)) {
          updateTrip("routeDistanceKm", Number(computedDistance.toFixed(1)));
        }
      } catch {
        if (!controller.signal.aborted) {
          setTollCost(trip.routeToll || 0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingToll(false);
        }
      }
    };

    fetchToll();

    return () => controller.abort();
  }, [destination, tollVehicleType, trip.routeDistanceKm, trip.routeToll, trip.startLocation, updateTrip]);

  useEffect(() => {
    if (!destination) {
      setHotelCost(0);
      return;
    }

    const controller = new AbortController();
    const fetchHotel = async () => {
      setLoadingHotel(true);
      try {
        const response = await fetch(`${API_BASE}/api/predict-hotel-cost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            checkIn: trip.startDate,
            checkOut: trip.endDate,
            members: trip.numberOfMembers,
            budgetType,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch hotel estimate");
        }

        const payload = await response.json();
        setHotelCost(Number(payload.totalCost) || 0);
      } catch {
        if (!controller.signal.aborted) {
          setHotelCost(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHotel(false);
        }
      }
    };

    fetchHotel();

    return () => controller.abort();
  }, [budgetType, destination, trip.endDate, trip.numberOfMembers, trip.startDate]);

  useEffect(() => {
    if (!destination) {
      setPlacesCost(0);
      return;
    }

    const controller = new AbortController();
    const fetchPlacesCost = async () => {
      setLoadingPlaces(true);
      try {
        const response = await fetch(
          `${API_BASE}/get-destination-places?destination=${encodeURIComponent(destination)}&limit=20`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Failed to fetch destination places");
        }

        const payload = (await response.json()) as DestinationPlacesResponse;
        const range =
          budgetType === "budget"
            ? payload.destinationMeta?.budgetActivitiesRange
            : budgetType === "luxury"
              ? payload.destinationMeta?.luxuryActivitiesRange
              : payload.destinationMeta?.midActivitiesRange ||
                payload.destinationMeta?.budgetActivitiesRange;

        const averagePerPersonPerDay =
          range && Number.isFinite(range[0]) && Number.isFinite(range[1])
            ? (range[0] + range[1]) / 2
            : 0;

        const visitingDays = Math.max(1, days);
        const members = Math.max(1, trip.numberOfMembers || 1);
        const totalActivitiesCost = Math.round(
          averagePerPersonPerDay * visitingDays * members,
        );

        setPlacesCost(totalActivitiesCost);
      } catch {
        if (!controller.signal.aborted) {
          setPlacesCost(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPlaces(false);
        }
      }
    };

    fetchPlacesCost();

    return () => controller.abort();
  }, [budgetType, days, destination, trip.numberOfMembers]);

  const fuelCost = calculateFuelCost(distance, mileage, fuelPrice, 1.15);
  const foodCost = calculateFoodCost(trip.numberOfMembers || 1, days, 500);
  const total = fuelCost + tollCost + hotelCost + foodCost + placesCost + misc;
  const perPerson = total / Math.max(1, trip.numberOfMembers || 1);
  const co2kg = calculateCO2(distance, vehicleType);
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
        places: placesCost,
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
      places: placesCost,
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
                <Label>Distance (km) from route</Label>
                <Input type="number" value={distance} readOnly />
              </div>
              <div>
                <Label>Mileage (km/l or km/kWh)</Label>
                <Input type="number" value={mileage} readOnly />
              </div>
              <div>
                <Label>Fuel Price (live/default)</Label>
                <Input type="number" value={fuelPrice} readOnly />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Input value={trip.vehicleType || "car"} readOnly />
              </div>
              <div>
                <Label>Hotel Cost (predicted)</Label>
                <Input type="number" value={hotelCost} readOnly />
              </div>
              <div>
                <Label>Places Visiting Cost</Label>
                <Input type="number" value={placesCost} readOnly />
              </div>
              <div>
                <Label>Miscellaneous</Label>
                <Input type="number" value={misc} onChange={(e) => setMisc(Number(e.target.value || 0))} />
              </div>
              <div>
                <Label>Toll (estimated)</Label>
                <Input type="number" value={tollCost} readOnly />
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Cost inputs are auto-fetched from the selected route, destination, and tourism dataset.</p>
              <p>
                {loadingToll ? "Updating toll... " : ""}
                {loadingHotel ? "Updating hotel... " : ""}
                {loadingPlaces ? "Updating places..." : ""}
              </p>
            </div>

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
            <p className="flex justify-between"><span>Places</span><span>{formatINR(placesCost)}</span></p>
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
