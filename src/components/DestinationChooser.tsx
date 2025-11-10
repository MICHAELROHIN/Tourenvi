// DestinationChooser.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- 1. Import useNavigate
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, MapPin } from "lucide-react"; // <-- Removed Hotel, Star

// --- 2. REMOVED Hotel interface ---

const moods = [
  "Adventure",
  "Relaxation",
  "Culture/History",
  "scenary",
  "Urban Life",
  "Romantic",
  "Water activity",
];

const DestinationChooser = () => {
  const navigate = useNavigate(); // <-- 3. Initialize navigate

  // --- State for recommendations ---
  const [primary, setPrimary] = useState<string>("");
  const [secondary, setSecondary] = useState<string>("none");
  const [result, setResult] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 4. REMOVED all hotel state (selectedDestination, hotels, isHotelLoading, hotelError) ---

  const handleFind = async () => {
    if (!primary) {
      setResult("Please choose a Primary option.");
      return;
    }

    // --- 5. REMOVED resetHotelState() call ---
    setIsLoading(true);
    setError(null);
    setRecommendations([]); // Clear old recommendations

    const moodsList = [primary];
    if (secondary !== "none") {
      moodsList.push(secondary);
    }

    try {
      const response = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moods: moodsList }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setResult("Here are your recommended destinations:");
    } catch (err) {
      setError("Failed to get recommendations. Please try again.");
      console.error("Error fetching recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. REPLACED function to navigate ---
  const handleDestinationClick = (destination: string) => {
    navigate(`/hotels?destination=${encodeURIComponent(destination)}`);
  };

  // --- 7. REMOVED resetHotelState helper ---

  // --- 8. UPDATED reset all helper ---
  const handleResetAll = () => {
    setPrimary("");
    setSecondary("none");
    setResult(null);
    setRecommendations([]);
    setError(null);
    // REMOVED resetHotelState() call
  };

  return (
    <section id="locgenie" className="py-20">
      <div className="container mx-auto px-4">
        {/* --- Header (No Changes) --- */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Destination-GENIE
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Find destinations tailored to your mood
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your mood to travel below — choose a Primary option and an
            optional Secondary option to refine suggestions.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Destination Chooser</span>
              </CardTitle>
              <CardDescription>
                Pick the moods that match the trip you want and we'll suggest
                destinations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* --- Mood Selection (No Changes) --- */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Enter your mood to travel
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Primary option</Label>
                  <Select
                    value={primary}
                    onValueChange={(value) => setPrimary(value)}
                  >
                    <SelectTrigger id="primary">
                      <SelectValue placeholder="Choose primary mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary">Secondary option</Label>
                  <Select
                    value={secondary}
                    onValueChange={(value) => setSecondary(value)}
                  >
                    <SelectTrigger id="secondary">
                      <SelectValue placeholder="Optional secondary mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {moods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* --- Buttons (Updated Reset) --- */}
              <div className="flex items-center space-x-4">
                <Button
                  size="lg"
                  onClick={handleFind}
                  className="flex items-center"
                  disabled={isLoading}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isLoading ? "Finding..." : "Find Destinations"}
                </Button>
                <Button variant="outline" onClick={handleResetAll}>
                  Reset
                </Button>
              </div>

              {/* --- 9. UPDATED Results Section --- */}
              {isLoading ? (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground">
                    Finding perfect destinations for you...
                  </p>
                </div>
              ) : error ? (
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">
                    {result} (Click a destination to see hotels on a new page)
                  </p>
                  <div className="grid gap-2">
                    {recommendations.map((place, index) => (
                      <button
                        key={place}
                        onClick={() => handleDestinationClick(place)}
                        className={`p-4 bg-muted/50 rounded-lg flex items-center justify-between text-left w-full hover:bg-primary/10 hover:ring-2 hover:ring-primary transition-all`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-primary font-medium">
                            #{index + 1}
                          </span>
                          <span className="text-foreground font-medium">
                            {place}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* --- 10. REMOVED Hotel Results Section --- */}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DestinationChooser;