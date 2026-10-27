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
  MapPin,
  Compass,
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
      className={`bg-white rounded-2xl p-4 sm:p-6 border border-emerald-100/80 shadow-sm relative overflow-hidden mb-6 sm:mb-8 transition-all hover:shadow-md ${className}`}
    >
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-4 mb-4 sm:mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-2xs">
              <Navigation size={12} className="text-emerald-600" /> Google Maps Route Breakdown
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] sm:text-xs font-semibold rounded-full border border-slate-200/80">
              <Compass size={12} className="text-slate-500" />
              {route.mainHighway}
            </span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Total Distance</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-950">~{route.totalDistanceKm} km</span>
            </div>
            <div className="h-6 w-px bg-emerald-200"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Est. Drive Time</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-950">{route.totalDurationHours}</span>
            </div>
          </div>
        </div>

        {/* Clean, Non-Congested Route Title */}
        <div className="mt-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 text-base sm:text-xl font-sans font-bold text-slate-900">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
              <span className="truncate text-slate-900">{route.origin}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 shrink-0 font-normal px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">to</span>
              <ArrowRight size={16} className="shrink-0" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shrink-0" />
              <span className="truncate text-emerald-900">{route.destination}</span>
            </div>
          </div>

          {/* Subtext with complete address if distinct */}
          {route.originFull && route.originFull !== route.origin && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-sans mt-1.5 flex items-center gap-1">
              <MapPin size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">Starting from: <strong className="text-slate-700 font-medium">{route.originFull}</strong></span>
            </p>
          )}
        </div>

        {showStartJourneyButton && onStartJourney && (
          <div className="mt-3.5 flex justify-end">
            <Button
              onClick={onStartJourney}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 text-xs"
            >
              <Navigation size={13} className="text-white" />
              <span>Start Live Navigation</span>
            </Button>
          </div>
        )}
      </div>

      {/* Waypoint Transit Path (Where to Where) */}
      <div className="mb-4 sm:mb-5 bg-slate-50/80 rounded-xl p-3 sm:p-4 border border-slate-200/80">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Milestone size={14} className="text-emerald-600" /> Highway Waypoint Transit Path
          </p>
          <span className="text-[10px] text-slate-500 font-medium">{route.waypoints.length} key route points</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 pt-1">
          {route.waypoints.map((wp, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === route.waypoints.length - 1;
            return (
              <React.Fragment key={idx}>
                <div
                  className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl border shadow-2xs transition-all ${
                    isFirst
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                      : isLast
                      ? "bg-rose-50 border-rose-300 text-rose-900 font-bold"
                      : "bg-white border-slate-200 text-slate-800 font-semibold"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      isFirst
                        ? "bg-emerald-600 text-white"
                        : isLast
                        ? "bg-rose-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs whitespace-nowrap">{wp}</span>
                </div>
                {!isLast && (
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Leg-by-Leg Details */}
      <div>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h4 className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Car size={14} className="text-emerald-600" /> Step-by-Step Highway Legs ({route.legs.length} Legs)
          </h4>
          <button
            onClick={() => setShowAllLegs(!showAllLegs)}
            className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold transition-colors"
          >
            {showAllLegs ? "Collapse Legs" : "Expand All Legs"}
            {showAllLegs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showAllLegs && (
          <div className="space-y-2">
            {route.legs.map((leg, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 hover:bg-slate-50/90 transition-all p-3 sm:p-3.5 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                    L{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800 text-xs sm:text-sm">
                      <span className="text-slate-900 font-bold">{leg.from}</span>
                      <ArrowRight size={12} className="text-emerald-600 shrink-0" />
                      <span className="text-emerald-900 font-bold">{leg.to}</span>
                    </div>
                    {leg.highway && (
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Via <strong className="font-semibold text-slate-700">{leg.highway}</strong></span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700 self-start sm:self-center font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs shrink-0 text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1 text-slate-800 font-semibold">
                    <Milestone size={12} className="text-emerald-600" /> {leg.distanceKm} km
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <Clock size={12} className="text-slate-500" /> {leg.estimatedTime}
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
