import { useEffect, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TripTypeStep from "@/components/trip/steps/TripType";
import MoodSelector from "@/components/trip/steps/MoodSelector";
import ItineraryBuilder from "@/components/trip/steps/ItineraryBuilder";
import TripDetails from "@/components/trip/steps/TripDetails";
import DestinationStep from "@/components/trip/steps/DestinationStep";
import TripCalculator from "@/components/TripCalculator";
import { useTrip } from "@/context/TripContext";

const steps = [
  "Trip Type",
  "Mood",
  "Destination",
  "Details",
  "Itinerary",
  "Cost Summary",
];

const TripBuilder = () => {
  const [activeStep, setActiveStep] = useState("0");
  const { trip, updateTrip, setTrip } = useTrip();

  useEffect(() => {
    const rawDraft = localStorage.getItem("tripDraft");
    if (!rawDraft) return;

    try {
      const parsed = JSON.parse(rawDraft) as {
        tripType?: "solo" | "family" | "group";
        from?: string;
        destination?: string;
        startDate?: string;
        endDate?: string;
        members?: number;
        vehicle?: string;
        mappedMoods?: string[];
      };

      setTrip((prev) => ({
        ...prev,
        tripType: parsed.tripType ?? prev.tripType,
        startDate: parsed.startDate ?? prev.startDate,
        endDate: parsed.endDate ?? prev.endDate,
        numberOfMembers:
          parsed.tripType === "solo"
            ? 1
            : Math.max(2, parsed.members ?? prev.numberOfMembers),
        startLocation: parsed.from ?? prev.startLocation,
        vehicleType: parsed.vehicle ?? prev.vehicleType,
        moods:
          parsed.mappedMoods && parsed.mappedMoods.length
            ? (parsed.mappedMoods as typeof prev.moods)
            : prev.moods,
        destinations:
          parsed.destination && parsed.destination.trim().length > 0
            ? [parsed.destination]
            : prev.destinations,
      }));
    } catch {
      // Ignore invalid drafts and keep existing context state.
    } finally {
      localStorage.removeItem("tripDraft");
    }
  }, [setTrip]);

  const progress = useMemo(
    () => ((Number(activeStep) + 1) / steps.length) * 100,
    [activeStep],
  );

  return (
    <div className="container mx-auto px-4 py-20 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trip Builder</h1>
        <p className="text-muted-foreground">Plan your trip in 6 steps</p>
      </div>

      <Progress value={progress} indicatorClassName="bg-emerald-600" />

      <Tabs
        value={activeStep}
        onValueChange={setActiveStep}
        className="space-y-6"
      >
        <TabsList className="grid h-auto grid-cols-2 gap-2 md:grid-cols-6">
          {steps.map((step, index) => (
            <TabsTrigger
              key={step}
              value={String(index)}
              className="text-xs md:text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {index + 1}. {step}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="0">
          <TripTypeStep
            value={trip.tripType}
            onChange={(value) => updateTrip("tripType", value)}
          />
        </TabsContent>

        <TabsContent value="1"> 
          <MoodSelector
            selectedMoods={trip.moods}
            selectedGenres={trip.genres}
            onMoodsChange={(moods) => updateTrip("moods", moods)}
            onGenresChange={(genres) => updateTrip("genres", genres)}
            onSuggestions={(destinations) =>
              updateTrip("destinations", destinations)
            }
          />
        </TabsContent>

        <TabsContent value="2">
          <DestinationStep />
        </TabsContent>

        <TabsContent value="3" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              type="date"
              value={trip.startDate}
              onChange={(event) => updateTrip("startDate", event.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch (err) {
                  console.error("Error opening date picker: ", err);
                }
              }}
              className="cursor-pointer"
            />
            <Input
              type="date"
              value={trip.endDate}
              onChange={(event) => updateTrip("endDate", event.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch (err) {
                  console.error("Error opening date picker: ", err);
                }
              }}
              className="cursor-pointer"
            />
            <Input
              type="number"
              min={1}
              value={trip.numberOfMembers}
              onChange={(event) =>
                updateTrip("numberOfMembers", Number(event.target.value || 1))
              }
              placeholder="Members"
            />
            <Input
              value={trip.startLocation}
              onChange={(event) =>
                updateTrip("startLocation", event.target.value)
              }
              placeholder="Start Location"
            />
          </div>
          <TripDetails />
        </TabsContent>

        <TabsContent value="4">
          <ItineraryBuilder
            numberOfDays={Math.max(
              1,
              trip.endDate && trip.startDate
                ? 1 +
                    Math.round(
                      (new Date(trip.endDate).getTime() -
                        new Date(trip.startDate).getTime()) /
                        86400000,
                    )
                : 1,
            )}
            value={trip.itinerary}
            onChange={(value) => updateTrip("itinerary", value)}
          />
        </TabsContent>

        <TabsContent value="5">
          <TripCalculator />
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={Number(activeStep) === 0}
          onClick={() =>
            setActiveStep(String(Math.max(0, Number(activeStep) - 1)))
          }
          className="border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 font-medium shadow-sm"
        >
          Back
        </Button>
        <Button
          disabled={Number(activeStep) === steps.length - 1}
          onClick={() =>
            setActiveStep(
              String(Math.min(steps.length - 1, Number(activeStep) + 1)),
            )
          }
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TripBuilder;
