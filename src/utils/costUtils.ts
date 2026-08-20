type VehicleType = "twoWheeler" | "hatchback" | "sedan" | "suv" | "tempo" | "electric";

const co2Factors: Record<VehicleType, number> = {
  twoWheeler: 0.04,
  hatchback: 0.12,
  sedan: 0.15,
  suv: 0.21,
  tempo: 0.18,
  electric: 0.02,
};

export const calculateFuelCost = (
  distance: number,
  mileage: number,
  price: number,
  buffer = 1.15,
): number => {
  if (distance <= 0 || mileage <= 0 || price <= 0) {
    return 0;
  }
  const liters = distance / mileage;
  return liters * price * buffer;
};

export const calculateCO2 = (distance: number, vehicleType: VehicleType): number => {
  return Math.max(0, distance) * (co2Factors[vehicleType] ?? co2Factors.sedan);
};

export const formatINR = (amount: number): string => {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

export const getBudgetLevel = (perPersonCost: number): "budget" | "moderate" | "high" => {
  if (perPersonCost < 5000) {
    return "budget";
  }
  if (perPersonCost <= 15000) {
    return "moderate";
  }
  return "high";
};

export const calculateFoodCost = (members: number, days: number, avgPerDay = 500): number => {
  return Math.max(1, members) * Math.max(1, days) * avgPerDay;
};
