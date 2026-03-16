import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroVideo from "./HeroVideo";

const Hero = () => {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [tripType, setTripType] = useState<"solo" | "family" | "group">("solo");
  const [from, setFrom] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [members, setMembers] = useState(1);
  const [vehicle, setVehicle] = useState("hatchback");
  const [moods, setMoods] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 30);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (tripType === "solo") {
      setMembers(1);
    } else if (members < 2) {
      setMembers(2);
    }
  }, [tripType, members]);

  const sendToSection = (sectionId: string) => {
    if (window.location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const quickDaysNights = useMemo(() => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const ms = end.getTime() - start.getTime();
    const days =
      Number.isFinite(ms) && ms >= 0
        ? Math.max(1, Math.round(ms / 86400000) + 1)
        : 1;
    const nights = Math.max(0, days - 1);
    return `${days} days, ${nights} nights`;
  }, [startDate, endDate]);

  const distanceKm = 200;
  const fuelPrice = 102;

  const mileageByVehicle: Record<string, number> = {
    twoWheeler: 45,
    hatchback: 18,
    sedan: 18,
    suv: 12,
    tempo: 10,
    bus: 4,
  };

  const fuelCost = useMemo(() => {
    const mileage = mileageByVehicle[vehicle] ?? 18;
    return Math.round((distanceKm / mileage) * fuelPrice);
  }, [vehicle]);

  const hotelPerNight = 1200;
  const foodPerPersonPerDay = 500;

  const totalEstimate = useMemo(() => {
    const days = quickDaysNights
      ? Math.max(1, Number.parseInt(quickDaysNights.split(" ")[0] ?? "1", 10))
      : 2;
    const nights = Math.max(1, days - 1);
    const travelerCount = tripType === "solo" ? 1 : Math.max(2, members);
    const foodTotal = travelerCount * days * foodPerPersonPerDay;
    return fuelCost + 180 + nights * hotelPerNight + foodTotal;
  }, [fuelCost, members, quickDaysNights, tripType]);

  const moodOptions = [
    "🏔️ Trek",
    "🏖️ Beach",
    "🌿 Nature",
    "🏛️ Heritage",
    "🍜 Food",
    "🕌 Pilgrim",
  ];

  const featureCards = [
    {
      icon: "🤖",
      iconClass: "text-green-400",
      title: "AI Trip Planner",
      subtitle: "Mood-based smart routes",
      onClick: () => navigate("/trip/new"),
    },
    {
      icon: "⛽",
      iconClass: "text-amber-400",
      title: "Fuel + Toll",
      subtitle: "FASTag API supported",
      onClick: () => navigate("/trip/new#cost"),
    },
    {
      icon: "🗺️",
      iconClass: "text-blue-400",
      title: "Offline Maps",
      subtitle: "Works in low network",
      onClick: () => navigate("/map"),
    },
    {
      icon: "⭐",
      iconClass: "text-yellow-300",
      title: "Hidden Gems",
      subtitle: "Verified local spots",
      onClick: () => navigate("/attractions"),
    },
    {
      icon: "👥",
      iconClass: "text-teal-300",
      title: "Live Tracking",
      subtitle: "Geo-fence + member loc",
      onClick: () => navigate("/live"),
    },
    {
      icon: "⚠️",
      iconClass: "text-red-300",
      title: "Danger Alerts",
      subtitle: "Wildlife zone warnings",
      onClick: () => sendToSection("danger"),
    },
    {
      icon: "🌿",
      iconClass: "text-green-300",
      title: "Eco Score",
      subtitle: "CO2 footprint per trip",
      onClick: () => sendToSection("sustainability"),
    },
    {
      icon: "🏛️",
      iconClass: "text-indigo-300",
      title: "Govt. Data",
      subtitle: "Official tourism connect",
      onClick: () => sendToSection("features"),
    },
    {
      icon: "💬",
      iconClass: "text-purple-300",
      title: "AI Chatbot",
      subtitle: "Trip-aware assistant",
      onClick: () => navigate("/chatAI"),
    },
  ];

  const quickDestinations = ["Goa 🏖️", "Ooty 🌿", "Manali 🏔️", "Jaipur 🏛️"];

  const saveAndContinue = () => {
    const mappedMood: Record<string, string> = {
      "🏔️ Trek": "Adventure",
      "🏖️ Beach": "Beach",
      "🌿 Nature": "Nature",
      "🏛️ Heritage": "Heritage",
      "🍜 Food": "Food",
      "🕌 Pilgrim": "Pilgrimage",
    };

    const draft = {
      tripType,
      from,
      destination,
      startDate,
      endDate,
      members: tripType === "solo" ? 1 : Math.max(2, members),
      vehicle,
      moods,
      mappedMoods: moods.map((mood) => mappedMood[mood]).filter(Boolean),
    };

    localStorage.setItem("tripDraft", JSON.stringify(draft));
    navigate("/trip/new");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <HeroVideo />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
          <div
            className={`flex-1 text-center lg:text-left transition-all duration-700 ${
              isReady ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-border shadow-card">
              <Leaf className="w-4 h-4 text-eco-green" />
              <span className="text-sm font-medium text-foreground">
                Sustainable Travel Planning
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Smart Travel,
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {" "}
                Sustainable Future
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white text-muted-foreground mb-12 max-w-3xl lg:max-w-none mx-auto lg:mx-0 leading-relaxed">
              Plan your perfect trip with AI-powered cost estimation,
              eco-friendly route optimization, and personalized recommendations
              that care for both your wallet and the planet.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
              <Button
                size="lg"
                className="px-8 py-4 text-lg shadow-hero hover:shadow-xl transition-all duration-300"
                onClick={() => navigate("/trip/new")}
              >
                Start Planning Your Trip
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg bg-background/90 backdrop-blur-sm border-2"
              >
                Watch Demo
              </Button>
            </div>

            <p className="text-white/70 text-sm mb-3">
              Everything you need for smart travel
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {featureCards.map((card, index) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.onClick}
                  className={`rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/20 transition cursor-pointer p-3 text-left ${
                    isReady
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                  style={{ transitionDelay: `${100 + index * 100}ms` }}
                >
                  <div className={`text-lg leading-none ${card.iconClass}`}>
                    {card.icon}
                  </div>
                  <p className="text-white font-semibold text-sm mt-2">
                    {card.title}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">
                    {card.subtitle}
                  </p>
                </button>
              ))}
            </div>

            <div
              className={`mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 text-white/80 text-xs transition-all duration-700 ${
                isReady
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
              style={{ transitionDelay: "1100ms" }}
            >
              <span className="pr-3 sm:pr-4 border-r border-white/20">
                50,000+ Trips Planned
              </span>
              <span className="pr-3 sm:pr-4 border-r border-white/20">
                1,200+ Hidden Gems
              </span>
              <span className="pr-3 sm:pr-4 border-r border-white/20">
                ₹2Cr+ Saved
              </span>
              <span>98% Satisfaction</span>
            </div>
          </div>

          <aside
            className={`w-full md:max-w-md lg:max-w-none mx-auto lg:mx-0 lg:w-[360px] lg:shrink-0 lg:sticky lg:top-8 transition-all duration-700 ${
              isReady ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"
            }`}
          >
            <div className="w-[360px] max-w-full bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
              <div>
                <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full w-fit inline-block">
                  🚀 Start Your Trip
                </span>
                <h3 className="text-white text-lg font-bold mt-1">
                  Plan in 2 minutes
                </h3>
                <p className="text-white/60 text-xs">
                  No account needed to get your estimate
                </p>
              </div>

              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Trip Type
                </label>
                <div className="flex gap-2">
                  {(["solo", "family", "group"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTripType(type)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-center capitalize ${
                        tripType === type
                          ? "bg-green-500 text-white"
                          : "bg-white/10 text-white/70 border border-white/20"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  From
                </label>
                <input
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  placeholder="📍 Your starting location"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-green-400 transition"
                />
              </div>

              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Destination
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="🏁 Where are you headed?"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder-white/40 focus:outline-none focus:border-green-400 transition"
                  />
                </div>
                {!destination && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickDestinations.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setDestination(city)}
                        className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-white/20 transition"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Travel Dates
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    placeholder="Start"
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-xs flex-1 focus:outline-none focus:border-green-400 [color-scheme:dark]"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    placeholder="End"
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-xs flex-1 focus:outline-none focus:border-green-400 [color-scheme:dark]"
                  />
                </div>
                {quickDaysNights && (
                  <p className="text-green-300 text-xs mt-1">
                    {quickDaysNights}
                  </p>
                )}
              </div>

              {tripType !== "solo" && (
                <div>
                  <label className="text-white/80 text-xs font-medium mb-1 block">
                    No. of Members
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">
                      👥
                    </span>
                    <input
                      type="number"
                      min={2}
                      value={members}
                      onChange={(event) =>
                        setMembers(
                          Math.max(2, Number(event.target.value || "2")),
                        )
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-green-400 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Vehicle Type
                </label>
                <select
                  value={vehicle}
                  onChange={(event) => setVehicle(event.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value="twoWheeler">🏍️ Two-Wheeler</option>
                  <option value="hatchback">🚗 Hatchback</option>
                  <option value="sedan">🚙 Sedan</option>
                  <option value="suv">🛻 SUV</option>
                  <option value="tempo">🚐 Tempo Traveller</option>
                  <option value="bus">🚌 Bus</option>
                </select>
              </div>

              <div>
                <label className="text-white/80 text-xs font-medium mb-1 block">
                  Travel Mood{" "}
                  <span className="text-white/50">(pick your vibe)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((mood) => {
                    const selected = moods.includes(mood);
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => {
                          setMoods((prev) => {
                            if (prev.includes(mood)) {
                              return prev.filter((item) => item !== mood);
                            }
                            if (prev.length >= 2) return prev;
                            return [...prev, mood];
                          });
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs border cursor-pointer transition-all select-none ${
                          selected
                            ? "border-green-400 bg-green-500/20 text-white"
                            : "bg-white/10 text-white/60 border-white/20"
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {from && destination && (
                <div className="hidden sm:block bg-white/5 rounded-xl p-3 border border-white/10 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in-0">
                  <p className="text-white/80 text-xs font-semibold mb-2">
                    Quick Estimate
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <p className="text-white/70">
                        ⛽ Fuel:{" "}
                        <span className="text-white">
                          ~₹ {fuelCost.toLocaleString("en-IN")}
                        </span>
                      </p>
                      <p className="text-white/70">
                        🛣️ Toll: <span className="text-white">~₹ 180</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/70">
                        🏨 Hotel/night:{" "}
                        <span className="text-white">~₹ 1,200</span>
                      </p>
                      <p className="text-white/70">
                        🍴 Food/day:{" "}
                        <span className="text-white">~₹ 500/person</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-green-400 font-bold text-sm mt-2">
                    Total estimate: ~₹ {totalEstimate.toLocaleString("en-IN")}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    * Rough estimate. Get exact cost in trip builder
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={saveAndContinue}
                className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
              >
                Plan My Trip <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-white/40 text-xs">
                🔒 Free to use · No credit card
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Hero;
