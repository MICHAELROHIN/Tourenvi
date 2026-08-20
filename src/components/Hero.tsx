import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Leaf, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroVideo from "./HeroVideo";

const startTripFeatures = [
  {
    icon: DollarSign,
    title: "Cost Estimation",
    subtitle: "Precise trip budgeting",
  },
  {
    icon: MapPin,
    title: "Smart Routes",
    subtitle: "Optimized pathfinding",
  },
  {
    icon: Sparkles,
    title: "Eco-Friendly",
    subtitle: "Sustainable travel",
  },
];

const Hero = () => {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  const sendToSection = (section: string) => {
    navigate(`/hero#${section}`);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 30);
    return () => window.clearTimeout(timer);
  }, []);

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

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(243,250,243,0.96),rgba(247,251,247,0.92))] pt-28 pb-12 md:pt-30 md:pb-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.10),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0))]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className={`relative overflow-hidden rounded-[1.75rem] border border-emerald-100/80 bg-card shadow-[0_28px_90px_-56px_rgba(15,118,110,0.45)] transition-all duration-700 ${isReady ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"
              }`}
          >
            <HeroVideo
              className="absolute inset-0 h-full min-h-full aspect-auto"
              videoClassName="scale-[1.05]"
              overlayClassName="bg-[linear-gradient(110deg,rgba(255,255,255,0.78)_0%,rgba(245,248,245,0.36)_34%,rgba(17,24,39,0.18)_100%)]"
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(6,20,18,0.2))]" />

            <div className="relative z-10 flex min-h-[600px] flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                className={`max-w-4xl text-center lg:max-w-3xl lg:text-left transition-all duration-700 ${isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100/80 px-4 py-2 shadow-[0_10px_24px_-20px_rgba(15,118,110,0.55)] backdrop-blur-sm">
                  <Leaf className="w-4 h-4 text-eco-green" />
                  <span className="text-sm font-medium text-foreground">
                    Sustainable Travel Planning
                  </span>
                </div>

                <h1 className="mt-8 text-2xl font-bold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-5xl">
                  Smart Travel,
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    {" "}
                    Sustainable Future
                  </span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-xl lg:mx-0 lg:text-md">
                  Plan your perfect trip with AI-powered cost estimation,
                  eco-friendly route optimization, and personalized
                  recommendations that care for both your wallet and the planet.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                  <Button
                    size="lg"
                    className="px-6 py-2 text-sm font-semibold shadow-[0_18px_40px_-22px_rgba(34,197,94,0.8)] transition-all duration-300 hover:bg-primary-hover hover:shadow-[0_22px_46px_-24px_rgba(34,197,94,0.9)]"
                    onClick={() => navigate("/trip/new")}
                  >
                    Plan My Journey
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

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {startTripFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className={`flex items-center gap-3 rounded-xl border border-white/75 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,118,110,0.55)] backdrop-blur-sm transition-all duration-500 ${isReady
                            ? "translate-y-0 opacity-100"
                            : "translate-y-2 opacity-0"
                          }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {feature.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {feature.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="sr-only">
                {featureCards.map((card) => (
                  <button key={card.title} type="button" onClick={card.onClick}>
                    {card.title}
                  </button>
                ))}
              </div>

              <div
                className={`mt-6 rounded-[1.25rem] border border-white/75 bg-white/60 px-4 py-3 text-xs text-foreground/72 shadow-[0_14px_36px_-30px_rgba(15,118,110,0.5)] backdrop-blur-sm transition-all duration-700 ${isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
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
            className={`mx-auto w-full max-w-md xl:mx-0 xl:sticky xl:top-24 transition-all duration-700 ${isReady ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"
              }`}
          >
            <div className="w-full rounded-[2rem] border border-emerald-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,250,243,0.96))] p-5 shadow-[0_24px_80px_-48px_rgba(15,118,110,0.65)] backdrop-blur-md sm:p-6">
              <div className="rounded-[1.5rem] border border-emerald-100 bg-white/82 p-5 shadow-[0_16px_50px_-36px_rgba(15,118,110,0.5)]">
                <span className="inline-flex w-fit items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 shadow-sm">
                  Sustainable Travel Planning
                </span>

                <h3 className="mt-4 text-2xl font-bold leading-tight text-foreground">
                  Smart Travel,
                  <span className="block bg-gradient-hero bg-clip-text text-transparent">
                    Sustainable Future
                  </span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Plan your perfect trip with AI powered cost estimation,
                  eco-friendly route optimization, and personalized
                  recommendations that care for both your wallet and the
                  planet.
                </p>

                <Button
                  size="lg"
                  className="mt-6 w-full justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_-18px_rgba(34,197,94,0.8)] transition-all hover:bg-primary-hover"
                  onClick={() => navigate("/trip/new")}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="mt-4 space-y-3">
                  {startTripFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-4"
                      >
                        <div className="flex items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-600 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {feature.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {feature.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Hero;
