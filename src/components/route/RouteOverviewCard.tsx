import React, { useState } from "react";
import { getRouteBreakdown, RouteBreakdown } from "@/utils/routeUtils";
import {
  Navigation,
  ArrowRight,
  Clock,
  Car,
  ChevronDown,
  ChevronUp,
  Milestone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteOverviewCardProps {
  startLocation: string;
  destination: string;
  distanceKm?: number;
  className?: string;
  showStartJourneyButton?: boolean;
  onStartJourney?: () => void;
}

export const RouteOverviewCard: React.FC<RouteOverviewCardProps> = ({
  startLocation,
  destination,
  distanceKm,
  className = "",
  showStartJourneyButton = false,
  onStartJourney,
}) => {
  const [showAllLegs, setShowAllLegs] = useState(true);

  const route: RouteBreakdown = getRouteBreakdown(
    startLocation,
    destination,
    distanceKm
  );

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm relative overflow-hidden mb-6 sm:mb-8 transition-all hover:shadow-md ${className}`}
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-100 pb-4 mb-4 sm:mb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-gt-gold/15 text-gt-gold text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <Navigation size={12} /> Route Breakdown
            </span>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] sm:text-xs font-medium rounded-full">
              {route.mainHighway}
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-serif font-bold text-gt-blue flex flex-wrap items-center gap-1.5 sm:gap-2 leading-snug">
            <span className="text-gray-900 break-words">{route.origin}</span>
            <ArrowRight size={18} className="text-gt-gold shrink-0 inline-block" />
            <span className="text-gt-blue break-words">{route.destination}</span>
          </h3>
          <p className="text-xs text-gray-500 font-sans mt-1">
            Complete transit travel itinerary showing step-by-step route legs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-xl border border-gray-100 text-left sm:text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Total Distance & Time</p>
            <p className="text-sm sm:text-base font-bold text-gt-blue">
              ~{route.totalDistanceKm} km <span className="text-xs text-gray-500 font-normal">({route.totalDurationHours})</span>
            </p>
          </div>

          {showStartJourneyButton && onStartJourney && (
            <Button
              onClick={onStartJourney}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 sm:px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 sm:gap-2 text-xs"
            >
              <Navigation size={13} className="text-white" />
              <span>Start Journey</span>
            </Button>
          )}
        </div>
      </div>

      {/* Waypoint Transit Path (Where to Where) */}
      <div className="mb-4 sm:mb-5 bg-gray-50/70 rounded-xl p-3 sm:p-4 border border-gray-100">
        <p className="text-[11px] sm:text-xs font-bold text-gt-blue uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center gap-1.5">
          <Milestone size={14} className="text-gt-gold" /> Waypoint Transit Path (Where to Where)
        </p>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
          {route.waypoints.map((wp, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-white border border-gray-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-2xs">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gt-gold/20 text-gt-gold text-[9px] sm:text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">{wp}</span>
              </div>
              {idx < route.waypoints.length - 1 && (
                <ArrowRight size={13} className="text-gt-gold shrink-0 opacity-70" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Leg-by-Leg Details */}
      <div>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h4 className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Car size={14} className="text-gt-gold" /> Leg Travel Details ({route.legs.length} Legs)
          </h4>
          <button
            onClick={() => setShowAllLegs(!showAllLegs)}
            className="text-xs text-gt-blue hover:underline flex items-center gap-1 font-semibold"
          >
            {showAllLegs ? "Collapse Legs" : "Expand All Legs"}
            {showAllLegs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showAllLegs && (
          <div className="space-y-2.5">
            {route.legs.map((leg, idx) => (
              <div
                key={idx}
                className="bg-gray-50/70 hover:bg-gray-50 transition-colors p-3 sm:p-3.5 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-gt-gold/15 text-gt-gold font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    L{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 font-semibold text-gray-800">
                      <span className="text-gray-700 break-words">{leg.from}</span>
                      <span className="hidden sm:inline text-gt-gold font-bold">→</span>
                      <div className="flex items-center gap-1 sm:hidden text-gt-gold text-[10px] font-bold">
                        <ArrowRight size={10} /> <span>to</span>
                      </div>
                      <span className="text-gt-blue font-bold break-words">{leg.to}</span>
                    </div>
                    {leg.highway && (
                      <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                        Via {leg.highway}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600 self-start sm:self-center font-medium bg-white px-2.5 sm:px-3 py-1 rounded-lg border border-gray-200 shadow-2xs shrink-0 text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1 text-gray-700">
                    <Milestone size={12} className="text-gt-gold" /> {leg.distanceKm} km
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock size={12} className="text-gt-gold" /> {leg.estimatedTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

