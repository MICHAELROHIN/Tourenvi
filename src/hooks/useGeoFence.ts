import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { haversineDistance, isInsideCircle } from "@/utils/geoUtils";
import { toast } from "sonner";

type DestinationFence = {
  destination: string;
  lat: number;
  lng: number;
};

export const useGeoFence = (tripId: string, destinations: DestinationFence[], radiusMeters = 5000) => {
  const [outsideBoundary, setOutsideBoundary] = useState(false);
  const [arrivedAt, setArrivedAt] = useState<string[]>([]);

  const destinationLabels = useMemo(() => destinations.map((item) => item.destination), [destinations]);

  useEffect(() => {
    if (!navigator.geolocation || destinations.length === 0) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(async (position) => {
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };

      let insideAny = false;
      for (const destination of destinations) {
        const center = { lat: destination.lat, lng: destination.lng };
        if (isInsideCircle(point, center, radiusMeters)) {
          insideAny = true;
          if (!arrivedAt.includes(destination.destination)) {
            setArrivedAt((prev) => [...prev, destination.destination]);
            toast.success(`You've arrived at ${destination.destination}!`);
            if (auth.currentUser) {
              await addDoc(collection(db, "tripEvents"), {
                tripId,
                userId: auth.currentUser.uid,
                type: "arrival",
                destination: destination.destination,
                timestamp: serverTimestamp(),
              });
            }
          }
        }
      }

      if (!insideAny) {
        const minDistance = Math.min(
          ...destinations.map((destination) =>
            haversineDistance(point.lat, point.lng, destination.lat, destination.lng),
          ),
        );
        setOutsideBoundary(minDistance > 10000);
      } else {
        setOutsideBoundary(false);
      }
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [arrivedAt, destinations, radiusMeters, tripId]);

  return {
    outsideBoundary,
    arrivedAt,
    destinationLabels,
  };
};
