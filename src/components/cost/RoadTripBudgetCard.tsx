/**
 * Tourenvi - Own Transport (Self-Drive) Dynamic Budget Breakdown Card Component
 * Senior Full-Stack Engineer & Road Trip Engine Architect
 */
import React from "react";
import { Car, Fuel, Milestone, Hotel, Utensils, Ticket, Wallet } from "lucide-react";
import { calculateTripBudget, TripCalculationResult } from "../../utils/tripCalculator";

interface RoadTripBudgetCardProps {
  financials?: any;
  tripData?: {
    startLocation?: string;
    destinations?: string[];
    startDate?: string;
    endDate?: string;
    numberOfMembers?: number;
    vehicleType?: string;
    fuelType?: string;
    mileage?: number;
    budgetCap?: number;
    lodgingType?: string[];
    budgetLevel?: string;
  };
  className?: string;
}

export const RoadTripBudgetCard: React.FC<RoadTripBudgetCardProps> = ({
  financials,
  tripData,
  className = "",
}) => {
  // Compute calculated budget from tripData if financials is not provided
  const calcResult: TripCalculationResult = React.useMemo(() => {
    if (financials && typeof financials.fuelCost === "number") {
      const days = financials.totalDays || 3;
      return {
        numberOfDays: days,
        nights: financials.nights || Math.max(1, days - 1),
        totalDistanceKm: financials.totalDistanceKm || 900,
        oneWayDistanceKm: financials.distanceKm || 450,
        fuelConsumptionLiters: financials.fuelConsumptionLiters || 60,
        fuelPricePerLiter: financials.fuelPricePerLiter || 103,
        fuelCost: financials.fuelCost || 0,
        tollCost: financials.tollCost || 0,
        roomsNeeded: financials.roomsNeeded || Math.ceil((tripData?.numberOfMembers || 4) / 2),
        baseRoomRate: financials.baseRoomRate || 2800,
        accommodationCost: financials.lodgingCost || financials.hotelCost || 0,
        dailyFoodRatePerPerson: financials.dailyFoodRatePerPerson || 800,
        foodCost: financials.foodCost || 0,
        placesCount: financials.placesCount || 15,
        avgTicketPrice: financials.avgTicketPrice || 50,
        sightseeingCost: financials.sightseeingCost || financials.placesCost || 0,
        totalCalculatedBudget: financials.totalCost || 0,
      };
    }

    return calculateTripBudget({
      startLocation: tripData?.startLocation || "Chennai",
      destination: tripData?.destinations?.[0] || "Kodaikanal",
      startDate: tripData?.startDate || "",
      endDate: tripData?.endDate || "",
      numberOfMembers: tripData?.numberOfMembers || 4,
      vehicleType: tripData?.vehicleType || "car",
      fuelType: tripData?.fuelType || "petrol",
      vehicleMileage: tripData?.mileage || 15,
      budgetLevel: tripData?.budgetLevel || tripData?.lodgingType?.[0] || "Standard",
      oneWayDistanceKm: 450,
      placesCount: 15,
    });
  }, [financials, tripData]);

  const members = tripData?.numberOfMembers || 4;

  return (
    <div className={`bg-white rounded-3xl p-6 shadow-md border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
        <div>
          <span className="px-3 py-1 bg-gt-gold/15 text-gt-gold font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-1.5 w-fit mb-1">
            <Wallet size={14} /> Self-Drive Road Trip Budget
          </span>
          <h3 className="text-xl font-serif font-bold text-gt-blue">
            Estimated Trip Cost Breakdown
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 font-sans block">Total Budget Cap</span>
          <span className="text-sm font-bold text-gt-blue">
            ₹{tripData?.budgetCap ? tripData.budgetCap.toLocaleString() : "50,000"}
          </span>
        </div>
      </div>

      <div className="space-y-3 font-sans text-sm">
        {/* 🚗 Total Driving Distance */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Car size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Total Driving Distance</p>
              <p className="text-xs text-gray-500">
                Round-trip + 15% local sightseeing buffer
              </p>
            </div>
          </div>
          <span className="font-bold text-gray-900 text-base">
            {calcResult.totalDistanceKm} km
          </span>
        </div>

        {/* ⛽ Fuel Cost */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Fuel size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Fuel Cost</p>
              <p className="text-xs text-gray-500">
                {calcResult.fuelConsumptionLiters} L @ ₹{calcResult.fuelPricePerLiter}/L
              </p>
            </div>
          </div>
          <span className="font-bold text-gray-900 text-base">
            ₹{calcResult.fuelCost.toLocaleString()}
          </span>
        </div>

        {/* 🛣️ FASTag Tolls Estimate */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Milestone size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">FASTag Tolls Estimate</p>
              <p className="text-xs text-gray-500">National highway toll plaza fees</p>
            </div>
          </div>
          <span className="font-bold text-gray-900 text-base">
            ₹{calcResult.tollCost.toLocaleString()}
          </span>
        </div>

        {/* 🏨 Stay & Lodging */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Hotel size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Stay & Lodging</p>
              <p className="text-xs text-gray-500">
                {calcResult.roomsNeeded} Room(s) × {calcResult.nights} Night(s) @ ₹
                {calcResult.baseRoomRate}/night
              </p>
            </div>
          </div>
          <span className="font-bold text-gray-900 text-base">
            ₹{calcResult.accommodationCost.toLocaleString()}
          </span>
        </div>

        {/* 🍽️ Food & Snacks */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Utensils size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Food & Snacks</p>
              <p className="text-xs text-gray-500">
                {members} Person(s) × {calcResult.numberOfDays} Day(s) @ ₹
                {calcResult.dailyFoodRatePerPerson}/day
              </p>
            </div>
          </div>
          <span className="font-bold text-gray-900 text-base">
            ₹{calcResult.foodCost.toLocaleString()}
          </span>
        </div>

        {/* 🎟️ Entry Tickets & Activities */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Ticket size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Entry Tickets & Activities</p>
              <p className="text-xs text-gray-500">
                {members} Person(s) × {calcResult.placesCount} Spot(s) @ ₹
                {calcResult.avgTicketPrice}/ticket
              </p>
            </div>
          </div>
          <span className="font-bold text-gray-900 text-base">
            ₹{calcResult.sightseeingCost.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 💰 TOTAL ESTIMATED ROAD TRIP BUDGET */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between bg-gt-blue/5 p-4 rounded-2xl">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-gt-gold block">
            Final Calculation
          </span>
          <span className="text-base font-serif font-bold text-gt-blue">
            TOTAL ESTIMATED ROAD TRIP BUDGET
          </span>
        </div>
        <span className="text-2xl font-serif font-extrabold text-gt-gold">
          ₹{calcResult.totalCalculatedBudget.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
