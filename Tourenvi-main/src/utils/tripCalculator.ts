/**
 * Tourenvi - Own Transport (Self-Drive) Dynamic Budget & Itinerary Engine
 * Senior Full-Stack Engineer & Mathematical Calculation Architect
 */

export interface TripCalculationInput {
  startLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfMembers: number;
  vehicleType: string; // 'car' | 'bike'
  fuelType: string; // 'petrol' | 'diesel' | 'ev'
  vehicleMileage: number; // e.g. 15 km/L
  budgetLevel?: "Budget" | "Standard" | "Luxury" | string;
  oneWayDistanceKm?: number;
  placesCount?: number;
}

export interface TripCalculationResult {
  numberOfDays: number;
  nights: number;
  totalDistanceKm: number;
  oneWayDistanceKm: number;
  fuelConsumptionLiters: number;
  fuelPricePerLiter: number;
  fuelCost: number;
  tollCost: number;
  roomsNeeded: number;
  baseRoomRate: number;
  accommodationCost: number;
  dailyFoodRatePerPerson: number;
  foodCost: number;
  placesCount: number;
  avgTicketPrice: number;
  sightseeingCost: number;
  totalCalculatedBudget: number;
}

/**
 * Calculates exact dynamic road trip budget formulas based on user wizard inputs
 */
export const calculateTripBudget = (input: TripCalculationInput): TripCalculationResult => {
  const {
    startDate,
    endDate,
    numberOfMembers = 1,
    vehicleMileage = 15,
    fuelType = "petrol",
    budgetLevel = "Standard",
    oneWayDistanceKm = 450,
    placesCount = 12,
  } = input;

  // 1. Calculate exact trip days: numberOfDays = (endDate - startDate) + 1
  let numberOfDays = 3;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive count
    if (diffDays > 0) numberOfDays = diffDays;
  }
  const nights = Math.max(1, numberOfDays - 1);

  // 2. Total round-trip distance (km) with 15% local sightseeing buffer
  const validOneWay = Math.max(50, oneWayDistanceKm);
  const totalDistanceKm = Math.round(validOneWay * 2 * 1.15);

  // 3. Fuel Calculation
  const validMileage = Math.max(1, vehicleMileage);
  const fuelConsumptionLiters = Math.round((totalDistanceKm / validMileage) * 10) / 10;
  const normFuel = String(fuelType).toLowerCase();
  const fuelPricePerLiter = normFuel === "diesel" ? 92 : normFuel === "ev" ? 2.0 : 103;
  const fuelCost = Math.round(fuelConsumptionLiters * fuelPricePerLiter);

  // 4. FASTag Toll Surcharges (~₹1.25 per km of national highway)
  const tollCost = Math.round(validOneWay * 1.25);

  // 5. Accommodation Cost Calculation
  const members = Math.max(1, numberOfMembers);
  const roomsNeeded = Math.ceil(members / 2);
  const normBudget = String(budgetLevel).toLowerCase();
  let baseRoomRate = 2800; // Standard default
  if (normBudget.includes("budget") || normBudget.includes("economy")) {
    baseRoomRate = 1200;
  } else if (normBudget.includes("luxury")) {
    baseRoomRate = 6000;
  }
  const accommodationCost = roomsNeeded * nights * baseRoomRate;

  // 6. Food Cost Calculation
  let dailyFoodRatePerPerson = 800; // Standard default
  if (normBudget.includes("budget") || normBudget.includes("economy")) {
    dailyFoodRatePerPerson = 400;
  } else if (normBudget.includes("luxury")) {
    dailyFoodRatePerPerson = 1800;
  }
  const foodCost = members * numberOfDays * dailyFoodRatePerPerson;

  // 7. Sightseeing & Entry Ticket Fees
  const avgTicketPrice = 50;
  const validPlacesCount = Math.max(1, placesCount);
  const sightseeingCost = members * validPlacesCount * avgTicketPrice;

  // 8. Total Calculated Budget
  const totalCalculatedBudget =
    fuelCost + tollCost + accommodationCost + foodCost + sightseeingCost;

  return {
    numberOfDays,
    nights,
    totalDistanceKm,
    oneWayDistanceKm: validOneWay,
    fuelConsumptionLiters,
    fuelPricePerLiter,
    fuelCost,
    tollCost,
    roomsNeeded,
    baseRoomRate,
    accommodationCost,
    dailyFoodRatePerPerson,
    foodCost,
    placesCount: validPlacesCount,
    avgTicketPrice,
    sightseeingCost,
    totalCalculatedBudget,
  };
};
