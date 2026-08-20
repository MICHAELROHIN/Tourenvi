import React, { useState } from "react";
import {
  CloudLightning,
  AlertTriangle,
  Coffee,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";

interface HazardAlert {
  id: string;
  stretchName: string;
  severity: "yellow" | "red";
  hazardType: "Heavy Monsoon Rain" | "Zero-Visibility Fog" | "Landslide Prone Ghat" | "Waterlogged Stretch";
  description: string;
  recommendedPitStops: {
    name: string;
    distanceKm: number;
    facilities: string[];
  }[];
}

const DEFAULT_HAZARDS: HazardAlert[] = [
  {
    id: "h1",
    stretchName: "Khandala Ghat Bypass (KM 52 - KM 68)",
    severity: "red",
    hazardType: "Landslide Prone Ghat",
    description: "Heavy rainfall predicted between 4:00 PM - 7:00 PM. High risk of rockfall and reduced traction on curves.",
    recommendedPitStops: [
      {
        name: "Lonavala Food Mall Plaza (KM 50)",
        distanceKm: 2.1,
        facilities: ["24/7 Covered Parking", "EV Chargers", "Food Court", "Restrooms"],
      },
      {
        name: "Expressway Highway Rest Bay",
        distanceKm: 5.4,
        facilities: ["First Aid Center", "Hot Beverages", "Mechanic Shed"],
      },
    ],
  },
  {
    id: "h2",
    stretchName: "Talegaon Highway Corridor (KM 80 - KM 95)",
    severity: "yellow",
    hazardType: "Zero-Visibility Fog",
    description: "Dense fog formation expected early morning (5:00 AM - 8:00 AM). Visibility reduced below 30 meters.",
    recommendedPitStops: [
      {
        name: "IndianOil Swagat Highway Hub",
        distanceKm: 3.8,
        facilities: ["Fuel & CNG", "Tea & Coffee Lounge", "Clean Washrooms"],
      },
    ],
  },
];

export const RouteHazardBanner: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>("h1");

  return (
    <div className="space-y-4">
      {DEFAULT_HAZARDS.map((hazard) => {
        const isRed = hazard.severity === "red";
        const isExpanded = expandedId === hazard.id;

        return (
          <div
            key={hazard.id}
            className={`rounded-2xl border transition-all overflow-hidden ${
              isRed
                ? "border-red-500/40 bg-red-500/10 text-white shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                : "border-amber-500/40 bg-amber-500/10 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            }`}
          >
            {/* Header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : hazard.id)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isRed
                      ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                      : "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  }`}
                >
                  <CloudLightning className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isRed
                          ? "bg-red-600 text-white"
                          : "bg-amber-500 text-black font-black"
                      }`}
                    >
                      {hazard.hazardType}
                    </span>
                    <h4 className="font-bold text-sm text-white">{hazard.stretchName}</h4>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">{hazard.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[11px] font-semibold text-gray-300">
                  {isExpanded ? "Hide Safe Pit-Stops" : "View Safe Pit-Stops"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-300" />
                )}
              </div>
            </div>

            {/* Pit-Stop Recommendations */}
            {isExpanded && (
              <div className="p-4 border-t border-white/10 bg-[#051124]/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
                  <Coffee className="h-4 w-4" />
                  <span>Recommended Safe Waiting Pit-Stops (To Wait Out Severe Weather):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hazard.recommendedPitStops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-white/10 bg-[#0B2B5C]/60 flex justify-between items-start"
                    >
                      <div>
                        <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                          {stop.name}
                        </h5>
                        <div className="flex items-center gap-1.5 flex-wrap pt-2">
                          {stop.facilities.map((fac, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-gray-300 border border-white/10"
                            >
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        {stop.distanceKm} km
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RouteHazardBanner;
