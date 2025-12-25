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
import { Leaf, MapPin, Calendar as CalendarIcon } from "lucide-react";
import HeroVideo from "./HeroVideo";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const GetStarted = () => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [travelType, setTravelType] = useState<string>("");
  const [preference, setPreference] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [days, setDays] = useState<number | "">("");
  const [pace, setPace] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [highlightDest, setHighlightDest] = useState(false);

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

  // Update derived values when selecting a range from the calendar
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      const sd = dateRange.from;
      const ed = dateRange.to;
      const diff =
        Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setStartDate(sd.toISOString().slice(0, 10));
      setEndDate(ed.toISOString().slice(0, 10));
      if (!isNaN(diff) && diff > 0) setDays(diff);
    }
  }, [dateRange]);

  // Listen for selected destination from Destination Genie
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ destination?: string }>;
      const d = ce?.detail?.destination;
      if (d) {
        setStarted(true);
        setDestination(d);
        setHighlightDest(true);
        setTimeout(() => setHighlightDest(false), 1200);
        const el = document.querySelector("#get-started") as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("tourenvi:setDestination" as any, handler as any);
    return () =>
      window.removeEventListener(
        "tourenvi:setDestination" as any,
        handler as any
      );
  }, []);

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
            <Card className="h-full shadow-card shadow-2xl rounded-[50px] border border-border max-w-sm lg:max-w-md mx-auto">
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
                    <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1 ">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Destination & Date
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Onboarding controls become visible only after Get Started */}
                    <div>
                      <Label>Travel Type</Label>
                      <Select value={travelType} onValueChange={setTravelType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose your travel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Destination</Label>
                      <Input
                        placeholder="Search or enter destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className={`mt-1 ${
                          highlightDest
                            ? "ring-2 ring-primary/60 transition-shadow"
                            : ""
                        }`}
                      />
                      <div className="mt-2 flex">
                        <Button asChild variant="outline" className="w-full">
                          <a href="#locgenie">Choose according to your mood</a>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Dates</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal mt-1"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from && dateRange.to ? (
                              <span>
                                {format(dateRange.from, "MMM d")} -{" "}
                                {format(dateRange.to, "MMM d, yyyy")}
                              </span>
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="p-0 w-[18rem] sm:w-[22rem]"
                        >
                          <Calendar
                            mode="range"
                            selected={dateRange as any}
                            onSelect={(range) => setDateRange(range ?? {})}
                            numberOfMonths={1}
                          />
                        </PopoverContent>
                      </Popover>
                      {days ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Trip length: {days} day(s)
                        </p>
                      ) : null}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!destination || !startDate || !endDate) return;
                        const url = `/hotels?destination=${encodeURIComponent(
                          destination
                        )}&checkIn=${encodeURIComponent(
                          startDate
                        )}&checkOut=${encodeURIComponent(endDate)}`;
                        navigate(url);
                      }}
                      disabled={!destination || !days}
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
