import React, { useState, useMemo } from "react";
import {
  Sparkles,
  MapPin,
  Clock,
  Navigation,
  Check,
  PlusCircle,
  Utensils,
  Star,
  Eye,
  X,
  Compass,
  ArrowRight,
  Zap,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";
import { RealAttraction, FamousFoodSpecialty } from "@/utils/routeCorridorPlacesData";
import { RouteCorridorDiscoveryResult } from "@/utils/routeAttractionsService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RealPlaceImage, useRealPlaceImage } from "@/components/trip/RealPlaceImage";

interface RouteAttractionsAlongWayProps {
  discovery: RouteCorridorDiscoveryResult;
  addedPlaceIds: Set<string>;
  onAddToRoute: (attraction: RealAttraction) => void;
  onAddFoodToRoute?: (food: FamousFoodSpecialty) => void;
  onFocusOnMap?: (lat: number, lng: number, title: string) => void;
}

export const RouteAttractionsAlongWay: React.FC<RouteAttractionsAlongWayProps> = ({
  discovery,
  addedPlaceIds,
  onAddToRoute,
  onAddFoodToRoute,
  onFocusOnMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"corridor" | "by_city" | "famous_foods">("corridor");
  const [activeModalPlace, setActiveModalPlace] = useState<RealAttraction | null>(null);

  // Real photo credit for the detail modal (cached – no extra network call)
  const modalPhoto = useRealPlaceImage(
    activeModalPlace?.name ?? "",
    activeModalPlace?.city ?? "",
    "place",
  );

  // Filter attractions based on category
  const filteredAttractions = useMemo(() => {
    if (selectedCategory === "all") return discovery.allAttractions;
    return discovery.allAttractions.filter((a) => a.category === selectedCategory);
  }, [discovery.allAttractions, selectedCategory]);

  return (
    <div className="bg-white rounded-3xl border border-emerald-900/10 shadow-sm p-5 md:p-7 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <RouteIcon size={13} className="text-emerald-700" />
              Google Maps Highway Route Trace
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <Compass size={12} className="text-blue-600" />
              {discovery.mainHighways}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Places to Visit Along Your Route
          </h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-3xl leading-relaxed">
            Authentic sights and iconic food stops located <strong>strictly along your driving path</strong> on{" "}
            <strong className="text-emerald-950 font-bold">{discovery.corridorTitle}</strong>. Every spot is physically on or within minutes of your highway transit.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-2xl border border-gray-200/70 self-start lg:self-auto">
          <button
            onClick={() => {
              setViewMode("corridor");
              setSelectedCategory("all");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "corridor"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Driving Sequence ({discovery.totalAttractionsCount})
          </button>
          <button
            onClick={() => setViewMode("by_city")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "by_city"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            By Highway Town ({discovery.transitStops.length})
          </button>
          <button
            onClick={() => setViewMode("famous_foods")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "famous_foods"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-amber-900 hover:text-amber-950 bg-amber-50/50"
            }`}
          >
            <Utensils size={12} /> Famous Foods ({discovery.totalFoodsCount})
          </button>
        </div>
      </div>

      {/* Highway Transit Ribbon (Visual Road Trip Progression) */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-4 text-white shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" /> Road Trip Highway Path ({discovery.totalDistanceKm} km total)
          </span>
          <span className="text-[11px] text-emerald-200 font-medium">
            Sequential Driving Order
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {discovery.transitStops.map((stop, idx) => (
            <React.Fragment key={stop.city}>
              <div className="flex flex-col items-center bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/15 shrink-0 transition-colors">
                <span className="font-extrabold text-[11px] text-white flex items-center gap-1">
                  {idx === discovery.transitStops.length - 1 ? "🏁" : "📍"} {stop.city}
                </span>
                <span className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                  {stop.kmFromStart === 0 ? "Start" : `Km ${stop.kmFromStart}`}
                </span>
              </div>
              {idx < discovery.transitStops.length - 1 && (
                <ArrowRight size={14} className="text-emerald-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Category Pills (Visible when in sights view) */}
      {viewMode !== "famous_foods" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {discovery.categoriesAvailable.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                selectedCategory === cat.id
                  ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === cat.id ? "bg-emerald-700 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* View 1: Highway Driving Sequence View */}
      {viewMode === "corridor" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAttractions.map((attraction) => {
            const isAdded = addedPlaceIds.has(attraction.id);
            return (
              <div
                key={attraction.id}
                className="group flex flex-col bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-400/80 hover:shadow-md transition-all overflow-hidden relative"
              >
                {/* Image Container */}
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  <RealPlaceImage
                    name={attraction.name}
                    city={attraction.city}
                    alt={attraction.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Highway Km Marker Tag */}
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1">
                    <Navigation size={11} className="text-emerald-400" />
                    Km {attraction.highwayKmMarker} • {attraction.city}
                  </div>

                  {/* Enroute Status Tag */}
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    {attraction.enrouteStatus}
                  </div>

                  {/* Detour & Duration Overlay */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30 text-[11px]">
                      <Zap size={11} className="text-amber-400" />
                      {attraction.detourKm === 0
                        ? "0 km (On highway)"
                        : `+${attraction.detourKm} km (${attraction.detourMinutes}m detour)`}
                    </span>
                    <span className="font-semibold text-gray-200 flex items-center gap-1 text-[11px] bg-black/60 px-2 py-0.5 rounded-md">
                      <Clock size={11} /> {attraction.visitDurationHours}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                        {attraction.name}
                      </h3>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                      {attraction.shortDescription}
                    </p>

                    {/* Why Visit Box */}
                    <div className="mt-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-[11px] text-emerald-900 leading-snug">
                      <strong className="font-bold text-emerald-950 block mb-0.5 flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-600" /> Why it's worth visiting:
                      </strong>
                      {attraction.whyVisit}
                    </div>
                  </div>

                  {/* Footer & Action Button */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-500" />
                        <strong className="text-gray-800">{attraction.rating}</strong> ({attraction.reviewsCount})
                      </span>
                      <span className="text-gray-600 truncate max-w-[140px]">{attraction.entryFee}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setActiveModalPlace(attraction)}
                        variant="outline"
                        className="text-xs font-semibold px-2.5 py-1.5 h-8 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl flex-1"
                      >
                        <Eye size={12} className="mr-1 text-gray-500" /> View Details
                      </Button>

                      {onFocusOnMap && (
                        <Button
                          size="sm"
                          onClick={() => onFocusOnMap(attraction.lat, attraction.lng, attraction.name)}
                          variant="outline"
                          className="text-xs font-semibold px-2 py-1.5 h-8 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl"
                          title="View on Map"
                        >
                          <MapPin size={13} />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => {
                          onAddToRoute(attraction);
                          toast.success(`Added ${attraction.name} to today's journey schedule!`);
                        }}
                        className={`text-xs font-bold px-3 py-1.5 h-8 rounded-xl flex-1 transition-all ${
                          isAdded
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={12} className="mr-1" /> Added
                          </>
                        ) : (
                          <>
                            <PlusCircle size={12} className="mr-1" /> Add to Route
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: Grouped by Highway Stop Town */}
      {viewMode === "by_city" && (
        <div className="space-y-6">
          {discovery.transitStops.map((stop, idx) => (
            <div
              key={stop.city}
              className="bg-gray-50/80 border border-gray-200/90 rounded-2xl p-4 md:p-5 space-y-4"
            >
              {/* City Stop Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      {stop.city}
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {stop.kmFromStart === 0 ? "Start Point" : `Km ${stop.kmFromStart} on Highway`}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Highway Corridor: {stop.highway}
                    </p>
                  </div>
                </div>

                {stop.famousFoods.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-xl self-start sm:self-auto">
                    <Utensils size={12} /> {stop.famousFoods[0].foodName.split("&")[0]}
                  </div>
                )}
              </div>

              {/* Grid of ALL tourist places in this highway town */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stop.attractions.map((attraction) => {
                  const isAdded = addedPlaceIds.has(attraction.id);
                  return (
                    <div
                      key={attraction.id}
                      className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex gap-3">
                        <RealPlaceImage
                          name={attraction.name}
                          city={attraction.city}
                          alt={attraction.name}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mb-1">
                            {attraction.enrouteStatus}
                          </span>
                          <h4 className="font-bold text-xs text-gray-900 leading-tight truncate">
                            {attraction.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                            {attraction.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 p-2 rounded-lg text-[10px] text-emerald-950">
                        <strong>Why visit:</strong> {attraction.whyVisit}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-600">
                          {attraction.detourKm === 0 ? "On route" : `+${attraction.detourKm} km`} • {attraction.visitDurationHours}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveModalPlace(attraction)}
                            className="h-7 px-2 text-[11px] font-semibold text-gray-600"
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              onAddToRoute(attraction);
                              toast.success(`Added ${attraction.name} to route schedule!`);
                            }}
                            className={`h-7 px-2.5 text-[11px] font-bold rounded-lg ${
                              isAdded
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-emerald-700 text-white hover:bg-emerald-800"
                            }`}
                          >
                            {isAdded ? "Added" : "+ Add"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 3: Famous Regional Foods Along This Exact Road Trip */}
      {viewMode === "famous_foods" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Utensils size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm md:text-base">
                Authentic Food Specialties Along Your Driving Route
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Iconic highway delicacies mapped directly to your transit stops along{" "}
                <strong>{discovery.corridorTitle}</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {discovery.allFamousFoods.map((food) => (
              <div
                key={food.id}
                className="bg-white rounded-2xl border border-amber-200/80 hover:border-amber-400 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                    <RealPlaceImage
                      kind="food"
                      name={food.foodName}
                      city={food.city}
                      alt={food.foodName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md shadow-xs">
                      {food.city} • {food.highwayStopDistance}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {food.foodType}
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3 text-white text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full inline-block ${
                            food.isVegetarian ? "bg-emerald-400" : "bg-red-500"
                          }`}
                        />
                        {food.isVegetarian ? "Pure Vegetarian" : "Non-Vegetarian"}
                      </span>
                      <span className="text-amber-300 font-extrabold">{food.priceRange}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <h4 className="font-extrabold text-gray-900 text-sm leading-snug">
                      {food.foodName}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {food.description}
                    </p>

                    <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 text-[11px] text-amber-950 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-900">
                        <Sparkles size={11} className="text-amber-600" /> Famous Highway Outlet:
                      </div>
                      <p className="text-gray-800 font-semibold">{food.famousOutlet}</p>
                      <p className="text-xs text-amber-800 mt-1 italic leading-tight">
                        "{food.whyFamous}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onAddFoodToRoute) {
                        onAddFoodToRoute(food);
                      }
                      toast.success(`Added ${food.foodName.split("&")[0]} food stop to your itinerary!`);
                    }}
                    className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-8.5 shadow-xs"
                  >
                    <PlusCircle size={13} className="mr-1.5" /> Add Food Stop to Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Place Detail Modal */}
      {activeModalPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {activeModalPlace.enrouteStatus}
                </span>
                <span className="text-xs text-gray-500 font-semibold">
                  Km {activeModalPlace.highwayKmMarker} • {activeModalPlace.city}
                </span>
              </div>
              <button
                onClick={() => setActiveModalPlace(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative h-60 rounded-2xl overflow-hidden">
              <RealPlaceImage
                name={activeModalPlace.name}
                city={activeModalPlace.city}
                alt={activeModalPlace.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                ★ {activeModalPlace.rating} ({activeModalPlace.reviewsCount} Google Traveler Reviews)
              </div>
              {modalPhoto.result && (
                <a
                  href={modalPhoto.result.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-[10px] font-medium px-2 py-1 rounded-lg transition-colors"
                >
                  Photo: {modalPhoto.result.source}
                </a>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-gray-900">
                {activeModalPlace.name}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                {activeModalPlace.shortDescription}
              </p>

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-1">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-600" /> Why You Should Visit:
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  {activeModalPlace.whyVisit}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-semibold">HIGHWAY DISTANCE</span>
                  <strong className="text-xs text-gray-900 font-bold">
                    {activeModalPlace.highwayKmMarker} km from Start
                  </strong>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-semibold">DETOUR</span>
                  <strong className="text-xs text-gray-900 font-bold">
                    {activeModalPlace.detourKm === 0 ? "0 km (On highway)" : `+${activeModalPlace.detourKm} km`}
                  </strong>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-semibold">VISIT TIME</span>
                  <strong className="text-xs text-gray-900 font-bold">
                    {activeModalPlace.visitDurationHours}
                  </strong>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-semibold">ENTRY FEE</span>
                  <strong className="text-xs text-gray-900 font-bold truncate block">
                    {activeModalPlace.entryFee}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setActiveModalPlace(null)}
                className="text-xs font-semibold rounded-xl"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onAddToRoute(activeModalPlace);
                  toast.success(`Added ${activeModalPlace.name} to your route schedule!`);
                  setActiveModalPlace(null);
                }}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5"
              >
                {addedPlaceIds.has(activeModalPlace.id) ? "✓ Added to Route" : "+ Add to Route Schedule"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};