// server.js (FINAL - Google-Only Price Estimation Model)

import express from "express";
import cors from "cors";
import axios from "axios";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// --------------------------- DESTINATION RECOMMENDER ---------------------------
const DESTINATION_DATA = [
  { Destination: "Ooty", Adventure_Score: 4, Relaxation_Score: 3, Cultur_Score: 2, Scenic_Score: 5, Urban_Score: 3, Family_Score: 5, Romantic_Score: 4, Water_Activity_Tag: 1 },
  { Destination: "Madurai", Adventure_Score: 1, Relaxation_Score: 1, Cultur_Score: 5, Scenic_Score: 2, Urban_Score: 4, Family_Score: 4, Romantic_Score: 1, Water_Activity_Tag: 0 },
  { Destination: "Kodaikanal", Adventure_Score: 3, Relaxation_Score: 4, Cultur_Score: 2, Scenic_Score: 4, Urban_Score: 2, Family_Score: 5, Romantic_Score: 5, Water_Activity_Tag: 1 },
  { Destination: "Mahabalipuram", Adventure_Score: 2, Relaxation_Score: 4, Cultur_Score: 5, Scenic_Score: 3, Urban_Score: 1, Family_Score: 5, Romantic_Score: 4, Water_Activity_Tag: 1 },
  { Destination: "Chennai", Adventure_Score: 2, Relaxation_Score: 3, Cultur_Score: 3, Scenic_Score: 2, Urban_Score: 5, Family_Score: 3, Romantic_Score: 3, Water_Activity_Tag: 1 },
  { Destination: "Hogenakkal", Adventure_Score: 5, Relaxation_Score: 2, Cultur_Score: 1, Scenic_Score: 4, Urban_Score: 1, Family_Score: 3, Romantic_Score: 2, Water_Activity_Tag: 1 },
  { Destination: "Valparai", Adventure_Score: 4, Relaxation_Score: 5, Cultur_Score: 1, Scenic_Score: 5, Urban_Score: 1, Family_Score: 4, Romantic_Score: 5, Water_Activity_Tag: 0 },
  { Destination: "Kolli Hills", Adventure_Score: 5, Relaxation_Score: 3, Cultur_Score: 3, Scenic_Score: 4, Urban_Score: 1, Family_Score: 2, Romantic_Score: 3, Water_Activity_Tag: 0 },
  { Destination: "Yercaud", Adventure_Score: 3, Relaxation_Score: 4, Cultur_Score: 2, Scenic_Score: 4, Urban_Score: 2, Family_Score: 4, Romantic_Score: 4, Water_Activity_Tag: 1 },
  { Destination: "Chettinad", Adventure_Score: 1, Relaxation_Score: 2, Cultur_Score: 5, Scenic_Score: 2, Urban_Score: 1, Family_Score: 3, Romantic_Score: 2, Water_Activity_Tag: 0 },

  { Destination: "Rameswaram", Adventure_Score: 1, Relaxation_Score: 1, Cultur_Score: 5, Scenic_Score: 2, Urban_Score: 1, Family_Score: 4, Romantic_Score: 1, Water_Activity_Tag: 1 }
];
const FEATURES = ["Adventure_Score", "Relaxation_Score", "Cultur_Score", "Scenic_Score", "Urban_Score", "Family_Score", "Romantic_Score", "Water_Activity_Tag"];
const moodMap = { "Adventure": "Adventure_Score", "Relaxation": "Relaxation_Score", "Culture/History": "Cultur_Score", "scenary": "Scenic_Score", "Urban Life": "Urban_Score", "Romantic": "Romantic_Score", "Water activity": "Water_Activity_Tag" };
function createUserVector(moods) {
  let userVec = {};
  FEATURES.forEach(f => userVec[f] = 1);
  moods.forEach(m => {
    let key = moodMap[m];
    if (key === "Water_Activity_Tag") userVec[key] = 1;
    else if (key) userVec[key] = 5;
  });
  return userVec;
}
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let key in a) {
    dot += (a[key] || 0) * (b[key] || 0);
    magA += (a[key] || 0) * (a[key] || 0);
    magB += (b[key] || 0) * (b[key] || 0);
  }
  return (magA === 0 || magB === 0) ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
app.post("/recommend", (req, res) => {
  const userVec = createUserVector(req.body.moods);
  const scores = DESTINATION_DATA.map(place => {
    let placeVec = {};
    FEATURES.forEach(f => placeVec[f] = place[f]);
    return { name: place.Destination, score: cosineSimilarity(userVec, placeVec) };
  });
  scores.sort((a, b) => b.score - a.score);
  res.json({ recommendations: scores.slice(0, 5).map(s => s.name) });
});

// ---- CURATED HOTEL PHOTOS (Unsplash CDN - free, no API key) ----
// Category-matched real hotel/accommodation images
const HOTEL_IMAGES = {
  luxury: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618773928121-c32f3da35fee?w=400&h=300&fit=crop&q=80",
  ],
  mid: [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop&q=80",
  ],
  budget: [
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&h=300&fit=crop&q=80",
  ],
  resort: [
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop&q=80",
  ],
  guest_house: [
    "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1586611292717-f828b167408c?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1587381420270-0e56c4412d5e?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585255318859-f5c15f4cffe9?w=400&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80",
  ],
};

// Pick a hotel image based on category + name hash for consistency
function getHotelImage(tags, nameHash, priceLevel) {
  // Priority 1: Direct image URL from OSM tags
  if (tags.image) return tags.image;

  // Priority 2: Wikimedia Commons file
  if (tags.wikimedia_commons) {
    const filename = tags.wikimedia_commons.replace("File:", "").replace(/ /g, "_");
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;
  }

  // Priority 3: Category-matched curated hotel photos
  let category = "mid";
  if (tags.tourism === "resort") category = "resort";
  else if (tags.tourism === "guest_house") category = "guest_house";
  else if (priceLevel >= 3) category = "luxury";
  else if (priceLevel === 1) category = "budget";

  const images = HOTEL_IMAGES[category];
  return images[nameHash % images.length];
}

// Resolve Wikidata image (for hotels with wikidata tag)
async function resolveWikidataImage(wikidataId) {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikidataId}&property=P18&format=json`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "Tourenvi/1.0 (student-project)" },
      timeout: 5000,
    });
    const claims = res.data?.claims?.P18;
    if (claims && claims.length > 0) {
      const filename = claims[0].mainsnak?.datavalue?.value;
      if (filename) {
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename.replace(/ /g, "_"))}?width=400`;
      }
    }
  } catch (e) {
    // Silently fail, will use fallback
  }
  return null;
}

// Resolve Wikipedia page image
async function resolveWikipediaImage(wikiTitle) {
  try {
    // wikiTitle format: "en:Some Hotel" or just "Some Hotel"
    const parts = wikiTitle.split(":");
    const lang = parts.length > 1 ? parts[0] : "en";
    const title = parts.length > 1 ? parts.slice(1).join(":") : wikiTitle;

    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "Tourenvi/1.0 (student-project)" },
      timeout: 5000,
    });
    if (res.data?.thumbnail?.source) {
      return res.data.thumbnail.source;
    }
    if (res.data?.originalimage?.source) {
      return res.data.originalimage.source;
    }
  } catch (e) {
    // Silently fail
  }
  return null;
}

// --------------------------- HOTEL SEARCH (OpenStreetMap - FREE, no API key) ---------------------------
// Uses Nominatim for geocoding + Overpass API for hotel data + Wikidata/Wikipedia for real images
app.get("/get-hotels", async (req, res) => {
  const { destination } = req.query;

  if (!destination) return res.status(400).json({ error: "Destination is required" });

  try {
    // Step 1: Geocode the destination using Nominatim (free, no API key)
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`;
    const geoResponse = await axios.get(geoUrl, {
      headers: { "User-Agent": "Tourenvi/1.0 (student-project)" },
      timeout: 10000,
    });

    if (!geoResponse.data || geoResponse.data.length === 0) {
      return res.status(404).json({ error: "Could not find location: " + destination });
    }

    const { lat, lon } = geoResponse.data[0];
    const radiusMeters = 15000; // 15km search radius

    // Step 2: Query Overpass API for hotels near the location (free, no API key)
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["tourism"="hotel"](around:${radiusMeters},${lat},${lon});
        way["tourism"="hotel"](around:${radiusMeters},${lat},${lon});
        node["tourism"="guest_house"](around:${radiusMeters},${lat},${lon});
        way["tourism"="guest_house"](around:${radiusMeters},${lat},${lon});
        node["tourism"="resort"](around:${radiusMeters},${lat},${lon});
        way["tourism"="resort"](around:${radiusMeters},${lat},${lon});
      );
      out center body 20;
    `;

    // Try primary Overpass server, fallback to secondary
    let overpassResponse;
    const overpassServers = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    for (const overpassUrl of overpassServers) {
      try {
        overpassResponse = await axios.post(overpassUrl, `data=${encodeURIComponent(overpassQuery)}`, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 30000,
        });
        if (overpassResponse.data && overpassResponse.data.elements) break;
      } catch (e) {
        console.warn(`Overpass server ${overpassUrl} failed:`, e.message);
        continue;
      }
    }

    if (!overpassResponse || !overpassResponse.data) {
      return res.status(503).json({ error: "Hotel search is temporarily unavailable. Please try again in a moment." });
    }

    const elements = overpassResponse.data.elements || [];

    if (elements.length === 0) {
      return res.status(404).json({ error: "No hotels found in " + destination });
    }

    // Step 3: Transform OSM data & resolve real images
    const hotelPromises = elements
      .filter((el) => el.tags && el.tags.name)
      .slice(0, 20)
      .map(async (el) => {
        try {
          const tags = el.tags;
          const elLat = el.lat || (el.center && el.center.lat);
          const elLon = el.lon || (el.center && el.center.lon);

          // Build address from OSM tags
          const addrParts = [
            tags["addr:street"],
            tags["addr:city"] || tags["addr:suburb"],
            tags["addr:state"],
            tags["addr:postcode"],
          ].filter(Boolean);
          const latStr = elLat ? elLat.toFixed(4) : "?";
          const lonStr = elLon ? elLon.toFixed(4) : "?";
          const address = addrParts.length > 0
            ? addrParts.join(", ")
            : `${destination} (${latStr}, ${lonStr})`;

          // Generate consistent rating based on the hotel name
          const nameHash = (tags.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
          const stars = tags.stars ? parseFloat(tags.stars) : null;
          const rating = stars || (3.5 + (nameHash % 15) / 10);
          const reviewCount = 50 + (nameHash % 450);

          // Determine price level
          let priceLevel = null;
          if (stars) {
            priceLevel = Math.min(4, Math.max(1, Math.round(stars - 1)));
          } else if (tags.tourism === "resort") {
            priceLevel = 3;
          } else if (tags.tourism === "guest_house") {
            priceLevel = 1;
          } else {
            priceLevel = 1 + (nameHash % 3);
          }

          // ---- IMAGE RESOLUTION (multi-source) ----
          let photoUrl = getHotelImage(tags, nameHash, priceLevel);

          // Try Wikidata/Wikipedia only if no direct image
          try {
            if (!tags.image && !tags.wikimedia_commons && tags.wikidata) {
              const wdImage = await resolveWikidataImage(tags.wikidata);
              if (wdImage) photoUrl = wdImage;
            }
            if (!tags.image && !tags.wikimedia_commons && !tags.wikidata && tags.wikipedia) {
              const wpImage = await resolveWikipediaImage(tags.wikipedia);
              if (wpImage) photoUrl = wpImage;
            }
          } catch (imgErr) {
            // Image resolution failed, use fallback — already set above
          }

          return {
            id: `osm_${el.id}`,
            name: tags.name,
            address: address,
            rating: parseFloat(rating.toFixed(1)),
            user_ratings_total: reviewCount,
            phone: tags.phone || tags["contact:phone"] || null,
            photoUrl: photoUrl,
            price_level: priceLevel,
          };
        } catch (hotelErr) {
          console.warn("Error processing hotel:", el.tags?.name, hotelErr.message);
          return null; // Skip this hotel
        }
      });

    const allHotels = await Promise.all(hotelPromises);
    const hotels = allHotels.filter(Boolean); // Remove nulls from failed hotels

    if (hotels.length === 0) {
      return res.status(404).json({ error: "No hotels found in " + destination });
    }

    res.json({ hotels });
  } catch (error) {
    console.error("Error fetching hotel data:", error.message);
    console.error("Full error:", error.stack || error);
    res.status(500).json({ error: "Failed to fetch hotel data. Please try again." });
  }
});

// --------------------------- FUEL ESTIMATOR (Unchanged) ---------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_PATH = path.join(__dirname, "brand_model_fuel_mileage.csv");
function loadCarsFromCSV(csvPath) {
  try {
    const raw = fs.readFileSync(csvPath, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idxBrand = header.indexOf("brand");
    const idxModel = header.indexOf("model");
    const idxFuel = header.indexOf("fuel_type");
    const idxMileage = header.indexOf("mileage");
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length < 4) continue;
      const brand = parts[idxBrand] || "";
      const model = parts[idxModel] || "";
      const fuel = parts[idxFuel] || "";
      const mileageNum = Number(parts[idxMileage]);
      if (!brand || !model || !fuel || !isFinite(mileageNum)) continue;
      out.push({ brandLower: brand.toLowerCase(), modelLower: model.toLowerCase(), fuelLower: fuel.toLowerCase(), brand, model, fuel, mileage: mileageNum });
    }
    return out;
  } catch (e) {
    console.error("Failed to load CSV:", e.message);
    return [];
  }
}
const carData = loadCarsFromCSV(CSV_PATH);
app.get("/brands", (req, res) => {
  try {
    const map = new Map();
    carData.forEach((c) => { if (!map.has(c.brandLower)) map.set(c.brandLower, c.brand); });
    const brands = Array.from(map.values()).sort();
    res.json(brands);
  } catch (e) { res.status(500).json([]); }
});
app.get("/models", (req, res) => {
  const { brand } = req.query;
  if (!brand) return res.json([]);
  const b = String(brand).toLowerCase();
  const map = new Map();
  carData.filter((car) => car.brandLower === b).forEach((car) => { if (!map.has(car.modelLower)) map.set(car.modelLower, car.model); });
  const models = Array.from(map.values()).sort();
  res.json(models);
});
app.get("/fuel", (req, res) => {
  const { brand, model } = req.query;
  if (!brand || !model) return res.json([]);
  const b = String(brand).toLowerCase();
  const m = String(model).toLowerCase();
  const map = new Map();
  carData.filter((car) => car.brandLower === b && car.modelLower === m).forEach((car) => { if (!map.has(car.fuelLower)) map.set(car.fuelLower, car.fuel); });
  const fuels = Array.from(map.values()).sort();
  res.json(fuels);
});
app.get("/mileage", (req, res) => {
  const { brand, model, fuel } = req.query;
  if (!brand || !model || !fuel) return res.json({ mileage: null });
  const b = String(brand).toLowerCase();
  const m = String(model).toLowerCase();
  const f = String(fuel).toLowerCase();
  const match = carData.find((car) => car.brandLower === b && car.modelLower === m && car.fuelLower === f);
  res.json({ mileage: match ? match.mileage : null });
});

const tollRatesPer100km = {
  twoWheeler: 30,
  car: 80,
  suv: 120,
  tempo: 160,
};

const knownCorridors = [
  { key: ["mumbai", "pune"], toll: 300, label: "Mumbai-Pune Corridor" },
  { key: ["delhi", "jaipur"], toll: 420, label: "Delhi-Jaipur Corridor" },
  { key: ["chennai", "bangalore"], toll: 380, label: "Chennai-Bangalore Corridor" },
  { key: ["hyderabad", "bangalore"], toll: 540, label: "Hyderabad-Bangalore Corridor" },
  { key: ["bangalore", "mysore"], toll: 165, label: "Bangalore-Mysore Corridor" },
  { key: ["chennai", "pondicherry"], toll: 120, label: "Chennai-Pondicherry Corridor" },
];

async function geocodeLocation(place) {
  const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
  const geoResponse = await axios.get(geoUrl, {
    headers: { "User-Agent": "Tourenvi/1.0 (student-project)" },
    timeout: 10000,
  });
  if (!geoResponse.data || geoResponse.data.length === 0) {
    throw new Error(`Place not found: ${place}`);
  }
  return {
    lat: Number(geoResponse.data[0].lat),
    lon: Number(geoResponse.data[0].lon),
  };
}

async function getRouteDistanceKm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const routeResponse = await axios.get(url, { timeout: 15000 });
  const route = routeResponse.data?.routes?.[0];
  if (!route) {
    throw new Error("Unable to calculate route distance");
  }
  return route.distance / 1000;
}

app.post("/api/toll-estimate", async (req, res) => {
  const { startLocation, destinations = [], vehicleType = "car" } = req.body || {};

  if (!startLocation || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: "startLocation and destinations[] are required" });
  }

  const rate = tollRatesPer100km[vehicleType] || tollRatesPer100km.car;
  const breakdown = [];
  let total = 0;

  try {
    let previous = startLocation;
    for (const destination of destinations) {
      const from = await geocodeLocation(previous);
      const to = await geocodeLocation(destination);
      const distanceKm = await getRouteDistanceKm(from, to);
      const toll = Math.round((distanceKm / 100) * rate);
      breakdown.push({
        segment: `${previous} -> ${destination}`,
        distanceKm: Number(distanceKm.toFixed(1)),
        toll,
      });
      total += toll;
      previous = destination;
    }

    const routeText = `${startLocation} ${destinations.join(" ")}`.toLowerCase();
    knownCorridors.forEach((corridor) => {
      const hit = corridor.key.every((k) => routeText.includes(k));
      if (hit) {
        breakdown.push({ segment: corridor.label, distanceKm: 0, toll: corridor.toll });
        total += corridor.toll;
      }
    });

    return res.json({
      estimatedToll: total,
      breakdown,
      disclaimer: "Estimate based on OSRM distance and known corridor toll overrides. Actual toll may vary.",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to estimate toll" });
  }
});

const metroCities = ["chennai", "mumbai", "delhi", "hyderabad", "bengaluru", "kolkata", "pune", "jaipur"];
const hillStations = ["ooty", "manali", "coorg", "munnar", "kodaikanal", "wayanad"];
const beaches = ["goa", "varkala", "rameswaram", "pondicherry"];
const pilgrimages = ["varanasi", "tirupati", "shirdi", "madurai"];

function resolveSeasonType(month, destinationType) {
  if (destinationType === "hill") {
    if ([10, 11, 12, 1].includes(month)) return { season: "Peak Season", multiplier: 1.5 };
    if ([4, 5, 6].includes(month)) return { season: "Off Season", multiplier: 0.7 };
    return { season: "Shoulder", multiplier: 1.0 };
  }
  if (destinationType === "beach") {
    if ([11, 12, 1, 2].includes(month)) return { season: "Peak Season", multiplier: 1.4 };
    if ([6, 7, 8, 9].includes(month)) return { season: "Off Season", multiplier: 0.8 };
    return { season: "Shoulder", multiplier: 1.0 };
  }
  if (destinationType === "pilgrimage") {
    if ([10, 11, 12, 1, 2, 3].includes(month)) return { season: "Peak Season", multiplier: 1.3 };
    return { season: "Shoulder", multiplier: 1.0 };
  }
  return { season: "Shoulder", multiplier: 1.0 };
}

app.post("/api/predict-hotel-cost", (req, res) => {
  const { destination = "", checkIn, checkOut, members = 2, budgetType = "mid" } = req.body || {};
  const city = String(destination).toLowerCase();

  let basePrice = 1000;
  let destinationType = "other";
  if (metroCities.includes(city)) {
    basePrice = 2500;
    destinationType = "metro";
  } else if (hillStations.includes(city)) {
    basePrice = 1800;
    destinationType = "hill";
  } else if (beaches.includes(city)) {
    basePrice = 2000;
    destinationType = "beach";
  } else if (pilgrimages.includes(city)) {
    basePrice = 1200;
    destinationType = "pilgrimage";
  }

  const checkInDate = checkIn ? new Date(checkIn) : new Date();
  const checkOutDate = checkOut ? new Date(checkOut) : new Date(checkInDate.getTime() + 86400000);
  const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));

  const seasonInfo = resolveSeasonType(checkInDate.getMonth() + 1, destinationType);
  const budgetMultiplier = budgetType === "budget" ? 0.5 : budgetType === "luxury" ? 2.5 : 1.0;

  const holidaySpikeMonths = [1, 10, 11, 12];
  const holidayMultiplier = holidaySpikeMonths.includes(checkInDate.getMonth() + 1) ? 1.2 : 1.0;

  const rooms = Math.max(1, Math.ceil(Number(members) / 2));
  const perNight = Math.round(basePrice * seasonInfo.multiplier * budgetMultiplier * holidayMultiplier * rooms);
  const totalCost = perNight * nights;

  return res.json({
    perNight,
    totalCost,
    season: seasonInfo.season,
    priceRange: `${Math.round(perNight * 0.9)} - ${Math.round(perNight * 1.2)}`,
    tip:
      seasonInfo.season === "Peak Season"
        ? "Book 3-4 weeks early for better rates"
        : "You can usually find same-week deals in this season",
  });
});

// --------------------------- HEALTH CHECK (for Render) ---------------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Tourenvi Backend is running!" });
});

// --------------------------- SERVER START ---------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}. Using OpenStreetMap (FREE) for hotel data.`));