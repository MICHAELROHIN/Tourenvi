import { useEffect, useMemo, useState } from "react";
import DestinationChooser from "@/components/DestinationChooser";
import RoutePlanner from "@/components/RoutePlanner";
import { useTrip } from "@/context/TripContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin } from "lucide-react";

type DestinationPlace = {
  id: string;
  name: string;
  category: string;
  entryFee: string;
  entryFeeAmount: number | null;
};

type DestinationMeta = {
  destinationName: string | null;
  budgetActivitiesRange: [number, number] | null;
  midActivitiesRange: [number, number] | null;
  luxuryActivitiesRange: [number, number] | null;
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();

const DestinationStep = () => {
  const { trip, updateTrip } = useTrip();
  const [places, setPlaces] = useState<DestinationPlace[]>([]);
  const [meta, setMeta] = useState<DestinationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDestination = trip.destinations[0] || "";

  useEffect(() => {
    const fromStorage = (localStorage.getItem("tourenvi:selectedDestination") || "").trim();
    if (!selectedDestination && fromStorage) {
      updateTrip("destinations", [fromStorage]);
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ destination?: string }>;
      const nextDestination = (customEvent.detail?.destination || "").trim();
      if (nextDestination) {
        updateTrip("destinations", [nextDestination]);
      }
    };

    const destinationEvent = "tourenvi:setDestination";
    window.addEventListener(destinationEvent, handler as EventListener);
    return () => {
      window.removeEventListener(destinationEvent, handler as EventListener);
    };
  }, [selectedDestination, updateTrip]);

  useEffect(() => {
    if (!selectedDestination) {
      setPlaces([]);
      setMeta(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/get-destination-places?destination=${encodeURIComponent(selectedDestination)}&limit=12`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            payload.error || "Failed to fetch destination places.",
          );
        }

        const payload = await response.json();
        setPlaces(Array.isArray(payload.places) ? payload.places : []);
        setMeta(payload.destinationMeta || null);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPlaces([]);
        setMeta(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load destination places right now.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPlaces();

    return () => controller.abort();
  }, [selectedDestination]);

  const estimatedTicketPerPerson = useMemo(() => {
    const useBudget = trip.genres.some((genre) => genre.toLowerCase().includes("budget"));
    const useLuxury = trip.genres.some((genre) => genre.toLowerCase().includes("luxury"));

    const range = useBudget
      ? meta?.budgetActivitiesRange
      : useLuxury
        ? meta?.luxuryActivitiesRange
        : meta?.midActivitiesRange || meta?.budgetActivitiesRange;

    if (!range) return null;
    return Math.round((range[0] + range[1]) / 2);
  }, [meta, trip.genres]);

  return (
    <div className="space-y-6">
      <DestinationChooser />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Destination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <MapPin className="w-3 h-3 mr-1" />
              {selectedDestination || "No destination selected yet"}
            </Badge>
            {estimatedTicketPerPerson !== null ? (
              <Badge variant="outline">
                Estimated activities per person/day: INR {estimatedTicketPerPerson}
              </Badge>
            ) : null}
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Fetching places from tourism dataset...
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error && places.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {places.map((place) => (
                <div key={place.id} className="rounded-md border p-3 bg-background">
                  <p className="font-medium text-sm leading-snug">{place.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{place.category}</p>
                  <p className="text-xs mt-2">Entry: {place.entryFee || "Not specified"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <RoutePlanner
        initialOrigin={trip.startLocation}
        initialDestination={selectedDestination}
        autoPlanOnPrefill
        hideHeader
        onRouteComputed={({ distanceKm, tollCost }) => {
          updateTrip("routeDistanceKm", distanceKm);
          updateTrip("routeToll", tollCost);
        }}
      />
    </div>
  );
};

export default DestinationStep;
