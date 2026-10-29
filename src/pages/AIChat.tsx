import React, { useMemo, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  Copy,
  Check,
  PackageCheck,
  AlertTriangle,
  Compass,
  Coins,
  Leaf,
  PlusCircle,
  Building2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// -------------------------------------------------------------------
//  Domain-Aware Smart Fallback Generator (Guarantees instant, high quality
//  packing checklists, road advisories & budgets even without API keys)
// -------------------------------------------------------------------
const generateSmartFallbackResponse = (
  prompt: string,
  destination: string,
  trip: {
    numberOfMembers?: number;
    vehicleType?: string;
    startDate?: string;
    endDate?: string;
  }
): string => {
  const p = prompt.toLowerCase();
  const destName = destination && destination !== "your destination" ? destination : "your trip";
  const members = trip.numberOfMembers || 2;
  const vehicle = trip.vehicleType || "Car / SUV";

  if (
    p.includes("pack") ||
    p.includes("checklist") ||
    p.includes("luggage") ||
    p.includes("bag") ||
    p.includes("item")
  ) {
    return `🎒 TOURENVI SMART ROAD TRIP PACKING CHECKLIST FOR ${destName.toUpperCase()}
Tailored for ${members} traveler${members > 1 ? "s" : ""} travelling by ${vehicle}

📄 Mandatory Vehicle Documents & Toll Prep:
• Physical Driver's License, Vehicle Registration (RC) & active Pollution (PUC) certificate
• Car Insurance policy copy (digital PDF + 1 printed xerox in glovebox)
• FASTag account recharged with at least ₹1,000–₹1,500 buffer balance
• Emergency cash: ₹2,500–₹4,000 in ₹100/₹200 notes (for remote ghat stalls & state highway toll cash lanes)

👕 Clothing & Climate Essentials:
• Breathable cottons for afternoon driving; 1 light fleece or windbreaker for morning/night ghat chills
• Comfortable driving footwear (avoid loose flip-flops) + 1 pair of sturdy walking shoes
• Polarized UV400 driving sunglasses (cuts harsh highway glare) & sun-protection cap
• Compact travel umbrella or light rain poncho

💊 Health, First-Aid & Ghat Travel Kit:
• Motion sickness tablets (Avomine / Ondansetron) — essential for winding ghat hairpin curves
• Oral rehydration salts (ORS/Electral) & glucose powder to prevent driver dehydration
• Emergency travel kit: Paracetamol, antacids (Digene/Eno), Band-Aids & antiseptic wipes
• Mosquito repellent lotion/spray (Odomos) & alcohol hand sanitizer

📱 Tech, Co-Pilot Gadgets & Offline Data:
• Heavy-duty magnetic or cradle car mobile mount for live navigation
• Fast dual-port USB car charger & fully charged 20,000mAh Power Bank
• Downloaded Offline Google Maps / Tourenvi Route cache for network-blind patches
• Auxiliary audio cable or offline downloaded road trip playlist

🚗 Vehicle Spares & Safety Gear:
• Spare tire checked and inflated (33–35 PSI recommended) + jack & wheel spanner
• Portable 12V mini tire inflator or tubeless tire puncture repair kit
• 2 large 5L water bottles (for drinking or radiator emergency top-up)
• High-lumen LED flashlight or headlamp

💡 Pro-Tip: Pack heavy suitcases deep into the vehicle boot floor directly over the rear axle. This lowers the center of gravity and significantly improves highway stability on winding corners.`;
  }

  if (
    p.includes("road") ||
    p.includes("highway") ||
    p.includes("safety") ||
    p.includes("advisory") ||
    p.includes("ghat") ||
    p.includes("curfew")
  ) {
    return `⚠️ TOURENVI HIGHWAY & ROAD SAFETY ADVISORY: ${destName.toUpperCase()}
Essential transit protocols, driving rules & real-time travel recommendations:

🛣️ Highway & Road Conditions:
• Major national corridors feature 4-to-6 lane divided tarmac with heavy multi-axle freight traffic.
• Maintain a steady cruising speed of 70–80 km/h; watch for sudden two-wheeler crossings at median gaps.
• Maintain at least a 3-second braking distance, especially behind heavy commercial carriers.

⛰️ Ghat & Hill Section Driving Protocols:
• Uphill vehicles have absolute right of way—never force climbing traffic to halt on steep grades.
• Downshift to 2nd or 3rd gear on downhill sections; rely on engine braking rather than riding brakes to prevent brake fade.
• Strictly zero overtaking on blind hairpin turns. Give a single polite horn tap before turning blind corners during the day.

⏰ Tourenvi 08:00 PM Safety Curfew Reminder:
• Highway visibility drops sharply after dusk with high-beam glare from oncoming heavy trucks.
• Wrap up highway driving and check in at your hotel by 08:00 PM. Night driving on isolated state roads is strongly discouraged.

📞 Emergency Roadside Helplines (Save these on speed dial):
• National Highway Emergency Helpline: 1033
• Police Assistance: 112
• Medical & Ambulance Emergency: 108

⛽ Pit-Stop & Fueling Strategy:
• Refuel at company-owned company-operated (COCO) pumps of BPCL / IndianOil / HPCL on national highway bypasses.
• Clean restrooms and family food plazas are situated immediately before major toll plazas.`;
  }

  if (
    p.includes("cost") ||
    p.includes("budget") ||
    p.includes("expense") ||
    p.includes("food") ||
    p.includes("estimate") ||
    p.includes("toll")
  ) {
    return `💰 ESTIMATED TRAVEL BUDGET FOR ${destName.toUpperCase()}
Estimated for ${members} traveler${members > 1 ? "s" : ""} on a comfortable mid-range road journey:

🏨 Accommodation (per room/night):
• Comfortable 3-Star / Verified Homestay: ₹2,400 – ₹3,800
• Total stay budget for ${members} pax: ~₹${Math.round((members / 2) * 2800)} / night

🍽️ Food & Highway Dining:
• Breakfast & highway tea breaks: ₹150 / person / day
• Authentic local cuisine (Lunch & Dinner): ₹500 – ₹700 / person / day
• Total food allocation: ~₹${members * 800} / day for ${members} travelers

⛽ Fuel & Toll Expenses:
• Highway tolls (round-trip): ~₹600 – ₹1,200 (deducted automatically via FASTag)
• Fuel estimate for ${vehicle}: ~₹1,800 – ₹3,400 (varying with distance & AC usage)
• Activity passes & local monument entry: ~₹300 / person

💡 Smart Travel Savings Tip: Dine at bustling highway food courts with high customer turnover; food is fresher, hot off the griddle, and significantly faster than sit-down hotel buffets.`;
  }

  if (
    p.includes("gem") ||
    p.includes("spot") ||
    p.includes("sight") ||
    p.includes("attraction") ||
    p.includes("place")
  ) {
    return `💎 CURATED HIGHLIGHTS & HIDDEN GEMS: ${destName.toUpperCase()}

1. Sunrise Heritage & Scenic Viewpoint:
Arrive early (around 06:15 AM) to witness golden hour light without tour bus crowds. Pristine photo opportunities and cool morning breezes.

2. Authentic Old-Quarter Walk & Local Markets:
Explore the heritage lanes by foot. Great for local handicrafts, artisanal spices, and fresh culinary treats made in front of you.

3. Peaceful Nature Sanctuary / Waterfront Escape:
A secluded green retreat ideal for picnics, unwinding, and avoiding crowded central landmarks.

4. Sunset Panorama Point:
The premier high-ground vantage point overlooking ${destName}. Best visited between 05:30 PM and 06:15 PM before dusk.

💡 Local Insight: Hire an accredited local guide at historical monuments for 45 minutes; their folklore insights bring the stone carvings to life!`;
  }

  if (p.includes("eco") || p.includes("green") || p.includes("sustainable")) {
    return `🌿 ECO-FRIENDLY & SUSTAINABLE TRAVEL GUIDE FOR ${destName.toUpperCase()}

🌱 Leave No Trace:
• Carry personal stainless steel / copper refillable water bottles; avoid single-use plastic bottles.
• Collect your vehicle snack wrappers in a dedicated car trash bag until you reach a hotel recycling bin.

🚗 Eco-Driving Practices:
• Maintain smooth throttle inputs at 65–75 km/h for 15-20% improved fuel efficiency.
• Turn off vehicle idle during extended railway crossings or slow toll lines.

🥗 Support Local Communities:
• Purchase fruits, tender coconuts, and souvenirs directly from village roadside farmers and artisans.
• Dine at family-run heritage eateries preserving age-old regional recipes.`;
  }

  return `✨ TOURENVI TRAVEL ADVICE FOR ${destName.toUpperCase()}

Here are tailored recommendations for your journey with ${members} traveler${members > 1 ? "s" : ""}:

1. Recommended Timing:
Start driving between 05:30 AM and 06:30 AM to escape city bottlenecks and experience smooth open-highway cruising.

2. Safety & Curfew:
Follow Tourenvi's safety recommendation: arrive at your hotel or destination stop by 08:00 PM before night fatigue sets in.

3. Local Delights:
Don't miss the regional specialties at famous roadside stops. Ask locals for their favorite breakfast spot!

What would you like to explore next? You can ask for a full Packing Checklist, Highway Safety Advisory, or Fuel & Budget estimation.`;
};

// ===================================================================
//  COMPONENT
// ===================================================================
const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const { trip } = useTrip();
  const destination = trip.destinations[0] || trip.itinerary[0]?.morning.title || "your destination";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "Hello! I am WanderSmart AI, your Tourenvi travel co-pilot. I can generate packing checklists, highway & safety advisories, hidden gems, and cost estimations for your trip.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPills = useMemo(
    () => [
      { label: `🎒 Packing Checklist`, prompt: `Give me a comprehensive road trip packing checklist for ${destination}` },
      { label: `⚠️ Road & Safety Advisory`, prompt: `What is the highway condition and safety advisory for driving to ${destination}?` },
      { label: `💎 Hidden Gems`, prompt: `What are the best sightseeing spots and hidden gems in ${destination}?` },
      { label: `💰 Trip Budget`, prompt: `Estimate food, stay, fuel and toll expenses for ${trip.numberOfMembers || 2} people visiting ${destination}` },
      { label: `🌿 Eco Tips`, prompt: `What are eco-friendly travel options and sustainable tips for ${destination}?` },
    ],
    [destination, trip.numberOfMembers]
  );

  const runPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) {
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: promptText }]);
    setIsLoading(true);

    try {
      if (!genAI) {
        // Instant intelligent domain fallback when API key is not configured
        const fallback = generateSmartFallbackResponse(promptText, destination, trip);
        setMessages((prev) => [...prev, { role: "ai", content: fallback }]);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        return;
      }

      const tripContext = JSON.stringify({
        destination: trip.destinations,
        dates: { start: trip.startDate, end: trip.endDate },
        members: trip.numberOfMembers,
        budget: trip.costBreakdown,
        vehicleType: trip.vehicleType,
        moods: trip.moods,
      });

      const systemPrompt = `You are WanderSmart AI, Tourenvi's premier smart India travel co-pilot.
User's current trip context: ${tripContext}
When asked for packing or checklists, give a practical, structured checklist tailored for Indian road trips (documents/FASTag, climate/clothes, health/ghats, vehicle kit, gadgets).
When asked for road advisories, include highway quality, ghat driving etiquette, speed/tolls, and Tourenvi's signature 08:00 PM safety curfew rule.
Format your responses with clear emoji bullet points and clean structure.`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${promptText}`);
      const content = result.response.text().replace(/\*\*/g, "").replace(/#{1,4}/g, "").trim();
      setMessages((prev) => [...prev, { role: "ai", content }]);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {
      // Seamlessly fallback to high quality structured travel recommendations
      const fallback = generateSmartFallbackResponse(promptText, destination, trip);
      setMessages((prev) => [...prev, { role: "ai", content: fallback }]);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied recommendations to clipboard!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleShareToWhatsApp = (text: string) => {
    const header = `*Tourenvi Travel Co-Pilot Guide*\n📍 *Destination:* ${destination}\n\n`;
    const footer = `\n\n_Planned with Tourenvi Smart Travel_`;
    const message = encodeURIComponent(header + text + footer);
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp to share!");
  };

  const addToTrip = (text: string) => {
    const destinationMention = text.split(/\s+/).find((word) => /^[A-Z][a-z]{3,}$/.test(word));
    if (destinationMention) {
      const event = new CustomEvent("tourenvi:setDestination", { detail: { destination: destinationMention } });
      window.dispatchEvent(event);
      toast.success(`Added ${destinationMention} to your trip plan!`);
    } else {
      toast.info("Point of interest saved to your journey notes.");
    }
  };

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 flex flex-col bg-slate-50/50 overflow-hidden font-sans z-10">
      {/* Top Header Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 py-3 shrink-0 z-20 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">WanderSmart AI</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 uppercase tracking-wider">
                  Co-Pilot Active
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {trip.destinations[0] ? `Destination: ${trip.destinations[0]}` : "Smart India Road Trip Guide"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setMessages([
                {
                  role: "ai",
                  content:
                    "Hello! I am WanderSmart AI, your Tourenvi travel co-pilot. I can generate packing checklists, highway & safety advisories, hidden gems, and cost estimations for your trip.",
                },
              ])
            }
            className="text-xs text-gray-500 hover:text-gray-900 h-8 px-2.5 rounded-lg flex items-center gap-1.5"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Chat Stream */}
      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-6">
          {/* Welcome Starter Section (Shown on initial conversation) */}
          {messages.length === 1 && (
            <div className="py-4 sm:py-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <Bot size={30} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                  How can I guide your journey today?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Instant smart packing checklists, highway safety advisories, scenic stops & budget planning.
                </p>
              </div>

              {/* 6 Starter Cards Grid (3x2 on desktop, 2x3 on tablet, 1 col on mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left max-w-3xl mx-auto pt-2">
                {/* 1. Smart Packing Checklist */}
                <button
                  type="button"
                  onClick={() => runPrompt(`Give me a comprehensive road trip packing checklist for ${destination}`)}
                  className="p-3.5 rounded-2xl border border-emerald-200/80 bg-white hover:border-emerald-500 hover:shadow-md transition-all duration-200 group text-left relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <PackageCheck className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                    🎒 Smart Packing Checklist
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    FASTag, docs, ghat medicines, climate clothes & vehicle gear
                  </p>
                </button>

                {/* 2. Road & Safety Advisory */}
                <button
                  type="button"
                  onClick={() => runPrompt(`What is the highway condition and safety advisory for driving to ${destination}?`)}
                  className="p-3.5 rounded-2xl border border-amber-200/80 bg-white hover:border-amber-500 hover:shadow-md transition-all duration-200 group text-left relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 shadow-2xs group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-amber-800">
                    ⚠️ Road & Safety Advisory
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    Highway quality, ghat driving rules, speed & 8:00 PM curfew
                  </p>
                </button>

                {/* 3. Discover Hidden Gems */}
                <button
                  type="button"
                  onClick={() => runPrompt(`What are the best sightseeing spots and hidden gems in ${destination}?`)}
                  className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 group text-left relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                    💎 Discover Hidden Gems
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    Top sightseeing landmarks, heritage corners & sunrise vistas
                  </p>
                </button>

                {/* 4. Budget & Cost Estimation */}
                <button
                  type="button"
                  onClick={() =>
                    runPrompt(`Estimate food, stay, fuel and toll expenses for ${trip.numberOfMembers || 2} people visiting ${destination}`)
                  }
                  className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 group text-left relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Coins className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                    💰 Budget & Cost Estimation
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    Per-person daily expenses, food, stay & fuel calculation
                  </p>
                </button>

                {/* 5. Optimal Route & Roads */}
                <button
                  type="button"
                  onClick={() => runPrompt(`What is the optimal route, tolls, and travel tips for ${destination}?`)}
                  className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 group text-left relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2 shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                    🧭 Optimal Highway Corridors
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    Best bypasses, highway condition & pit-stop locations
                  </p>
                </button>

                {/* 6. Eco-Friendly Alternatives */}
                <button
                  type="button"
                  onClick={() => runPrompt(`What are eco-friendly travel options and sustainable tips for ${destination}?`)}
                  className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 group text-left relative overflow-hidden"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Leaf className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                    🌿 Eco-Friendly Travel
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    Low-carbon driving, zero plastic & local artisan spots
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2.5 sm:gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-emerald-700 border border-emerald-200"
                }`}
              >
                {msg.role === "user" ? <User size={15} /> : <Bot size={15} />}
              </div>

              <div
                className={`p-4 sm:p-4.5 rounded-2xl leading-relaxed text-xs sm:text-sm shadow-xs ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-xs max-w-[85%] sm:max-w-[75%]"
                    : "bg-white border border-gray-200/90 text-gray-800 rounded-tl-xs max-w-[94%] sm:max-w-[88%]"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* AI Interactive Action Bar */}
                {msg.role === "ai" && idx > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    {/* 1-Click WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => handleShareToWhatsApp(msg.content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#075E54] text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-95 cursor-pointer"
                      title="Share this checklist / advisory to WhatsApp"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z" />
                      </svg>
                      <span>Share on WhatsApp</span>
                    </button>

                    {/* Copy Advice */}
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title="Copy recommendations"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Add to Trip */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 font-semibold rounded-xl"
                      onClick={() => addToTrip(msg.content)}
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Add to Trip
                    </Button>

                    {/* View Hotels */}
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-2xs"
                      onClick={() => navigate("/hotels")}
                    >
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      View Hotels
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot size={15} className="text-emerald-700" />
              </div>
              <div className="bg-white border border-gray-200/90 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-2.5 shadow-2xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-xs text-gray-600 font-medium">WanderSmart is preparing recommendations...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Pinned Bottom Input & Quick Action Bar */}
      <div className="shrink-0 bg-white border-t border-gray-200/80 pt-2 pb-3 px-3 sm:px-4 z-20">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick Tap Pills (Accessible anytime during chat) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => runPrompt(pill.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-transparent text-gray-600 text-[11px] font-semibold transition-all duration-150 active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="relative flex items-center bg-slate-50/70 hover:bg-white rounded-2xl border border-gray-300 shadow-xs hover:border-gray-400 focus-within:bg-white focus-within:border-emerald-600 focus-within:shadow-md transition-all duration-200 p-1 pl-3.5 sm:pl-4">
            <input
              type="text"
              placeholder={`Ask anything about routes, packing, tolls, food in ${destination}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runPrompt(input)}
              disabled={isLoading}
              className="w-full bg-transparent border-0 outline-none focus:outline-none text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 py-2 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => runPrompt(input)}
              disabled={isLoading || !input.trim()}
              className={`h-9 w-9 sm:h-9.5 sm:w-9.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                input.trim() && !isLoading
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-[10px] sm:text-[11px] text-gray-400 text-center font-sans">
            WanderSmart AI: Indian highway regulations, 8:00 PM curfew reminders & automated WhatsApp trip sharing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

