import React, { useState, useMemo } from "react";
import { PlannedTrip } from "@/pages/TripsPlanned";
import { Copy, Check, X, Share2, Sparkles, ShieldCheck, MapPin, Calendar, Clock, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export interface WhatsAppTripShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: PlannedTrip;
  activeDayIndex?: number;
  dayItems?: Array<{
    id: string;
    time: string;
    title: string;
    type?: string;
    completed?: boolean;
  }>;
}

const toTitleCase = (str?: string): string => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const WhatsAppTripShareModal: React.FC<WhatsAppTripShareModalProps> = ({
  isOpen,
  onClose,
  trip,
  activeDayIndex = 0,
  dayItems,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<"day" | "full">("day");

  const startCity = toTitleCase(trip.routeDetails?.startLocation || trip.tripData?.startLocation || "Chennai");
  const destCity = toTitleCase(trip.routeDetails?.destination || trip.tripData?.destinations?.[0] || "Destination");
  const dayNumber = activeDayIndex + 1;
  const currentDayTitle = trip.itinerary?.[activeDayIndex]?.title || `Core Sightseeing & Route in ${destCity}`;

  // Formatted WhatsApp message generator
  const generatedMessage = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tourenvi.web.app";
    const liveLink = `${origin}/live`;

    if (shareMode === "day") {
      const itemsToShare = dayItems && dayItems.length > 0 
        ? dayItems 
        : trip.itinerary?.[activeDayIndex]?.items || [];

      const stopsList = itemsToShare.map((item) => {
        const emoji = 
          item.type === "food" ? "🍽️" :
          item.type === "lodging" ? "🏨" :
          item.type === "temple" ? "🛕" : "📍";
        const status = item.completed ? "✓ " : "";
        return `• ${item.time}: ${status}${item.title} ${emoji}`;
      }).join("\n");

      return `🚗 *TOURENVI ROAD TRIP BRIEFING* 🌿
📍 *Route:* ${startCity} → ${destCity}
📅 *Day ${dayNumber}:* ${currentDayTitle}

⏰ *Today's Waypoints:*
${stopsList || "• Relaxed cruising along scenic corridor 🚗"}

🛡️ *Safety Curfew:* Arrive at hotel before *08:00 PM*
⛽ *Est. Fuel:* ₹${(trip.financials?.fuelExpenditure || 1200).toLocaleString("en-IN")} | 🎫 *FASTag Tolls:* ₹${(trip.financials?.tollPricing || 140).toLocaleString("en-IN")}
🏨 *Stay:* ${trip.tripData?.selectedHotelName || "Heritage Resort & Stay"}

📍 *Track Our Live GPS Cockpit:*
${liveLink}

_Sent via Tourenvi Smart Road Trip OS_`;
    } else {
      // Full multi-day summary
      const daysSummary = (trip.itinerary || []).map((day, idx) => {
        return `*Day ${idx + 1}:* ${day.title} (${day.items?.length || 0} stops)`;
      }).join("\n");

      return `🚗 *TOURENVI COMPLETE TRIP PLAN* 🌿
📍 *Journey:* ${startCity} → ${destCity}
📅 *Duration:* ${trip.itinerary?.length || 1} Days
👥 *Travelers:* ${trip.tripData?.numberOfMembers || 4} Members (${trip.tripData?.vehicleType || "Car"})

🗺️ *Itinerary Overview:*
${daysSummary || `*Day 1:* Exploration & Coastal Drive`}

💰 *Budget Estimation:*
• Total Budget: ₹${(trip.financials?.totalCost || 12000).toLocaleString("en-IN")}
• Fuel: ₹${(trip.financials?.fuelExpenditure || 2500).toLocaleString("en-IN")} | FASTag: ₹${(trip.financials?.tollPricing || 350).toLocaleString("en-IN")}
• Stay: ${trip.tripData?.selectedHotelName || "Reserved Accommodation"}

🛡️ *8:00 PM Safety Curfew:* Guaranteed hotel check-in before dark.
📍 *Live Co-Pilot:* ${liveLink}

_Plan your safe Indian road trip on Tourenvi_`;
    }
  }, [shareMode, trip, activeDayIndex, dayItems, startCity, destCity, dayNumber, currentDayTitle]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    toast.success("📋 Copied WhatsApp briefing to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToWhatsApp = () => {
    const encoded = encodeURIComponent(generatedMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    toast.success("💬 Opening WhatsApp...");
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100/80 overflow-hidden space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-[#064e3b] via-[#043e31] to-[#022c22] p-6 text-white relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shadow-inner">
                {/* Custom WhatsApp SVG Icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                  Share to Family WhatsApp
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Pre-formatted live briefing with stops, FASTag &amp; 8 PM curfew.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Toggle between Day Plan and Full Trip */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2">
            <button
              onClick={() => setShareMode("day")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                shareMode === "day"
                  ? "bg-emerald-400 text-emerald-950 shadow-md scale-[1.02]"
                  : "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
              }`}
            >
              Day {dayNumber} Plan
            </button>
            <button
              onClick={() => setShareMode("full")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                shareMode === "full"
                  ? "bg-emerald-400 text-emerald-950 shadow-md scale-[1.02]"
                  : "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
              }`}
            >
              Full {trip.itinerary?.length || 1}-Day Trip
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="px-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Message Preview:</span>
            <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
              <Sparkles size={12} /> Auto-synced with live trip
            </span>
          </div>

          {/* WhatsApp Chat Preview Card */}
          <div className="relative rounded-2xl bg-[#EFEAE2] p-4 border border-[#DAD3C8] shadow-inner max-h-60 overflow-y-auto">
            {/* WhatsApp Chat Bubble */}
            <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-sm text-xs text-gray-800 font-sans whitespace-pre-line leading-relaxed border border-gray-100">
              {generatedMessage}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 pt-2 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendToWhatsApp}
            className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {/* WhatsApp Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z"/>
            </svg>
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
