import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TripType = "solo" | "family" | "group";
export type TripMood =
  | "Adventure"
  | "Pilgrimage"
  | "Nature"
  | "Heritage"
  | "Food"
  | "Beach";

export type TripItinerarySlot = {
  id: string;
  title: string;
  lat?: number;
  lng?: number;
};

export type TripItineraryDay = {
  day: number;
  morning: TripItinerarySlot;
  afternoon: TripItinerarySlot;
  evening: TripItinerarySlot;
  hotelName?: string;
  hotelCost?: number;
};

export type TripDraft = {
  tripType: TripType;
  startDate: string;
  endDate: string;
  numberOfMembers: number;
  startLocation: string;
  vehicleType: string;
  fuelType: string;
  fuelPrice: number;
  mileage: number;
  routeDistanceKm: number;
  routeToll: number;
  moods: TripMood[];
  genres: string[];
  destinations: string[];
  itinerary: TripItineraryDay[];
  costBreakdown: {
    fuel: number;
    toll: number;
    hotel: number;
    food: number;
    places: number;
    misc: number;
    total: number;
    perPerson: number;
  };
  budgetCap: number;
  routePriority: "fastest" | "toll-free" | "eco-friendly";
  lodgingType: string[];
};

type TripContextValue = {
  trip: TripDraft;
  setTrip: React.Dispatch<React.SetStateAction<TripDraft>>;
  updateTrip: <K extends keyof TripDraft>(key: K, value: TripDraft[K]) => void;
  resetTrip: () => void;
};

const DEFAULT_TRIP: TripDraft = {
  tripType: "solo",
  startDate: "",
  endDate: "",
  numberOfMembers: 1,
  startLocation: "",
  vehicleType: "car",
  fuelType: "petrol",
  fuelPrice: 102,
  mileage: 15,
  routeDistanceKm: 0,
  routeToll: 0,
  moods: [],
  genres: ["Budget"],
  destinations: [],
  itinerary: [],
  costBreakdown: {
    fuel: 0,
    toll: 0,
    hotel: 0,
    food: 0,
    places: 0,
    misc: 0,
    total: 0,
    perPerson: 0,
  },
  budgetCap: 50000,
  routePriority: "fastest",
  lodgingType: [],
};

const TripContext = createContext<TripContextValue | null>(null);

const TRIP_STORAGE_KEY = "tourenvi.trip.draft.v1";

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [trip, setTrip] = useState<TripDraft>(() => {
    try {
      const raw = localStorage.getItem(TRIP_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_TRIP;
      }
      return { ...DEFAULT_TRIP, ...JSON.parse(raw) } as TripDraft;
    } catch {
      return DEFAULT_TRIP;
    }
  });

  useEffect(() => {
    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  const value = useMemo<TripContextValue>(
    () => ({
      trip,
      setTrip,
      updateTrip: (key, valueForKey) => {
        setTrip((prev) => ({ ...prev, [key]: valueForKey }));
      },
      resetTrip: () => setTrip(DEFAULT_TRIP),
    }),
    [trip],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error("useTrip must be used within TripProvider");
  }
  return ctx;
};
