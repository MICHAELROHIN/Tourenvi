import { useState } from "react";
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
import { Sparkles, MapPin } from "lucide-react";

const moods = [
  "Adventure",
  "Relaxation",
  "Cultural.scenary",
  "urban life",
  "Romantic",
  "Water activity",
];

const DestinationChooser = () => {
  const [primary, setPrimary] = useState<string>("");
  const [secondary, setSecondary] = useState<string>("none");
  const [result, setResult] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFind = async () => {
    if (!primary) {
      setResult("Please choose a Primary option.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const moods = [primary];
    if (secondary !== "none") {
      moods.push(secondary);
    }

    try {
      const response = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moods }),
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

  return (
    <section id="locgenie" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Loc-GENIE</span>
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

              <div className="flex items-center space-x-4">
                <Button
                  size="lg"
                  onClick={handleFind}
                  className="flex items-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Destinations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPrimary("");
                    setSecondary("none");
                    setResult(null);
                    setRecommendations([]);
                    setError(null);
                  }}
                >
                  Reset
                </Button>
              </div>

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
                    {result}
                  </p>
                  <div className="grid gap-2">
                    {recommendations.map((place, index) => (
                      <div
                        key={place}
                        className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-primary font-medium">
                            #{index + 1}
                          </span>
                          <span className="text-foreground">{place}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DestinationChooser;
