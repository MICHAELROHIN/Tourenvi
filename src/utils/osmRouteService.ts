// Handles routing and geocoding using free OpenStreetMap APIs

export async function geocodePlace(place: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    place
  )}&limit=1&accept-language=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "RoutePlannerApp/1.0" },
  });
  const data = await res.json();
  if (!data.length) throw new Error("Place not found");
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

export async function getRoute(from: { lat: number; lon: number }, to: { lat: number; lon: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&alternatives=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("Route not found");
  return data.routes[0];
}
