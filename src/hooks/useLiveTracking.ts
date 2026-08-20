import { useEffect, useMemo, useState } from "react";
import { onValue, onDisconnect, ref, set } from "firebase/database";
import { auth, rtdb } from "@/firebase";

export type MemberLocation = {
  userId: string;
  lat: number;
  lng: number;
  timestamp: number;
  isOnline: boolean;
  batteryLevel?: number;
};

export const useLiveTracking = (tripId: string) => {
  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([]);
  const [myLocation, setMyLocation] = useState<MemberLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !tripId || !navigator.geolocation) {
      return;
    }

    const memberRef = ref(rtdb, `tripTracking/${tripId}/members/${uid}`);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const payload: MemberLocation = {
          userId: uid,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          isOnline: true,
          batteryLevel: undefined,
        };
        await set(memberRef, payload);
        setMyLocation(payload);
        setIsTracking(true);
      },
      () => {
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 },
    );

    onDisconnect(memberRef).set({
      userId: uid,
      lat: 0,
      lng: 0,
      timestamp: Date.now(),
      isOnline: false,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tripId, uid]);

  useEffect(() => {
    if (!tripId) {
      return;
    }
    const listRef = ref(rtdb, `tripTracking/${tripId}/members`);
    const unsubscribe = onValue(listRef, (snapshot) => {
      const value = snapshot.val() as Record<string, MemberLocation> | null;
      const rows = value ? Object.values(value) : [];
      setMemberLocations(rows);
    });

    return () => unsubscribe();
  }, [tripId]);

  const staleMembers = useMemo(() => {
    const now = Date.now();
    return memberLocations.filter((member) => now - member.timestamp > 30 * 60 * 1000);
  }, [memberLocations]);

  return { memberLocations, myLocation, isTracking, staleMembers };
};
