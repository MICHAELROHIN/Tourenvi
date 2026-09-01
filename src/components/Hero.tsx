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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(243,250,243,0.96),rgba(247,251,247,0.92))] pt-20 pb-8 sm:pt-28 sm:pb-12 md:pt-30 md:pb-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.10),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0))]" />

      <div className="relative z-10 container mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className={`relative overflow-hidden rounded-2xl sm:rounded-[1.75rem] border border-emerald-100/80 bg-black shadow-[0_28px_90px_-56px_rgba(15,118,110,0.45)] transition-all duration-700 ${isReady ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"
              }`}
          >
            <HeroVideo
              className="absolute inset-0 h-full min-h-full aspect-auto"
              videoClassName="scale-[1.05]"
              overlayClassName="bg-gradient-to-b from-black/40 via-black/15 to-black/50"
            />

            <div className="relative z-10 flex min-h-[480px] sm:min-h-[560px] lg:min-h-[600px] flex-col justify-between px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                className={`max-w-4xl text-center lg:max-w-3xl lg:text-left transition-all duration-700 ${isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
              >
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/40 px-3 py-1 sm:px-4 sm:py-2 shadow-sm backdrop-blur-md bg-white/90">
                  <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  <span className="text-xs sm:text-sm font-semibold text-emerald-950">
                    Sustainable Travel Planning
                  </span>
                </div>

                <h1 className="mt-4 sm:mt-8 text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight sm:leading-[0.95] tracking-[-0.03em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                  Smart Travel,
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                    {" "}
                    Sustainable Future
                  </span>
                </h1>

                <p className="mx-auto mt-3 sm:mt-6 max-w-xl text-xs sm:text-base leading-relaxed text-white/90 font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)] sm:text-xl lg:mx-0 lg:text-md">
                  Plan your perfect trip with AI-powered cost estimation,
                  eco-friendly route optimization, and personalized
                  recommendations that care for both your wallet and the planet.
                </p>

                <div className="mt-5 sm:mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                  <Button
                    size="lg"
                    className="px-6 py-2.5 text-sm font-semibold shadow-[0_18px_40px_-22px_rgba(34,197,94,0.8)] transition-all duration-300 hover:bg-primary-hover hover:shadow-[0_22px_46px_-24px_rgba(34,197,94,0.9)]"
                    onClick={() => navigate("/trip/new")}
                  >
                    Plan My Journey
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </div>


                <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {startTripFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border border-white/75 bg-white/80 p-2.5 sm:px-4 sm:py-3 shadow-[0_18px_40px_-32px_rgba(15,118,110,0.55)] backdrop-blur-sm transition-all duration-500 text-left ${isReady
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0"
                          }`}
                      >
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
                          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {feature.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
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
                className={`mt-5 sm:mt-6 rounded-xl sm:rounded-[1.25rem] border border-white/75 bg-white/70 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs text-foreground/75 shadow-[0_14px_36px_-30px_rgba(15,118,110,0.5)] backdrop-blur-sm transition-all duration-700 ${isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
              >
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 text-[11px] sm:text-xs">
                  <span className="sm:pr-4 sm:border-r sm:border-foreground/10 text-center sm:text-left">
                    <strong className="text-emerald-700 font-bold">50,000+</strong> Trips Planned
                  </span>
                  <span className="sm:pr-4 sm:border-r sm:border-foreground/10 text-center sm:text-left">
                    <strong className="text-emerald-700 font-bold">1,200+</strong> Hidden Gems
                  </span>
                  <span className="sm:pr-4 sm:border-r sm:border-foreground/10 text-center sm:text-left">
                    <strong className="text-emerald-700 font-bold">₹2Cr+</strong> Saved
                  </span>
                  <span className="text-center sm:text-left">
                    <strong className="text-emerald-700 font-bold">98%</strong> Satisfaction
                  </span>
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
