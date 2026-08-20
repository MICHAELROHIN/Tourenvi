import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { useGeoFence } from "@/hooks/useGeoFence";
import { useTrip } from "@/context/TripContext";
import { formatDistance, haversineDistance } from "@/utils/geoUtils";

const LiveTracking = () => {
  const { trip } = useTrip();
  const { memberLocations, myLocation, isTracking, staleMembers } =
    useLiveTracking("default-trip");

  const fenceDestinations = trip.itinerary
    .flatMap((day) => [day.morning, day.afternoon, day.evening])
    .filter(
      (slot) => typeof slot.lat === "number" && typeof slot.lng === "number",
    )
    .map((slot) => ({
      destination: slot.title,
      lat: slot.lat as number,
      lng: slot.lng as number,
    }));

  const { outsideBoundary, arrivedAt } = useGeoFence(
    "default-trip",
    fenceDestinations,
    5000,
  );

  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Live Tracking</h1>
      <p className="text-muted-foreground">
        Track all members in your trip and monitor geo-fence status.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Tracking: {isTracking ? "On" : "Off"}</p>
          <p>
            My location:{" "}
            {myLocation
              ? `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}`
              : "Unavailable"}
          </p>
          <p>Arrived destinations: {arrivedAt.join(", ") || "None yet"}</p>
          {outsideBoundary && (
            <Badge variant="destructive">Warning: Outside trip boundary</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {memberLocations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No live members yet.
            </p>
          )}
          {memberLocations.map((member) => (
            <div
              key={member.userId}
              className="rounded border p-3 text-sm flex justify-between"
            >
              <div>
                <p className="font-medium">{member.userId}</p>
                <p className="text-muted-foreground">
                  Last seen: {new Date(member.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p>{member.isOnline ? "Online" : "Offline"}</p>
                {myLocation && (
                  <p className="text-muted-foreground">
                    {formatDistance(
                      haversineDistance(
                        myLocation.lat,
                        myLocation.lng,
                        member.lat,
                        member.lng,
                      ),
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {trip.tripType === "family" && staleMembers.length > 0 && (
        <Card className="border-amber-300">
          <CardContent className="py-4 text-sm text-amber-700">
            Warning: Some family members have no update in 30 mins.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveTracking;
