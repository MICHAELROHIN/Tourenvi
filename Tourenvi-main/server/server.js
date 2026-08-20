// server/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// GET /api/distance?origin=...&destination=...
app.get("/api/distance", async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: "Missing origin or destination" });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch distance data" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));
