// server.js

import express from "express";
import cors from "cors";
import axios from "axios";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// --- YOUR EXISTING DESTINATION LOGIC (NO CHANGES) ---
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
  { Destination: "Dhanushkodi", Adventure_Score: 2, Relaxation_Score: 4, Cultur_Score: 3, Scenic_Score: 5, Urban_Score: 1, Family_Score: 3, Romantic_Score: 5, Water_Activity_Tag: 0 },
  { Destination: "Rameswaram", Adventure_Score: 1, Relaxation_Score: 1, Cultur_Score: 5, Scenic_Score: 2, Urban_Score: 1, Family_Score: 4, Romantic_Score: 1, Water_Activity_Tag: 1 }
];

const FEATURES = [
  "Adventure_Score","Relaxation_Score","Cultur_Score","Scenic_Score",
  "Urban_Score","Family_Score","Romantic_Score","Water_Activity_Tag"
];

const moodMap = {
  "Adventure": "Adventure_Score",
  "Relaxation": "Relaxation_Score",
  "Culture/History": "Cultur_Score",
  "scenary": "Scenic_Score",
  "Urban Life": "Urban_Score",
  "Romantic": "Romantic_Score",
  "Water activity": "Water_Activity_Tag"
};

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
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
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

// --- UPDATED ENDPOINT TO GET HOTEL DETAILS ---
app.get("/get-hotels", async (req, res) => {
  const { destination } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!destination) {
    return res.status(400).json({ error: "Destination is required" });
  }
  if (!apiKey) {
    console.error("Google Places API Key is missing.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Step 1: Text Search (to find places)
  const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hotels%20in%20${encodeURIComponent(
    destination
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(textSearchUrl);
    const places = response.data.results;

    // Step 2: Place Details (to get details for each place)
    // We use Promise.all to wait for all detail requests to finish
    const hotelDetailsPromises = places.map(async (place) => {
      const placeId = place.place_id;
      // We request specific fields to get photos and phone number
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,place_id,formatted_address,formatted_phone_number,rating,user_ratings_total,photos&key=${apiKey}`;
      
      try {
        const detailsResponse = await axios.get(detailsUrl);
        const details = detailsResponse.data.result;

        // Construct the photo URL
        let photoUrl = null;
        if (details.photos && details.photos.length > 0) {
          const photoReference = details.photos[0].photo_reference;
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
        }

        // Return the complete hotel object
        return {
          id: details.place_id,
          name: details.name,
          address: details.formatted_address,
          rating: details.rating,
          user_ratings_total: details.user_ratings_total,
          phone: details.formatted_phone_number, // This will now be populated
          photoUrl: photoUrl, // This will also be populated
        };
      } catch (detailsError) {
        console.error(`Error fetching details for place_id ${placeId}:`, detailsError.message);
        return null; // Return null for any place that fails
      }
    });

    // Wait for all promises to resolve
    const hotels = (await Promise.all(hotelDetailsPromises))
      .filter(hotel => hotel !== null); // Filter out any failed requests

    res.json({ hotels });

  } catch (error) {
    console.error("Error fetching from Google Places API:", error.message);
    res.status(500).json({ error: "Failed to fetch hotel data" });
  }
});

app.listen(8000, () => console.log("✅ Server running on http://localhost:8000"));