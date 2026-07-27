import { useEffect, useState } from "react";

type OfflineTripData = {
  tripName?: string;
  destinations?: string[];
  updatedAt?: string;
};

const CACHE_KEY = "tourenvi.offline.trip";

export const useOfflineMap = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [cachedTrip, setCachedTrip] = useState<OfflineTripData | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    try {
      const fromStorage = localStorage.getItem(CACHE_KEY);
      if (fromStorage) {
        setCachedTrip(JSON.parse(fromStorage) as OfflineTripData);
      }
    } catch {
      setCachedTrip(null);
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const cacheTrip = (trip: OfflineTripData) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...trip, updatedAt: new Date().toISOString() }));
    setCachedTrip(trip);
  };

  return {
    isOnline,
    cachedTrip,
    cacheTrip,
    bannerText: !isOnline ? "Offline Mode - Cached data" : null,
  };
};
