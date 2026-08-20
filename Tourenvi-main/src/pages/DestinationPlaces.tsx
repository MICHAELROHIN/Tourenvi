import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  IndianRupee,
  Loader2,
  MapPin,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DestinationPlace {
  id: string;
  name: string;
  category: string;
  openStatus: string;
  operationalStatus: string;
  entryFee: string;
  entryFeeAmount: number | null;
  entryFeeCurrency: string;
  source: string;
  imageUrl?: string;
  description?: string;
}

interface DestinationMeta {
  destinationName: string | null;
  state: string | null;
  district: string | null;
  region: string | null;
  accessibility: string | null;
  popularityScore: number | null;
  bestSeasons: string[];
  avoidSeasons: string[];
  peakTouristSeason: string | null;
  offSeason: string | null;
  minimumDays: number | null;
  idealDays: number | null;
  maximumDays: number | null;
  permitsRequired: boolean;
  permitsDetails: string | null;
  nearestAirport: { name: string; distance_km: number } | null;
  nearestRailwayStation: { name: string; distance_km: number | null } | null;
  nearestMajorCity: { name: string; distance_km: number } | null;
  budgetDailyRange: [number, number] | null;
  midDailyRange: [number, number] | null;
  luxuryDailyRange: [number, number] | null;
  foodScene: string | null;
  specialConsiderations: string | null;
  uniqueExperiences: string | null;
  suggestedItinerary: string | null;
  safetyRating: number | null;
  safetyNotes: string | null;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();

const DestinationPlaces = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [places, setPlaces] = useState<DestinationPlace[]>([]);
  const [totalPlaces, setTotalPlaces] = useState<number>(0);
  const [destinationMeta, setDestinationMeta] = useState<DestinationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorSuggestions, setErrorSuggestions] = useState<string[]>([]);

  const destination = useMemo(() => {
    const fromQuery = (searchParams.get("destination") || "").trim();
    if (fromQuery) return fromQuery;
    return (localStorage.getItem("tourenvi:selectedDestination") || "").trim();
  }, [searchParams]);

  useEffect(() => {
    if (!destination) return;

    localStorage.setItem("tourenvi:selectedDestination", destination);

    const controller = new AbortController();
    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      setErrorSuggestions([]);

      try {
        const response = await fetch(
          `${API_BASE}/get-destination-places?destination=${encodeURIComponent(destination)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const suggestions = Array.isArray(errData.suggestions)
            ? errData.suggestions.filter((item: unknown) => typeof item === "string")
            : [];
          setErrorSuggestions(suggestions);
          setPlaces([]);
          setTotalPlaces(0);
          setDestinationMeta(null);
          throw new Error(
            errData.error || "Failed to fetch places for this destination.",
          );
        }

        const data = await response.json();
        const fetchedPlaces = Array.isArray(data.places)
          ? (data.places as DestinationPlace[])
          : [];
        setPlaces(fetchedPlaces);
        setTotalPlaces(
          Number.isFinite(Number(data.totalPlaces))
            ? Number(data.totalPlaces)
            : fetchedPlaces.length,
        );
        setErrorSuggestions([]);
        setDestinationMeta(
          data.destinationMeta ? (data.destinationMeta as DestinationMeta) : null,
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof TypeError) {
          setErrorSuggestions([]);
          setPlaces([]);
          setTotalPlaces(0);
          setDestinationMeta(null);
          setError(
            `Cannot connect to places service. Start backend with "npm run backend" (API: ${API_BASE}).`,
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to fetch places right now.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchPlaces();

    return () => controller.abort();
  }, [destination]);

  const goToDateSelection = () => {
    if (!destination) return;
    localStorage.setItem("tourenvi:selectedDestination", destination);
    navigate(`/?destination=${encodeURIComponent(destination)}#get-started`);
  };

  const displayedDestination =
    destinationMeta?.destinationName || destination;

  const formatDistanceLabel = (
    place: { name: string; distance_km: number | null } | null,
  ) => {
    if (!place || !place.name) return "Not specified";
    if (place.distance_km === null || !Number.isFinite(place.distance_km)) {
      return place.name;
    }
    return `${place.name} (${place.distance_km} km)`;
  };

  const formatBudgetRange = (range: [number, number] | null) => {
    if (!range) return "Not specified";
    return `INR ${range[0]} - INR ${range[1]}`;
  };

  return (
    <div className="min-h-screen bg-background mt-16 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="shadow-card border border-border">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl md:text-3xl">
                    Places To Visit
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm md:text-base">
                    {destination
                      ? `Showing ${totalPlaces || places.length} places from india_tourism_dataset for ${displayedDestination}.`
                      : "Choose a destination first, then come here to see places from the dataset."}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/#locgenie">Back to Destination Genie</Link>
                  </Button>
                  <Button onClick={goToDateSelection} disabled={!destination}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {!destination ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  No destination selected. Pick a destination from Destination Genie, then open this page.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {loading ? (
            <Card>
              <CardContent className="p-8 flex items-center justify-center text-primary">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading destination places from dataset...
              </CardContent>
            </Card>
          ) : null}

          {error ? (
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-destructive space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
                {errorSuggestions.length > 0 ? (
                  <div className="pt-1">
                    <p className="text-sm text-foreground mb-2">
                      Try one of these available dataset destinations:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {errorSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            localStorage.setItem("tourenvi:selectedDestination", suggestion);
                            navigate(
                              `/destination-places?destination=${encodeURIComponent(suggestion)}`,
                            );
                          }}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {!loading && !error && destination && places.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">
                No places found for this destination.
              </CardContent>
            </Card>
          ) : null}

          {!loading && !error && destinationMeta ? (
            <Card className="border border-border">
              <CardContent className="p-4 md:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">State</p>
                    <p className="font-medium">{destinationMeta.state || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Region</p>
                    <p className="font-medium">{destinationMeta.region || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">District</p>
                    <p className="font-medium">{destinationMeta.district || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Accessibility</p>
                    <p className="font-medium">{destinationMeta.accessibility || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Best Seasons</p>
                    <p className="font-medium">
                      {destinationMeta.bestSeasons.length > 0
                        ? destinationMeta.bestSeasons.join(", ")
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ideal Days</p>
                    <p className="font-medium">
                      {destinationMeta.minimumDays && destinationMeta.maximumDays
                        ? `${destinationMeta.minimumDays} to ${destinationMeta.maximumDays} days`
                        : destinationMeta.idealDays
                          ? `${destinationMeta.idealDays} days`
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Popularity Score</p>
                    <p className="font-medium">
                      {destinationMeta.popularityScore ?? "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nearest Airport</p>
                    <p className="font-medium">{formatDistanceLabel(destinationMeta.nearestAirport)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nearest Railway Station</p>
                    <p className="font-medium">{formatDistanceLabel(destinationMeta.nearestRailwayStation)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nearest Major City</p>
                    <p className="font-medium">{formatDistanceLabel(destinationMeta.nearestMajorCity)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Budget Daily Range</p>
                    <p className="font-medium">{formatBudgetRange(destinationMeta.budgetDailyRange)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mid Daily Range</p>
                    <p className="font-medium">{formatBudgetRange(destinationMeta.midDailyRange)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Luxury Daily Range</p>
                    <p className="font-medium">{formatBudgetRange(destinationMeta.luxuryDailyRange)}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Permits</p>
                    <p className="font-medium">
                      {destinationMeta.permitsRequired
                        ? destinationMeta.permitsDetails || "Permit required"
                        : "Not required"}
                    </p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Unique Experiences</p>
                    <p className="font-medium">
                      {destinationMeta.uniqueExperiences || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!loading && !error && places.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {places.map((place) => (
                <Card key={place.id} className="overflow-hidden border border-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  {place.imageUrl ? (
                    <div className="relative h-52 w-full overflow-hidden">
                      <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gt-blue">
                          {place.category}
                        </span>
                        <h3 className="mt-2 text-2xl font-serif font-semibold text-white drop-shadow-sm leading-tight">
                          {place.name}
                        </h3>
                      </div>
                    </div>
                  ) : null}
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div>
                        {!place.imageUrl ? (
                          <>
                            <h3 className="font-semibold text-foreground leading-tight">
                              {place.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {place.category}
                            </p>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {place.description ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {place.description}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {place.openStatus}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground">
                        <IndianRupee className="w-3 h-3 mr-1" />
                        {place.entryFee}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {place.operationalStatus}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Source: {place.source}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button onClick={goToDateSelection} disabled={!destination}>
              <CalendarDays className="w-4 h-4 mr-1" />
              Next: Pick Date Range
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationPlaces;
