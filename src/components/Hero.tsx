import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroVideo from "./HeroVideo";

const plannerLabelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-foreground/70";

const plannerFieldClass =
  "w-full rounded-xl border border-emerald-100 bg-white/92 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15";

const mileageByVehicle: Record<string, number> = {
  twoWheeler: 45,
  hatchback: 18,
  sedan: 18,
  suv: 12,
  tempo: 10,
  bus: 4,
};

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
      iconClass: "text-green-500",
      title: "AI Trip Planner",
      subtitle: "Mood-based smart routes",
      onClick: () => navigate("/trip/new"),
    },
    {
      icon: "⛽",
      iconClass: "text-amber-500",
      title: "Fuel + Toll",
      subtitle: "FASTag API supported",
      onClick: () => navigate("/trip/new#cost"),
    },
    {
      icon: "🗺️",
      iconClass: "text-sky-500",
      title: "Offline Maps",
      subtitle: "Works in low network",
      onClick: () => navigate("/map"),
    },
    {
      icon: "⭐",
      iconClass: "text-yellow-500",
      title: "Hidden Gems",
      subtitle: "Verified local spots",
      onClick: () => navigate("/attractions"),
    },
    {
      icon: "👥",
      iconClass: "text-teal-500",
      title: "Live Tracking",
      subtitle: "Geo-fence + member loc",
      onClick: () => navigate("/live"),
    },
    {
      icon: "⚠️",
      iconClass: "text-red-500",
      title: "Danger Alerts",
      subtitle: "Wildlife zone warnings",
      onClick: () => sendToSection("danger"),
    },
    {
      icon: "🌿",
      iconClass: "text-green-600",
      title: "Eco Score",
      subtitle: "CO2 footprint per trip",
      onClick: () => sendToSection("sustainability"),
    },
    {
      icon: "🏛️",
      iconClass: "text-indigo-500",
      title: "Govt. Data",
      subtitle: "Official tourism connect",
      onClick: () => sendToSection("features"),
    },
    {
      icon: "💬",
      iconClass: "text-fuchsia-500",
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
    <section className="relative overflow-hidden bg-background pt-24 pb-10 md:pb-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_62%)]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className={`relative overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_30px_90px_-45px_rgba(15,118,110,0.55)] transition-all duration-700 ${
              isReady ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"
            }`}
          >
            <HeroVideo
              className="absolute inset-0 h-full min-h-full aspect-auto"
              videoClassName="scale-[1.03]"
              overlayClassName="bg-[linear-gradient(110deg,rgba(248,250,244,0.9)_0%,rgba(248,250,244,0.6)_38%,rgba(15,23,42,0.2)_100%)]"
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(5,23,31,0.24))]" />

            <div className="relative z-10 flex min-h-[620px] flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                className={`max-w-4xl text-center lg:text-left transition-all duration-700 ${
                  isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
              >
                <div className="inline-flex items-center space-x-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-card backdrop-blur-sm">
                  <Leaf className="w-4 h-4 text-eco-green" />
                  <span className="text-sm font-medium font-serif text-foreground">
                    Sustainable Travel Planning
                  </span>
                </div>

                <h1 className="mt-8 text-2xl font-bold font-serif leading-[0.95] text-foreground sm:text-5xl lg:text-5xl">
                  Smart Travel,
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    {" "}
                    Sustainable Future
                  </span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl font-serif text-base leading-relaxed text-foreground/80 sm:text-xl lg:mx-0 lg:text-md">
                  Plan your perfect trip with AI-powered cost estimation,
                  eco-friendly route optimization, and personalized
                  recommendations that care for both your wallet and the planet.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                  <Button
                    size="lg"
                    className="px-6 py-2 text-sm shadow-hero font-serif hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate("/trip/new")}
                  >
                    Start Planning Your Trip
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  {/* <Button
                    variant="outline"
                    size="lg"
                    className="border-white/80 bg-white/88 px-8 py-4 text-lg text-foreground backdrop-blur-sm"
                  >
                    Watch Demo
                  </Button> */}
                </div>

                <p className="mt-8 text-sm font-serif text-foreground/65">
                  Everything you need for smart travel
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {featureCards.map((card) => (
                    <button
                      key={card.title}
                      type="button"
                      onClick={card.onClick}
                      className={`rounded-2xl border border-white/70 bg-white/60 p-3 text-left shadow-card backdrop-blur-sm transition-all duration-300 hover:bg-white/88 ${
                        isReady
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0"
                      }`}
                    >
                      <div className={`text-lg leading-none ${card.iconClass}`}>
                        {card.icon}
                      </div>
                      <p className="mt-2 text-sm font-serif font-semibold text-foreground">
                        {card.title}
                      </p>
                      <p className="mt-0.5 text-xs font-serif text-muted-foreground">
                        {card.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`mt-6 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-xs text-foreground/70 shadow-card backdrop-blur-sm transition-all duration-700 ${
                  isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="pr-0 sm:pr-4 sm:border-r sm:border-foreground/10">
                    50,000+ Trips Planned
                  </span>
                  <span className="pr-0 sm:pr-4 sm:border-r sm:border-foreground/10">
                    1,200+ Hidden Gems
                  </span>
                  <span className="pr-0 sm:pr-4 sm:border-r sm:border-foreground/10">
                    ₹2Cr+ Saved
                  </span>
                  <span>98% Satisfaction</span>
                </div>
              </div>
            </div>
          </div>

          <aside
            className={`mx-auto w-full max-w-md xl:mx-0 xl:sticky xl:top-24 transition-all duration-700 ${
              isReady ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"
            }`}
          >
            <div className="w-full rounded-[2rem] border border-emerald-100/90 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,118,110,0.65)] backdrop-blur-md">
              <div>
                <span className="inline-flex font-serif w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  🚀 Start Your Trip
                </span>
                <h3 className="mt-2 text-2xl font-serif font-bold text-foreground">
                  Plan in 2 minutes
                </h3>
                <p className="text-sm font-serif text-muted-foreground">
                  No account needed to get your estimate
                </p>
              </div>

              <div className="mt-5">
                <label className={plannerLabelClass}>Trip Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["solo", "family", "group"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTripType(type)}
                      className={`rounded-xl px-3 py-2 text-xs font-serif font-semibold capitalize transition-all ${
                        tripType === type
                          ? "bg-primary text-white shadow-sm"
                          : "border border-emerald-100 bg-emerald-50/70 text-foreground/65 hover:bg-emerald-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className={plannerLabelClass}>From</label>
                <input
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  placeholder="📍 Your starting location"
                  className={plannerFieldClass}
                />
              </div>

              <div className="mt-4">
                <label className={plannerLabelClass}>Destination</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="🏁 Where are you headed?"
                    className={`${plannerFieldClass} pr-9`}
                  />
                </div>
                {!destination && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickDestinations.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setDestination(city)}
                        className="rounded-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-xs text-foreground/70 transition hover:bg-emerald-100/80"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className={plannerLabelClass}>Travel Dates</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    placeholder="Start"
                    className={`${plannerFieldClass} flex-1 px-2 text-xs [color-scheme:light]`}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    placeholder="End"
                    className={`${plannerFieldClass} flex-1 px-2 text-xs [color-scheme:light]`}
                  />
                </div>
                {quickDaysNights && (
                  <p className="mt-1 text-xs text-primary">{quickDaysNights}</p>
                )}
              </div>

              {tripType !== "solo" && (
                <div className="mt-4">
                  <label className={plannerLabelClass}>No. of Members</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground/65">
                      👥
                    </span>
                    <input
                      type="number"
                      min={2}
                      aria-label="Number of members"
                      value={members}
                      onChange={(event) =>
                        setMembers(Math.max(2, Number(event.target.value || "2")))
                      }
                      className={`${plannerFieldClass} pl-8`}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className={plannerLabelClass}>Vehicle Type</label>
                <select
                  aria-label="Vehicle type"
                  value={vehicle}
                  onChange={(event) => setVehicle(event.target.value)}
                  className={`${plannerFieldClass} [&>option]:bg-white [&>option]:text-foreground`}
                >
                  <option value="twoWheeler">🏍️ Two-Wheeler</option>
                  <option value="sedan">🚙 Sedan</option>
                  <option value="suv">🛻 SUV</option>
                  <option value="bus">🚌 Bus</option>
                </select>
              </div>

              <div className="mt-4">
                <label className={plannerLabelClass}>
                  Travel Mood <span className="text-foreground/45">(pick your vibe)</span>
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
                        className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                          selected
                            ? "border-primary/30 bg-primary/10 text-foreground"
                            : "border-emerald-100 bg-emerald-50/80 text-foreground/60 hover:bg-emerald-100/80"
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {from && destination && (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in-0">
                  <p className="mb-2 text-xs font-semibold text-foreground/80">
                    Quick Estimate
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <p className="text-foreground/70">
                        ⛽ Fuel: <span className="text-foreground">~₹ {fuelCost.toLocaleString("en-IN")}</span>
                      </p>
                      <p className="text-foreground/70">
                        🛣️ Toll: <span className="text-foreground">~₹ 180</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground/70">
                        🏨 Hotel/night: <span className="text-foreground">~₹ 1,200</span>
                      </p>
                      <p className="text-foreground/70">
                        🍴 Food/day: <span className="text-foreground">~₹ 500/person</span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary">
                    Total estimate: ~₹ {totalEstimate.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    * Rough estimate. Get exact cost in trip builder
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={saveAndContinue}
                className="mt-5 flex w-full font-serif items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-primary-hover active:scale-[0.99]"
              >
                Plan My Trip <ArrowRight className="w-4 h-4" />
              </button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
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
