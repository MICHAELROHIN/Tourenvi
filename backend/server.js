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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INDIA_TOURISM_DATASET_PATH = path.join(__dirname, "india_tourism_dataset.json");

function loadIndiaTourismDataset(datasetPath) {
  try {
    const raw = fs.readFileSync(datasetPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn("india_tourism_dataset.json is not an array.");
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to load india_tourism_dataset.json:", error.message);
    return [];
  }
}

const INDIA_TOURISM_DATASET = loadIndiaTourismDataset(INDIA_TOURISM_DATASET_PATH);

const GENERIC_LOCATION_TOKENS = new Set([
  "and",
  "the",
  "of",
  "in",
  "to",
  "city",
  "town",
  "state",
  "district",
  "region",
  "hills",
  "hill",
  "valley",
  "beach",
  "coast",
  "lake",
  "river",
  "falls",
  "waterfall",
  "mountain",
  "mountains",
  "park",
  "fort",
  "temple",
  "desert",
  "island",
  "route",
]);

const LEGACY_DESTINATION_ALIASES = {
  ooty: "Ooty (Udhagamandalam)",
  mahabalipuram: "Mamallapuram (Mahabalipuram) & Coromandel Heritage Coast",
  rameswaram: "Rameswaram & Pamban Coast (Sacred Water Walk)",
  yercaud: "Ooty (Udhagamandalam)",
  kodaikanal: "Ooty (Udhagamandalam)",
  valparai: "Ooty (Udhagamandalam)",
  "kolli hills": "Ooty (Udhagamandalam)",
  hogenakkal: "Ooty (Udhagamandalam)",
  chennai: "Mamallapuram (Mahabalipuram) & Coromandel Heritage Coast",
  madurai: "Tiruvannamalai & Arunachala (Inner Fire Journey)",
  chettinad: "Tiruvannamalai & Arunachala (Inner Fire Journey)",
  pondicherry: "Pondicherry (Puducherry)",
  puducherry: "Pondicherry (Puducherry)",
};

function normalizeLookupText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashText(value) {
  return normalizeLookupText(value).split("").reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }, 0);
}

const ATTRACTION_IMAGE_HINTS = {
  "french quarter white town": ["White Town, Puducherry", "French Quarter, Puducherry", "Puducherry"],
  "seafront promenade": ["Promenade Beach, Puducherry", "Puducherry"],
  "sri aurobindo ashram": ["Sri Aurobindo Ashram", "Puducherry"],
  auroville: ["Auroville", "Puducherry"],
  "rock beach": ["Rock Beach, Puducherry", "Puducherry"],
  "baga beach": ["Baga Beach", "Goa"],
  "calangute beach": ["Calangute Beach", "Goa"],
  "old goa churches": ["Basilica of Bom Jesus", "Se Cathedral, Goa", "Old Goa"],
  "fort aguada": ["Fort Aguada", "Goa"],
  "dudhsagar falls": ["Dudhsagar Falls", "Goa"],
  "spice plantations": ["Goa", "Spice plantation"],
  "ooty lake": ["Ooty Lake", "Udhagamandalam"],
  "botanical gardens": ["Government Botanical Garden, Ooty", "Ooty"],
  "doddabetta peak": ["Doddabetta", "Ooty"],
  "rose garden": ["Government Rose Garden, Ooty", "Ooty"],
  "pykara waterfalls": ["Pykara Falls", "Ooty"],
  "avalanche lake": ["Avalanche Lake", "Ooty"],
};

const ATTRACTION_IMAGE_CACHE = new Map();

async function fetchWikipediaImageForQuery(query) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) return null;

  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(normalizedQuery)}&format=json&origin=*`;
  const searchResponse = await axios.get(searchUrl, {
    headers: { "User-Agent": "Tourenvi/1.0 (student-project)" },
    timeout: 10000,
  });

  const title = searchResponse.data?.query?.search?.[0]?.title;
  if (!title) return null;

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResponse = await axios.get(summaryUrl, {
    headers: { "User-Agent": "Tourenvi/1.0 (student-project)" },
    timeout: 10000,
  });

  return summaryResponse.data?.thumbnail?.source || summaryResponse.data?.originalimage?.source || null;
}

function extractLookupTokens(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return [];

  const tokenSet = new Set();
  const addToken = (candidate) => {
    const normalized = normalizeLookupText(candidate);
    if (normalized) tokenSet.add(normalized);
  };

  addToken(value);
  addToken(value.replace(/\([^)]*\)/g, " "));

  const bracketMatches = value.match(/\(([^)]+)\)/g) || [];
  for (const match of bracketMatches) {
    addToken(match.replace(/[()]/g, ""));
  }

  for (const piece of value.split(/[,/&|-]/)) {
    addToken(piece);
  }

  return Array.from(tokenSet);
}

function tokenizeMeaningful(value) {
  return normalizeLookupText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !GENERIC_LOCATION_TOKENS.has(token));
}

function buildDestinationTokens(record) {
  const tokenSet = new Set();
  const fields = [record.destination_name, record.state, record.district];
  for (const field of fields) {
    for (const token of extractLookupTokens(field)) {
      tokenSet.add(token);
    }
  }
  return Array.from(tokenSet);
}

const DATASET_MOOD_KEYWORDS = {
  adventure: ["adventure", "trek", "wildlife", "mountain", "camp", "expedition", "road trip"],
  relaxation: ["relaxation", "wellness", "beach", "backwater", "spa", "retreat", "nature"],
  "culture history": ["cultural", "history", "heritage", "spiritual", "pilgrimage", "temple"],
  scenary: ["scenic", "nature", "photography", "mountain", "hill", "lake", "valley"],
  "urban life": ["food", "nightlife", "shopping", "urban", "city", "market"],
  romantic: ["romantic", "honeymoon", "couple", "sunset", "beach", "hill"],
  "water activity": ["beach", "water", "backwater", "river", "lake", "island", "cruise"],
};

const INDIA_DESTINATION_INDEX = INDIA_TOURISM_DATASET.map((record) => ({
  record,
  tokens: buildDestinationTokens(record),
  meaningfulTokens: buildDestinationTokens(record).flatMap((token) => tokenizeMeaningful(token)),
  searchBlob: normalizeLookupText(
    [
      ...(Array.isArray(record.trip_types) ? record.trip_types : []),
      ...(Array.isArray(record.activities_available) ? record.activities_available : []),
      ...(Array.isArray(record.primary_attractions) ? record.primary_attractions : []),
      ...(Array.isArray(record.hidden_gems) ? record.hidden_gems : []),
      record.unique_experiences,
    ]
      .filter(Boolean)
      .join(" ")
  ),
}));

function scoreDestinationMatch(query, destinationTokens) {
  let bestScore = 0;

  for (const token of destinationTokens) {
    if (!token) continue;

    if (token === query) {
      bestScore = Math.max(bestScore, 100);
      continue;
    }

    if (token.startsWith(query) || query.startsWith(token)) {
      bestScore = Math.max(bestScore, 90);
      continue;
    }

    if (token.includes(query) || query.includes(token)) {
      bestScore = Math.max(bestScore, 75);
      continue;
    }

    const queryWords = query.split(" ").filter(Boolean);
    const tokenWords = new Set(token.split(" ").filter(Boolean));
    if (queryWords.length === 0) continue;

    let overlap = 0;
    for (const word of queryWords) {
      if (tokenWords.has(word)) overlap += 1;
    }

    if (overlap > 0) {
      const overlapRatio = overlap / queryWords.length;
      bestScore = Math.max(bestScore, 40 + overlapRatio * 30);
    }
  }

  return bestScore;
}

function findDestinationInDataset(destination) {
  const normalizedQuery = normalizeLookupText(destination);
  if (!normalizedQuery) return null;

  const exactMatch = INDIA_DESTINATION_INDEX.find((item) => {
    const destinationName = normalizeLookupText(item.record.destination_name);
    const stateName = normalizeLookupText(item.record.state);
    return destinationName === normalizedQuery || stateName === normalizedQuery;
  });

  if (exactMatch) {
    return {
      ...exactMatch,
      score: 100,
      exactMatch: true,
    };
  }

  const aliasTarget = LEGACY_DESTINATION_ALIASES[normalizedQuery];
  if (aliasTarget) {
    const normalizedAlias = normalizeLookupText(aliasTarget);
    const aliasMatch = INDIA_DESTINATION_INDEX.find((item) => {
      const destinationName = normalizeLookupText(item.record.destination_name);
      return destinationName === normalizedAlias || item.tokens.includes(normalizedAlias);
    });

    if (aliasMatch) {
      return {
        ...aliasMatch,
        score: 96,
        aliasApplied: true,
      };
    }
  }

  let bestMatch = null;
  for (const item of INDIA_DESTINATION_INDEX) {
    const score = scoreDestinationMatch(normalizedQuery, item.tokens);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { ...item, score };
    }
  }

  if (!bestMatch || bestMatch.score < 45) return null;

  const queryTokens = tokenizeMeaningful(normalizedQuery);
  if (queryTokens.length > 0) {
    const candidateTokenSet = new Set(bestMatch.meaningfulTokens || []);
    const hasMeaningfulOverlap = queryTokens.some((token) => candidateTokenSet.has(token));
    if (!hasMeaningfulOverlap && bestMatch.score < 90) {
      return null;
    }
  }

  return bestMatch;
}

function suggestDestinationsByText(destination, limit = 6) {
  const normalizedQuery = normalizeLookupText(destination);
  const meaningfulQueryTokens = tokenizeMeaningful(normalizedQuery);

  const ranked = INDIA_DESTINATION_INDEX.map((item) => {
    const name = item.record.destination_name || item.record.state;
    const popularity = Number(item.record.popularity_score) || 0;
    const score = scoreDestinationMatch(normalizedQuery, item.tokens);

    const overlap = meaningfulQueryTokens.length
      ? meaningfulQueryTokens.filter((token) => item.meaningfulTokens.includes(token)).length
      : 0;

    return {
      name,
      rankScore: score + overlap * 8 + popularity * 0.3,
    };
  }).filter((item) => item.name);

  ranked.sort((a, b) => b.rankScore - a.rankScore || a.name.localeCompare(b.name));
  return ranked.slice(0, limit).map((item) => item.name);
}

function scoreDatasetRecommendation(item, normalizedMoods) {
  let score = Number(item.record.popularity_score) || 0;
  score = score / 10;

  for (const mood of normalizedMoods) {
    const keywords = DATASET_MOOD_KEYWORDS[mood] || [mood];
    let moodScore = 0;

    for (const keyword of keywords) {
      const normalizedKeyword = normalizeLookupText(keyword);
      if (!normalizedKeyword) continue;

      const tripTypes = Array.isArray(item.record.trip_types) ? item.record.trip_types : [];
      const hasTripTypeMatch = tripTypes.some((tripType) => {
        const normalizedTripType = normalizeLookupText(tripType);
        return (
          normalizedTripType.includes(normalizedKeyword) ||
          normalizedKeyword.includes(normalizedTripType)
        );
      });

      if (hasTripTypeMatch) {
        moodScore = Math.max(moodScore, 1.5);
      } else if (item.searchBlob.includes(normalizedKeyword)) {
        moodScore = Math.max(moodScore, 1.0);
      }
    }

    score += moodScore;
  }

  return score;
}

function recommendDestinationsFromDataset(moods, limit = 6) {
  if (!INDIA_DESTINATION_INDEX.length) return [];

  const normalizedMoods = Array.isArray(moods)
    ? moods.map((mood) => normalizeLookupText(mood)).filter(Boolean)
    : [];

  const ranked = INDIA_DESTINATION_INDEX
    .map((item) => ({
      name: item.record.destination_name || item.record.state,
      score: scoreDatasetRecommendation(item, normalizedMoods),
      popularity: Number(item.record.popularity_score) || 0,
    }))
    .filter((item) => item.name);

  ranked.sort(
    (a, b) => b.score - a.score || b.popularity - a.popularity || a.name.localeCompare(b.name)
  );

  return ranked.slice(0, limit).map((item) => item.name);
}

async function buildPlaceEntriesFromDataset(record, limit) {
  const buckets = [
    { values: record.primary_attractions, category: "Primary attraction" },
    { values: record.hidden_gems, category: "Hidden gem" },
    { values: record.activities_available, category: "Activity" },
  ];

  const places = [];
  const seen = new Set();

  for (const bucket of buckets) {
    const values = Array.isArray(bucket.values) ? bucket.values : [];
    values.forEach((entry, index) => {
      const name = String(entry || "").trim();
      if (!name) return;

      const key = normalizeLookupText(name);
      if (!key || seen.has(key)) return;
      seen.add(key);

      places.push({
        id: `dataset_${record.id}_${bucket.category.replace(/\s+/g, "_").toLowerCase()}_${index + 1}`,
        name,
        category: bucket.category,
        openStatus: "Not specified in dataset",
        operationalStatus: "Not specified in dataset",
        entryFee: "Not specified in dataset",
        entryFeeAmount: null,
        entryFeeCurrency: "INR",
        imageUrl: getAttractionImageUrl(name, record.destination_name || record.state || ""),
        description: `Recommended ${bucket.category.toLowerCase()} in ${record.destination_name || record.state || "this destination"}.`,
        source: "india_tourism_dataset",
      });
    });

    if (places.length >= limit) break;
  }

  return places.slice(0, limit);
}

async function getAttractionImageUrl(placeName, destinationKey = "") {
  const lowercasePlace = normalizeLookupText(placeName);
  const lowercaseDestination = normalizeLookupText(destinationKey);
  const seed = Math.abs(hashText(`${lowercaseDestination}|${lowercasePlace}`));

  const imagePools = {
    lake: [
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop&q=80",
    ],
    garden: [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&auto=format&fit=crop&q=80",
    ],
    beach: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop&q=80",
    ],
    heritage: [
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524492412937-4961afc8e3f3?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&auto=format&fit=crop&q=80",
    ],
    waterfall: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80",
    ],
    mountains: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=1200&auto=format&fit=crop&q=80",
    ],
    fort: [
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506891463900-479c5e1f9f5b?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200&auto=format&fit=crop&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&auto=format&fit=crop&q=80",
    ],
  };

  const resolveFromPool = (pool) => pool[seed % pool.length];

  const cacheKey = `${lowercaseDestination}|${lowercasePlace}`;
  if (ATTRACTION_IMAGE_CACHE.has(cacheKey)) {
    return ATTRACTION_IMAGE_CACHE.get(cacheKey);
  }

  const queryCandidates = [
    ...(ATTRACTION_IMAGE_HINTS[lowercasePlace] || []),
    placeName,
    `${placeName}, ${destinationKey}`,
    destinationKey,
  ].filter(Boolean);

  for (const candidate of queryCandidates) {
    try {
      const wikiImage = await fetchWikipediaImageForQuery(candidate);
      if (wikiImage) {
        ATTRACTION_IMAGE_CACHE.set(cacheKey, wikiImage);
        return wikiImage;
      }
    } catch {
      // Try the next candidate.
    }
  }

  if (lowercasePlace.includes("lake")) return resolveFromPool(imagePools.lake);
  if (lowercasePlace.includes("garden") || lowercasePlace.includes("park") || lowercasePlace.includes("rose")) return resolveFromPool(imagePools.garden);
  if (lowercasePlace.includes("beach") || lowercaseDestination.includes("goa") || lowercaseDestination.includes("puducherry") || lowercaseDestination.includes("pondicherry")) return resolveFromPool(imagePools.beach);
  if (lowercasePlace.includes("temple") || lowercasePlace.includes("church") || lowercasePlace.includes("mosque") || lowercasePlace.includes("monument")) return resolveFromPool(imagePools.heritage);
  if (lowercasePlace.includes("waterfall") || lowercasePlace.includes("falls")) return resolveFromPool(imagePools.waterfall);
  if (lowercasePlace.includes("peak") || lowercasePlace.includes("hill") || lowercasePlace.includes("mountain") || lowercasePlace.includes("doddabetta")) return resolveFromPool(imagePools.mountains);
  if (lowercasePlace.includes("fort")) return resolveFromPool(imagePools.fort);
  const fallback = resolveFromPool(imagePools.default);
  ATTRACTION_IMAGE_CACHE.set(cacheKey, fallback);
  return fallback;
}

async function buildAttractionCards(placeNames, destinationKey, sourceLabel, limit = 6) {
  const seen = new Set();
  const entries = (Array.isArray(placeNames) ? placeNames : [])
    .map((entry, index) => String(entry || "").trim())
    .filter(Boolean)
    .filter((entry) => {
      const normalized = normalizeLookupText(entry);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, limit);

  const cards = [];
  for (let index = 0; index < entries.length; index++) {
    const name = entries[index];
    cards.push({
      id: `${normalizeLookupText(sourceLabel || destinationKey || "destination") || "destination"}_${index + 1}`,
      name,
      image: await getAttractionImageUrl(name, destinationKey),
      description: `Recommended from ${sourceLabel || "the tourism dataset"} for ${destinationKey || "this destination"}.`,
    });
  }

  return cards;
}

function buildDestinationMeta(record) {
  const asRange = (value) => {
    if (!Array.isArray(value) || value.length < 2) return null;
    const [min, max] = value;
    const minNum = Number(min);
    const maxNum = Number(max);
    if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) return null;
    return [minNum, maxNum];
  };

  return {
    destinationName: record.destination_name || null,
    state: record.state || null,
    district: record.district || null,
    region: record.region || null,
    accessibility: record.accessibility || null,
    popularityScore: Number(record.popularity_score) || null,
    bestSeasons: Array.isArray(record.best_seasons) ? record.best_seasons : [],
    avoidSeasons: Array.isArray(record.avoid_seasons) ? record.avoid_seasons : [],
    peakTouristSeason: record.peak_tourist_season || null,
    offSeason: record.off_season || null,
    minimumDays: Number(record.minimum_days) || null,
    idealDays: Number(record.ideal_days) || null,
    maximumDays: Number(record.maximum_days) || null,
    permitsRequired: Boolean(record.permits_required),
    permitsDetails: record.permits_details || null,
    nearestAirport: record.nearest_airport || null,
    nearestRailwayStation: record.nearest_railway_station || null,
    nearestMajorCity: record.nearest_major_city || null,
    budgetActivitiesRange: asRange(record?.budget_category?.activities_range),
    midActivitiesRange: asRange(record?.mid_range_category?.activities_range),
    luxuryActivitiesRange: asRange(record?.luxury_category?.activities_range),
    budgetDailyRange: asRange(record?.budget_category?.total_daily_range),
    midDailyRange: asRange(record?.mid_range_category?.total_daily_range),
    luxuryDailyRange: asRange(record?.luxury_category?.total_daily_range),
    foodScene: record.food_scene || null,
    specialConsiderations: record.special_considerations || null,
    uniqueExperiences: record.unique_experiences || null,
    suggestedItinerary: record.suggested_itinerary || null,
    safetyRating: Number(record.safety_rating) || null,
    safetyNotes: record.safety_notes || null,
  };
}

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
function createUserVector(moods = []) {
  let userVec = {};
  FEATURES.forEach(f => userVec[f] = 1);
  (Array.isArray(moods) ? moods : []).forEach(m => {
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
  const moods = Array.isArray(req.body?.moods) ? req.body.moods : [];

  if (INDIA_DESTINATION_INDEX.length > 0) {
    const recommendations = recommendDestinationsFromDataset(moods, 6);
    return res.json({ recommendations });
  }

  const userVec = createUserVector(moods);
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

// --------------------------- DESTINATION PLACES (India Tourism Dataset) ---------------------------
app.get("/get-destination-places", async (req, res) => {
  const destination = String(req.query.destination || "").trim();
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(500, Math.floor(requestedLimit))
    : Number.MAX_SAFE_INTEGER;

  if (!destination) {
    return res.status(400).json({ error: "Destination is required" });
  }

  if (!INDIA_DESTINATION_INDEX.length) {
    return res.status(503).json({ error: "Tourism dataset is unavailable." });
  }

  const match = findDestinationInDataset(destination);
  if (!match) {
    return res.status(404).json({
      error: `No matching destination found in india_tourism_dataset for '${destination}'.`,
      suggestions: suggestDestinationsByText(destination, 6),
    });
  }

  const places = await buildPlaceEntriesFromDataset(match.record, limit);
  if (!places.length) {
    return res.status(404).json({
      error: `No places available in india_tourism_dataset for '${match.record.destination_name || destination}'.`,
    });
  }

  return res.json({
    destination,
    matchedDestination: match.record.destination_name || match.record.state || destination,
    matchScore: Number(match.score.toFixed(1)),
    totalPlaces: places.length,
    source: "india_tourism_dataset",
    fetchedAt: new Date().toISOString(),
    destinationMeta: buildDestinationMeta(match.record),
    places,
  });
});

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

// Helper to geocode a place name using Nominatim
async function geocodePlace(name) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "Tourenvi/1.0 (student-project)" },
      timeout: 5000,
    });
    if (res.data && res.data.length > 0) {
      return {
        lat: parseFloat(res.data[0].lat),
        lon: parseFloat(res.data[0].lon),
        display_name: res.data[0].display_name
      };
    }
  } catch (err) {
    console.warn("Geocoding failed for:", name, err.message);
  }
  return null;
}

// Great-circle distance between two coordinates in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// --------------------------- ELITE ITINERARY BUILDER ---------------------------
app.post("/api/build-itinerary", async (req, res) => {
  const { tripData } = req.body;
  
  if (!tripData) {
    return res.status(400).json({ error: "No trip data provided" });
  }

  // 1. EXTRACT PARAMETERS WITH FALLBACK TO CURRENT TRIP DATA
  const source = req.body.source || tripData.startLocation || "Chennai";
  const destination = req.body.destination || tripData.destinations?.[0] || "Ooty";
  
  // Parse Start Date and End Date to calculate totalDays dynamically
  const startDateStr = req.body.startDate || tripData.startDate;
  const endDateStr = req.body.endDate || tripData.endDate;
  let totalDays = req.body.totalDays || 3;
  
  if (startDateStr && endDateStr) {
    const startD = new Date(startDateStr);
    const endD = new Date(endDateStr);
    const diffTime = Math.abs(endD.getTime() - startD.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    if (diffDays > 0) {
      totalDays = diffDays;
    }
  }

  const vehicleMileage = req.body.vehicleMileage || tripData.mileage || 15;
  const fuelType = req.body.fuelType || tripData.fuelType || "petrol";
  const budgetLimit = req.body.budgetLimit || tripData.budgetCap || 50000;
  
  const rawPreference = req.body.hotelPreference || tripData.lodgingType?.[0] || "Premium";
  let hotelPreference = "Premium";
  if (rawPreference.toLowerCase().includes("luxury")) hotelPreference = "Luxury";
  if (rawPreference.toLowerCase().includes("eco") || rawPreference.toLowerCase().includes("budget") || rawPreference.toLowerCase().includes("economy")) hotelPreference = "Economy";
  
  const tripType = tripData.tripType || "family";
  const groupSize = req.body.groupSize || tripData.numberOfMembers || (tripType === "solo" ? 1 : tripType === "family" ? 4 : 8);

  // Geocode locations to get coordinates
  const startCoords = await geocodePlace(source) || { lat: 13.0827, lon: 80.2707 }; // Chennai fallback
  const endCoords = await geocodePlace(destination) || { lat: 11.4102, lon: 76.6950 }; // Ooty fallback

  // Calculate Great-Circle road distance
  const aerialDistance = calculateDistanceKm(startCoords.lat, startCoords.lon, endCoords.lat, endCoords.lon);
  const mockDistanceKm = Math.round(aerialDistance * 1.3) || 450; 
  const roundTripDistance = mockDistanceKm * 2; // Round-trip distance

  // 2. COMPUTE INDIVIDUAL COST NODES
  
  // Fuel (Petrol/Diesel/EV) Cost
  const regionalFuelPrice = fuelType === "diesel" ? 92 : fuelType === "ev" ? 2.0 : 103;
  const fuelCost = Math.round((roundTripDistance / vehicleMileage) * regionalFuelPrice);
  
  // Hotel Cost
  const roomsRequired = Math.ceil(groupSize / 2);
  const dailyBaseRate = hotelPreference === "Luxury" ? 12000 : hotelPreference === "Premium" ? 6000 : 2500;
  const hotelCost = dailyBaseRate * (totalDays - 1) * roomsRequired;

  // Car Rental Cost
  const vehicleType = tripData.vehicleType || "car";
  const dailyRentalFee = vehicleType === "bike" ? 1500 : vehicleType === "car" ? 4500 : 3500;
  const carRentalCost = dailyRentalFee * totalDays;

  // Food Cost
  const foodCost = 800 * groupSize * totalDays;

  // Places to Visit (Sightseeing)
  const sightseeingCost = 300 * groupSize * totalDays;

  // Compute Total
  const totalCalculatedTripCost = fuelCost + hotelCost + carRentalCost + foodCost + sightseeingCost;

  // 3. STRICT BUDGET VALIDATION CHECK
  if (totalCalculatedTripCost > budgetLimit) {
    return res.status(422).json({
      success: false,
      error: "Cannot estimate within the given budget.",
      financials: {
        fuelCost,
        hotelCost,
        carRentalCost,
        foodCost,
        sightseeingCost,
        totalCost: totalCalculatedTripCost
      },
      budgetLimit,
      message: `Cannot estimate within the given budget. Total estimate is ₹${totalCalculatedTripCost.toLocaleString()} (Fuel: ₹${fuelCost.toLocaleString()}, Hotel: ₹${hotelCost.toLocaleString()}, Rental: ₹${carRentalCost.toLocaleString()}, Food: ₹${foodCost.toLocaleString()}, Sightseeing: ₹${sightseeingCost.toLocaleString()}), which exceeds your limit of ₹${budgetLimit.toLocaleString()}. Please increase your budget limit or modify your travel preferences.`
    });
  }

  // Green Emission Score
  let emissionPerKm = 0.12; 
  if (fuelType === "diesel") emissionPerKm = 0.15;
  if (fuelType === "ev") emissionPerKm = 0.0;
  const greenEmissionScore = mockDistanceKm * emissionPerKm;
  
  const destinationNodes = Array.isArray(tripData.destinations) && tripData.destinations.length > 0
    ? tripData.destinations.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [destination];

  const destinationAttractions = await Promise.all(destinationNodes.map(async (destinationNode, index) => {
    const normalizedDestination = normalizeLookupText(destinationNode);
    const matchedRecord = (typeof INDIA_TOURISM_DATASET !== "undefined" ? INDIA_TOURISM_DATASET : []).find((record) => {
      const destinationName = normalizeLookupText(record.destination_name || "");
      const stateName = normalizeLookupText(record.state || "");
      const districtName = normalizeLookupText(record.district || "");

      return (
        destinationName === normalizedDestination ||
        stateName === normalizedDestination ||
        districtName.includes(normalizedDestination) ||
        normalizedDestination.includes(destinationName)
      );
    });

    const primary = Array.isArray(matchedRecord?.primary_attractions) ? matchedRecord.primary_attractions : [];
    const hidden = Array.isArray(matchedRecord?.hidden_gems) ? matchedRecord.hidden_gems : [];
    const activitySeeds = [...primary, ...hidden];

    const fallbackAttractions = normalizedDestination.includes("goa")
      ? ["Baga Beach", "Calangute Beach", "Old Goa Churches", "Fort Aguada", "Dudhsagar Falls", "Spice Plantations"]
      : normalizedDestination.includes("ooty")
        ? ["Ooty Lake", "Botanical Gardens", "Doddabetta Peak", "Rose Garden", "Pykara Waterfalls", "Avalanche Lake"]
        : normalizedDestination.includes("madurai")
          ? ["Meenakshi Amman Temple", "Thirumalai Nayakkar Mahal", "Gandhi Memorial Museum", "Alagar Kovil", "Samanar Hills", "Vaigai Riverfront"]
          : ["City Center Exploration", "Local Heritage Walk", "Scenic Viewpoint Visit", "Traditional Culinary Experience", "Local Market Shopping"];

    const attractionCards = await buildAttractionCards(
      activitySeeds.length > 0 ? activitySeeds : fallbackAttractions,
      matchedRecord?.destination_name || matchedRecord?.state || destinationNode,
      matchedRecord?.destination_name || destinationNode,
      6,
    );

    return {
      id: `destination-node-${index + 1}`,
      destination: destinationNode,
      matchedDestination: matchedRecord?.destination_name || matchedRecord?.state || destinationNode,
      region: matchedRecord?.region || null,
      attractions: attractionCards,
    };
  }));

  const richPlaces = destinationAttractions.flatMap((group) =>
    group.attractions.map((place, placeIndex) => ({
      ...place,
      id: `${group.id}-${placeIndex + 1}`,
      destination: group.destination,
      matchedDestination: group.matchedDestination,
      region: group.region,
    }))
  );

  return res.json({
    success: true,
    financials: {
      fuelCost,
      tollCost: 0, 
      lodgingCost: hotelCost,
      carRentalCost,
      foodCost,
      placesCost: sightseeingCost,
      totalCost: totalCalculatedTripCost
    },
    ecoData: {
      co2Emissions: Math.round(greenEmissionScore),
      ecoFriendly: fuelType === "ev" || greenEmissionScore < 50
    },
    routeDetails: {
      distanceKm: mockDistanceKm,
      priority: tripData.routePriority || "fastest",
      totalDays
    },
    coordinates: {
      start: startCoords,
      end: endCoords
    },
    destinationAttractions,
    places: richPlaces
  });
});

// --------------------------- CAR SUGGESTIONS API ---------------------------
app.get("/api/cars", (req, res) => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "data", "cars.json"), "utf8");
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("Failed to load cars.json, returning fallbacks:", err.message);
    res.json([
      { "brand": "honda", "model": "city", "fuel": "petrol", "mileage": 17.8 },
      { "brand": "honda", "model": "city", "fuel": "diesel", "mileage": 24.1 },
      { "brand": "honda", "model": "civic", "fuel": "petrol", "mileage": 16.5 },
      { "brand": "toyota", "model": "corolla", "fuel": "petrol", "mileage": 16.7 },
      { "brand": "toyota", "model": "innova", "fuel": "diesel", "mileage": 15.0 },
      { "brand": "hyundai", "model": "i20", "fuel": "petrol", "mileage": 19.0 },
      { "brand": "hyundai", "model": "verna", "fuel": "diesel", "mileage": 22.0 },
      { "brand": "maruti", "model": "swift", "fuel": "petrol", "mileage": 22.5 },
      { "brand": "maruti", "model": "baleno", "fuel": "petrol", "mileage": 22.9 }
    ]);
  }
});

// --------------------------- HEALTH CHECK (for Render) ---------------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Tourenvi Backend is running!" });
});

// --------------------------- SERVER START ---------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}. Using OpenStreetMap (FREE) for hotel data.`));