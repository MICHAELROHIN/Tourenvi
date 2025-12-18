import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Leaf, MapPin } from "lucide-react";
import HeroVideo from "./HeroVideo";
import { useState } from "react";

const GetStarted = () => {
  const [started, setStarted] = useState(false);
  const [travelType, setTravelType] = useState<string>("");
  const [preference, setPreference] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [days, setDays] = useState<number | "">("");
  const [pace, setPace] = useState<string>("");

  const onDatesChange = (s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
    if (s && e) {
      const sd = new Date(s);
      const ed = new Date(e);
      const diff =
        Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (!isNaN(diff) && diff > 0) setDays(diff);
    }
  };

  return (
    <section id="get-started" className="mt-16 py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          {/* Left: Video 3/4 with overlayed hero text */}
          <div className="relative lg:col-span-3 rounded-xl overflow-hidden border border-border shadow-card">
            <HeroVideo />
            {/* Overlay content */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
              <div className="inline-flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-border shadow-card">
                <Leaf className="w-4 h-4 text-eco-green" />
                <span className="text-sm font-medium text-foreground">
                  Sustainable Travel Planning
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                Smart Travel,
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {" "}
                  Sustainable Future
                </span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-3xl leading-relaxed">
                Plan your perfect trip with AI-powered cost estimation,
                eco-friendly route optimization, and personalized
                recommendations that care for both your wallet and the planet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
                <Button
                  className="px-6 py-4 text-base shadow-hero hover:shadow-xl"
                  onClick={() => setStarted(true)}
                >
                  Start Planning Your Trip
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-4 text-base bg-background/90 backdrop-blur-sm border-2"
                >
                  Watch Demo
                </Button>
              </div>
              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
                <div className="flex items-center justify-center space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-card border border-border">
                  <span className="text-primary text-xl font-bold">$</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">
                      Cost Estimation
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Precise trip budgeting
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-card border border-border">
                  <MapPin className="w-6 h-6 text-accent" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">
                      Smart Routes
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Optimized pathfinding
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-4 shadow-card border border-border">
                  <Leaf className="w-6 h-6 text-eco-green" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">
                      Eco-Friendly
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Sustainable travel
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Panel 1/4 */}
          <div className="lg:col-span-1">
            <Card className="h-full shadow-card">
              {!started ? (
                <>
                  <CardHeader>
                    <div className="inline-flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 mb-4 border border-border">
                      <Leaf className="w-4 h-4 text-eco-green" />
                      <span className="text-xs font-medium text-foreground">
                        Sustainable Travel Planning
                      </span>
                    </div>
                    <CardTitle className="text-3xl leading-tight">
                      Smart Travel,
                      <span className="bg-gradient-hero bg-clip-text text-transparent">
                        {" "}
                        Sustainable Future
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-3">
                      Plan your perfect trip with AI-powered cost estimation,
                      eco-friendly route optimization, and personalized
                      recommendations that care for both your wallet and the
                      planet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button
                        className="w-full px-6 py-4 text-base shadow-hero hover:shadow-xl"
                        onClick={() => setStarted(true)}
                      >
                        Get Started
                      </Button>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-start space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-4 border border-border">
                          <span className="text-primary">$</span>
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground">
                              Cost Estimation
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Precise trip budgeting
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-start space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-4 border border-border">
                          <MapPin className="w-6 h-6 text-accent" />
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground">
                              Smart Routes
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Optimized pathfinding
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-start space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-4 border border-border">
                          <Leaf className="w-6 h-6 text-eco-green" />
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground">
                              Eco-Friendly
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Sustainable travel
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader>
                    <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Destination
                      </span>
                    </div>
                    <CardTitle>Select destination and dates</CardTitle>
                    <CardDescription>
                      Search and set trip dates; pace defines your daily plan
                      intensity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Onboarding controls become visible only after Get Started */}
                    <div>
                      <Label>Travel Type</Label>
                      <Select value={travelType} onValueChange={setTravelType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose solo/family/business" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quick Preference</Label>
                      <ToggleGroup
                        type="single"
                        value={preference}
                        onValueChange={setPreference}
                        className="mt-1"
                      >
                        <ToggleGroupItem value="eco" aria-label="Eco-Friendly">
                          Eco-Friendly
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="budget"
                          aria-label="Budget-Friendly"
                        >
                          Budget-Friendly
                        </ToggleGroupItem>
                        <ToggleGroupItem value="premium" aria-label="Premium">
                          Premium
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    <div>
                      <Label>Destination</Label>
                      <Input
                        placeholder="Search or enter destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) =>
                            onDatesChange(e.target.value, endDate)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) =>
                            onDatesChange(startDate, e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Number of Days</Label>
                      <Input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value) || "")}
                        placeholder="Auto-calculated"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Trip Pace</Label>
                      <Select onValueChange={setPace}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Relaxed / Medium / Intense" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relaxed">Relaxed</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="intense">Intense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        // For now just scroll to destination chooser section if present
                        const el = document.querySelector(
                          "#locgenie"
                        ) as HTMLElement | null;
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      disabled={!destination || !days || !pace}
                    >
                      Save & Continue
                    </Button>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetStarted;
