import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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
  "Cultural.scenary": "Cultur_Score",
  "Scenic": "Scenic_Score",
  "urban life": "Urban_Score",
  "Family": "Family_Score",
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
    dot += a[key] * b[key];
    magA += a[key] * a[key];
    magB += b[key] * b[key];
  }
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

app.listen(8000, () => console.log("✅ Server running on http://localhost:8000"));
