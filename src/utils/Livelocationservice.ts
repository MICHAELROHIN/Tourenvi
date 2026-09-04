/**
 * liveLocationService.ts
 *
 * Converts GPS coordinates (lat/lon) into a human-readable place name.
 *
 * Provider strategy (in priority order):
 *  1. Google Maps Geocoding API — called via backend proxy at
 *     /api/reverse-geocode to keep the API key server-side. Returns
 *     exact road-level addresses and landmark names.
 *  2. BigDataCloud "reverse-geocode-client" endpoint — free, keyless,
 *     CORS-enabled fallback.
 *  3. OpenStreetMap Nominatim — last-resort fallback.
 */

export interface LiveLocationResult {
  placeName: string;
  latitude: number;
  longitude: number;
  source: "google" | "bigdatacloud" | "osm";
}

const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "")
).replace(/\/$/, "");
const BDC_ENDPOINT = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const OSM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

const FETCH_TIMEOUT_MS = 10000;

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Build a short "Locality, State, Country"-style label from BigDataCloud's response. */
function formatBigDataCloud(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const candidates = [
    data.locality,
    data.city,
    data.principalSubdivision,
    data.countryName,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  // Remove consecutive duplicates (e.g. locality === city)
  const deduped = candidates.filter((v, i) => candidates.indexOf(v) === i);

  if (deduped.length === 0) return null;

  return deduped.slice(0, 3).join(", ");
}

/** Build a detailed, accurate place label from Nominatim's address block. */
function formatOsm(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const addr = isRecord(data.address) ? data.address : {};

  // 1. Specific point (junction, road, landmark, building, amenity)
  const specificName =
    addr.junction ||
    addr.road ||
    addr.street ||
    addr.amenity ||
    addr.building ||
    addr.shop ||
    addr.tourism ||
    addr.pedestrian;

  // 2. Immediate village / locality / neighborhood
  const localArea =
    addr.village ||
    addr.hamlet ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.residential ||
    addr.town;

  // 3. City / Municipality / District
  const districtOrCity =
    addr.city ||
    addr.municipality ||
    addr.city_district ||
    addr.county ||
    addr.state_district;

  // 4. State
  const state = addr.state;

  const parts = [
    typeof specificName === "string" ? specificName.trim() : "",
    typeof localArea === "string" ? localArea.trim() : "",
    typeof districtOrCity === "string" ? districtOrCity.trim() : "",
    typeof state === "string" ? state.trim() : "",
  ].filter((v): v is string => v.length > 0);

  // Deduplicate
  const deduped = parts.filter((v, i) => parts.indexOf(v) === i);

  if (deduped.length > 0) return deduped.join(", ");
  return typeof data.display_name === "string" ? data.display_name : null;
}

/**
 * Reverse geocode via OpenStreetMap Nominatim.
 * Uses zoom=18 for exact street & village precision matching Leaflet map tiles.
 */
async function reverseGeocodeOsm(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const url = `${OSM_ENDPOINT}?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal,
      headers: { "Accept-Language": "en", "User-Agent": "Tourenvi-App/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = formatOsm(data);
    if (result) {
      console.log(`[GPS] OSM Nominatim resolved: "${result}"`);
    }
    return result;
  } catch (err) {
    console.warn("[GPS] OSM Nominatim lookup failed:", err);
    return null;
  } finally {
    cancel();
  }
}

/**
 * Reverse geocode via Google Maps Geocoding API through the backend proxy.
 */
async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const url = `${BACKEND_URL}/api/reverse-geocode?lat=${latitude}&lng=${longitude}`;
    console.log(`[GPS] Calling backend reverse-geocode: lat=${latitude}, lng=${longitude}`);
    const res = await fetch(url, { signal });
    if (!res.ok) {
      console.warn(`[GPS] Backend reverse-geocode returned HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.success && data.placeName) {
      console.log(`[GPS] ✅ Google resolved: "${data.placeName}" (source: ${data.source})`);
      return data.placeName;
    }
    console.warn("[GPS] Backend returned success=false or empty placeName:", data);
    return null;
  } catch (err) {
    console.warn("[GPS] Google reverse geocode proxy failed:", err);
    return null;
  } finally {
    cancel();
  }
}

async function reverseGeocodeBigDataCloud(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const url = `${BDC_ENDPOINT}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const result = formatBigDataCloud(data);
    if (result) {
      console.log(`[GPS] BigDataCloud resolved: "${result}"`);
    }
    return result;
  } catch (err) {
    console.warn("[GPS] BigDataCloud lookup failed:", err);
    return null;
  } finally {
    cancel();
  }
}

/**
 * Resolve a lat/lon pair to an exact, human-readable place name.
 * Priority 1: OSM Nominatim (matches the exact Leaflet map data)
 * Priority 2: Google Maps Geocoding
 * Priority 3: BigDataCloud
 */
export async function getLiveLocationName(
  latitude: number,
  longitude: number
): Promise<string | null> {
  console.log(`[GPS] Resolving place name for coordinates: (${latitude}, ${longitude})`);

  // 1. OSM Nominatim (exact match with the Leaflet map dataset)
  const osmResult = await reverseGeocodeOsm(latitude, longitude);
  if (osmResult) return osmResult;

  // 2. Google Maps via backend proxy
  const googleResult = await reverseGeocodeGoogle(latitude, longitude);
  if (googleResult) return googleResult;

  // 3. BigDataCloud (fallback)
  const bdcResult = await reverseGeocodeBigDataCloud(latitude, longitude);
  if (bdcResult) return bdcResult;

  console.error("[GPS] All reverse geocoding providers failed!");
  return null;
}

/**
 * Gets the current GPS position with maximum accuracy.
 *
 * Uses enableHighAccuracy: true which forces the device to use GPS hardware
 * (satellite fix) instead of cell tower / Wi-Fi triangulation, giving
 * accuracy within ~5-20 meters vs ~100-300 meters for low-accuracy mode.
 *
 * If the first attempt returns low accuracy (>200m), it retries once
 * to let the GPS hardware warm up and get a better fix.
 */
export async function getCurrentPositionAsync(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }

    // First attempt — always use high accuracy with no caching
    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: options.timeout || 20000,
      maximumAge: 0, // Never use cached position — always get fresh GPS fix
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        console.log(
          `[GPS] Position acquired: lat=${position.coords.latitude}, lng=${position.coords.longitude}, accuracy=${accuracy}m`
        );

        // If accuracy is good enough (< 200 meters), use it immediately
        if (accuracy <= 200) {
          resolve(position);
          return;
        }

        // If accuracy is poor, retry once with a longer timeout to let GPS warm up
        console.warn(
          `[GPS] First fix accuracy is poor (${accuracy}m). Retrying for better fix...`
        );
        navigator.geolocation.getCurrentPosition(
          (betterPosition) => {
            console.log(
              `[GPS] Retry position: lat=${betterPosition.coords.latitude}, lng=${betterPosition.coords.longitude}, accuracy=${betterPosition.coords.accuracy}m`
            );
            // Use whichever is more accurate
            if (betterPosition.coords.accuracy < accuracy) {
              resolve(betterPosition);
            } else {
              resolve(position);
            }
          },
          () => {
            // Retry failed, use original position
            console.warn("[GPS] Retry failed, using original position.");
            resolve(position);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      },
      (error) => {
        console.error(`[GPS] getCurrentPosition error: code=${error.code}, message=${error.message}`);
        reject(error);
      },
      highAccuracyOptions
    );
  });
}

/**
 * Continuously watches the device's GPS position (for live "you are here"
 * map markers) using navigator.geolocation.watchPosition under the hood.
 * Returns the watch id so the caller can clear it on unmount.
 */
export function watchLiveLocation(
  onUpdate: (position: GeolocationPosition) => void,
  onError?: (error: GeolocationPositionError) => void,
  options: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
): number | null {
  if (!navigator.geolocation) {
    onError?.({
      code: 2,
      message: "GEOLOCATION_UNSUPPORTED",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
    return null;
  }
  return navigator.geolocation.watchPosition(onUpdate, onError, options);
}

/** Stops a watch started with watchLiveLocation. Safe to call with null. */
export function clearLocationWatch(watchId: number | null) {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface RouteResponse {
  geometry?: {
    coordinates?: [number, number][];
  };
  distance?: number;
  duration?: number;
}

/**
 * Fetches driving route geometry from OSRM between start and end coordinates.
 */
export async function getRoute(
  start: Coordinates,
  end: Coordinates
): Promise<RouteResponse | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  } catch (err) {
    console.warn("[liveLocationService] getRoute failed:", err);
    return null;
  }
}