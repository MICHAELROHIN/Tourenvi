import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  TripItineraryDay,
  TripItinerarySlot,
} from "@/context/TripContext";
import { geocodePlace } from "@/utils/osmRouteService";
import { AlertTriangle } from "lucide-react";

type Props = {
  numberOfDays: number;
  value: TripItineraryDay[];
  onChange: (value: TripItineraryDay[]) => void;
};

const dangerZones = ["Bandipur", "Kaziranga", "Aarey Forest", "Jim Corbett"];

const createSlot = (title: string): TripItinerarySlot => ({
  id: `${title.toLowerCase()}-${Math.random().toString(36).slice(2, 9)}`,
  title: "",
});

const buildDays = (count: number): TripItineraryDay[] =>
  Array.from({ length: Math.max(1, count) }).map((_, index) => ({
    day: index + 1,
    morning: createSlot("morning"),
    afternoon: createSlot("afternoon"),
    evening: createSlot("evening"),
    hotelName: "",
    hotelCost: 0,
  }));

const ItineraryBuilder = ({ numberOfDays, value, onChange }: Props) => {
  const [busySlot, setBusySlot] = useState<string | null>(null);

  const days = useMemo(() => {
    if (value.length > 0) {
      return value;
    }
    return buildDays(numberOfDays);
  }, [numberOfDays, value]);

  useEffect(() => {
    if (value.length === 0) {
      onChange(days);
    }
  }, [days, onChange, value.length]);

  const updateField = (
    dayIndex: number,
    slotKey: "morning" | "afternoon" | "evening",
    nextValue: string,
  ) => {
    const next = [...days];
    next[dayIndex] = {
      ...next[dayIndex],
      [slotKey]: {
        ...next[dayIndex][slotKey],
        title: nextValue,
      },
    };
    onChange(next);
  };

  const geocodeSlot = async (
    dayIndex: number,
    slotKey: "morning" | "afternoon" | "evening",
  ) => {
    const day = days[dayIndex];
    const slot = day[slotKey];
    if (!slot.title.trim()) {
      return;
    }

    setBusySlot(slot.id);
    try {
      const location = await geocodePlace(slot.title);
      const next = [...days];
      next[dayIndex] = {
        ...day,
        [slotKey]: {
          ...slot,
          lat: location.lat,
          lng: location.lon,
        },
      };
      onChange(next);
    } finally {
      setBusySlot(null);
    }
  };

  const updateHotel = (
    dayIndex: number,
    key: "hotelName" | "hotelCost",
    nextValue: string,
  ) => {
    const next = [...days];
    next[dayIndex] = {
      ...next[dayIndex],
      [key]: key === "hotelCost" ? Number(nextValue || 0) : nextValue,
    };
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Danger zone warning
        </p>
        <p>Avoid late-night halts near: {dangerZones.join(", ")}.</p>
      </div>

      {days.map((day, dayIndex) => (
        <div key={day.day} className="rounded-lg border p-4 space-y-3">
          <p className="font-semibold">Day {day.day}</p>
          {(["morning", "afternoon", "evening"] as const).map((slotKey) => (
            <div key={slotKey} className="grid sm:grid-cols-[1fr_auto] gap-2">
              <div>
                <Label className="capitalize">{slotKey}</Label>
                <Input
                  placeholder={`Add ${slotKey} place`}
                  value={day[slotKey].title}
                  onChange={(event) =>
                    updateField(dayIndex, slotKey, event.target.value)
                  }
                />
                {day[slotKey].lat && day[slotKey].lng && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Coords: {day[slotKey].lat?.toFixed(4)},{" "}
                    {day[slotKey].lng?.toFixed(4)}
                  </p>
                )}
              </div>
              <Button
                className="sm:mt-6"
                variant="outline"
                onClick={() => geocodeSlot(dayIndex, slotKey)}
                disabled={busySlot === day[slotKey].id}
              >
                {busySlot === day[slotKey].id ? "Searching..." : "Locate"}
              </Button>
            </div>
          ))}

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <Label>Hotel</Label>
              <Input
                value={day.hotelName || ""}
                onChange={(event) =>
                  updateHotel(dayIndex, "hotelName", event.target.value)
                }
              />
            </div>
            <div>
              <Label>Night Cost (INR)</Label>
              <Input
                type="number"
                value={day.hotelCost || 0}
                onChange={(event) =>
                  updateHotel(dayIndex, "hotelCost", event.target.value)
                }
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItineraryBuilder;
