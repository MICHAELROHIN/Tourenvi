import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TollEstimateResponse = {
  estimatedToll: number;
  breakdown: Array<{ segment: string; distanceKm: number; toll: number }>;
  disclaimer: string;
};

type Props = {
  startLocation: string;
  destinations: string[];
  vehicleType: string;
  onTollComputed?: (amount: number) => void;
};

const TollEstimator = ({
  startLocation,
  destinations,
  vehicleType,
  onTollComputed,
}: Props) => {
  const [data, setData] = useState<TollEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(
    () =>
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/toll-estimate`,
    [],
  );

  const estimateToll = async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startLocation, destinations, vehicleType }),
      });
      const payload = (await response.json()) as TollEstimateResponse;
      setData(payload);
      onTollComputed?.(payload.estimatedToll);
    } catch {
      // Backend unavailable — silently skip toll estimate
    } finally {
      setLoading(false);
    }
  };

  // return (
  //   <Card>
  //     <CardHeader>
  //       <CardTitle className="text-base">FASTag / Toll Estimate</CardTitle>
  //     </CardHeader>
  //     <CardContent className="space-y-3">
  //       <Button
  //         onClick={estimateToll}
  //         disabled={loading || !startLocation || destinations.length === 0}
  //       >
  //         {loading ? "Estimating..." : "Estimate Toll"}
  //       </Button>

  //       {data && (
  //         <div className="space-y-2 text-sm">
  //           <p className="font-semibold">
  //             Estimated Toll:{" "}
  //             {data.estimatedToll.toLocaleString("en-IN", {
  //               style: "currency",
  //               currency: "INR",
  //             })}
  //           </p>
  //           {data.breakdown.map((row) => (
  //             <div
  //               key={row.segment}
  //               className="flex justify-between border-b pb-1"
  //             >
  //               <span>{row.segment}</span>
  //               <span>
  //                 {row.toll.toLocaleString("en-IN", {
  //                   style: "currency",
  //                   currency: "INR",
  //                 })}
  //               </span>
  //             </div>
  //           ))}
  //           <p className="text-muted-foreground">
  //             FASTag Recommendation: Keep at least 1.3x estimated toll balance.
  //           </p>
  //           <p className="text-xs text-muted-foreground">{data.disclaimer}</p>
  //         </div>
  //       )}
  //     </CardContent>
  //   </Card>
  // );
};

export default TollEstimator;
