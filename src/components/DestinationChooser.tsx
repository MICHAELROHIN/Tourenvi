import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Landmark,
  TreePine,
  Coffee,
  UtensilsCrossed,
  Heart,
  Globe,
  Check,
  Timer,
  MapPin,
  Calendar,
  Sun,
  Star,
} from "lucide-react";
import { recommendByMoods } from "@/lib/recommender";

interface Vibe {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  mood: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();

const vibes: Vibe[] = [
  {
    id: "adventure",
    label: "Adventure",
    icon: Compass,
    image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=300&fit=crop",
    mood: "Adventure",
  },
  {
    id: "history-culture",
    label: "History & Culture",
    icon: Landmark,
    image:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop",
    mood: "Culture/History",
  },
  {
    id: "nature",
    label: "Nature Escapes",
    icon: TreePine,
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop",
    mood: "scenary",
  },
  {
    id: "relaxation",
    label: "Relaxation",
    icon: Coffee,
    image:
      "https://imgs.search.brave.com/ghuO0X6SODSMSHvoAy6nPisYdURtuzrNsuje6iSFw4Y/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/eW92aXphZy5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjUv/MTAvQ292ZXItaW1h/Z2VzLVdFQi1hbmQt/RkItQ2hhcmlzaG1h/LTI5OC53ZWJw",
    mood: "Relaxation",
  },
  {
    id: "foodie",
    label: "Foodie Fun",
    icon: UtensilsCrossed,
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
    mood: "Urban Life",
  },
  {
    id: "romantic",
    label: "Romantic",
    icon: Heart,
    image:
      "https://imgs.search.brave.com/DNsSRvWbI73hoPHxk3cLuPWN6OgQ6TMAPT_xuDN6LIU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZWRlbGl2ZXJ5Lm5l/dC9XM0l6NFdBQ0F5/MkowcVQwY0NUM3hB/L2RpZGkvYXJ0aWNs/ZXMvc2R5bWE4ZGl6/aDc2dW12dDJndzdj/dG1iL3B1YmxpYw",
    mood: "Romantic",
  },
];

// Place details: spots, best time, season, famous for
interface PlaceDetails {
  spots: string[];
  bestTime: string;
  season: string;
  famousFor: string;
}

const placeDetails: Record<string, PlaceDetails> = {
  Ooty: {
    spots: [
      "Botanical Garden",
      "Ooty Lake",
      "Doddabetta Peak",
      "Rose Garden",
      "Tea Factory",
      "Pykara Falls",
    ],
    bestTime: "October – June",
    season: "Winter & Spring",
    famousFor: "Hill station, Tea plantations, Nilgiri Mountain Railway",
  },
  Madurai: {
    spots: [
      "Meenakshi Temple",
      "Thirumalai Nayakkar Palace",
      "Gandhi Museum",
      "Vaigai Dam",
      "Alagar Kovil",
    ],
    bestTime: "October – March",
    season: "Winter",
    famousFor: "Temple city, Jigarthanda, Ancient Dravidian architecture",
  },
  Kodaikanal: {
    spots: [
      "Kodaikanal Lake",
      "Coaker's Walk",
      "Pillar Rocks",
      "Bryant Park",
      "Silver Cascade Falls",
      "Dolphin's Nose",
    ],
    bestTime: "October – June",
    season: "Winter & Monsoon",
    famousFor: "Princess of Hill Stations, Kurinji flowers, Star-shaped lake",
  },
  Mahabalipuram: {
    spots: [
      "Shore Temple",
      "Arjuna's Penance",
      "Five Rathas",
      "Krishna's Butter Ball",
      "Tiger Cave",
      "Beach",
    ],
    bestTime: "November – February",
    season: "Winter",
    famousFor:
      "UNESCO World Heritage, Pallava-era rock-cut temples, Stone sculptures",
  },
  Chennai: {
    spots: [
      "Marina Beach",
      "Kapaleeshwarar Temple",
      "Fort St. George",
      "Government Museum",
      "Valluvar Kottam",
      "Elliot's Beach",
    ],
    bestTime: "November – February",
    season: "Winter",
    famousFor:
      "Gateway to South India, Filter coffee, Carnatic music, Marina Beach",
  },
  Hogenakkal: {
    spots: [
      "Hogenakkal Falls",
      "Coracle Ride",
      "Hanging Bridge",
      "Cauvery River",
      "Oil Bath",
    ],
    bestTime: "July – January",
    season: "Monsoon & Post-monsoon",
    famousFor: "Niagara of India, Coracle boat rides, Medicinal oil baths",
  },
  Valparai: {
    spots: [
      "Sholayar Dam",
      "Monkey Falls",
      "Nallamudi Viewpoint",
      "Balaji Temple",
      "Athirapally (nearby)",
      "Tea Estates",
    ],
    bestTime: "September – May",
    season: "Winter & Spring",
    famousFor:
      "Lush green hills, Tea & coffee estates, Rare wildlife like Lion-tailed Macaque",
  },
  "Kolli Hills": {
    spots: [
      "Agaya Gangai Falls",
      "Arapaleeswarar Temple",
      "Seekuparai Viewpoint",
      "70 Hairpin Bends",
      "Botanical Garden",
    ],
    bestTime: "October – March",
    season: "Winter",
    famousFor:
      "70 hairpin bends, Waterfalls, Medicinal herbs, Off-beat trekking",
  },
  Yercaud: {
    spots: [
      "Yercaud Lake",
      "Lady's Seat",
      "Shevaroy Temple",
      "Bear's Cave",
      "Pagoda Point",
      "Botanical Garden",
    ],
    bestTime: "October – June",
    season: "Winter & Spring",
    famousFor: "Jewel of the South, Coffee plantations, Shevaroy Hills",
  },
  Chettinad: {
    spots: [
      "Athangudi Palace",
      "Kanadukathan",
      "Chettinad Mansion",
      "Pillayarpatti Temple",
      "Athangudi Tiles Factory",
    ],
    bestTime: "October – March",
    season: "Winter",
    famousFor:
      "Heritage mansions, Chettinad cuisine (spicy!), Athangudi tiles, Antique collections",
  },
  Rameswaram: {
    spots: [
      "Ramanathaswamy Temple",
      "Pamban Bridge",
      "Agni Theertham",
      "Dhanushkodi",
      "Dr. APJ Abdul Kalam Memorial",
    ],
    bestTime: "October – April",
    season: "Winter & Spring",
    famousFor: "One of the Char Dham, Longest corridor in India, Pamban Bridge",
  },
};

// Add your image URLs here for each destination
const placeImages: Record<string, string> = {
  Ooty: "https://imgs.search.brave.com/R7oeeGkI_pRe8mJjt8j-7TF0VUEZ3ROeuPfTZo6Zcso/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNTk5/OTI1NDIzL3Bob3Rv/L2dvdnQtYm90YW5p/Y2FsLWdhcmRlbi1v/b3R5LmpwZz9zPTYx/Mng2MTImdz0wJms9/MjAmYz1XUHhCOERR/WnlRNUUxQV9lTjNP/MTBmZVVqNHN5U2hX/VzhyekhENjJJZno0/PQ",
  Madurai:
    "https://imgs.search.brave.com/7HkuUNFE0iLReZY_XMMUNxaHJHSP3cTqzBsxo0BSbIs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvODcw/MTU0NjI4L3Bob3Rv/L21hZHVyYWktbWVl/bmFrc2hpLXRlbXBs/ZS5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9d3JUQ2hOQVlq/WXhvQVBnQlRhbnFN/dGk0OUdNVFFZOVNO/dXZxRXNfQ1dWOD0",
  Kodaikanal:
    "https://imgs.search.brave.com/4b2hkTGWxr5ktabWgb7u6U9AUL2PVrEe4JAqZh3siO8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNTY4/NTA2NDA5L3Bob3Rv/L2tvZGFpa2FuYWwt/bGFrZS5qcGc_cz02/MTJ4NjEyJnc9MCZr/PTIwJmM9cEUtNXpu/YWtQVlkybklmLTRQ/MnlLcEF5UzZnbzlx/cVNmMjhBNnpIWWdo/MD0",
  Mahabalipuram:
    "https://imgs.search.brave.com/tEB_5S4HDmtVXTmB53TSHl8qiuVmtb_qth_-J7D1d2Y/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/dG91cm15aW5kaWEu/Y29tL3N0YXRlcy90/YW1pbG5hZHUvaW1h/Z2VzL21haGFiYWxp/cHVyYW0tYmVhY2gx/LTEuanBn",
  Chennai:
    "https://imgs.search.brave.com/VyUqOEkv-YfhieZTiit1ojNmOUTnP6QKOQOfuOgzGz0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy8z/LzMyL0NoZW5uYWlf/Q2VudHJhbC5qcGc",
  Hogenakkal:
    "https://imgs.search.brave.com/-fSlW71GMk5C-Qva3Q6aZLWO91Xxxfz_PbHp2MylUb8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNDYw/MjQ4NzkzL3Bob3Rv/L2hvZ2VubmFrYWwt/d2F0ZXItZmFsbHMu/anBnP3M9NjEyeDYx/MiZ3PTAmaz0yMCZj/PUZvdTBLcF93d2Fy/clFRVXBmOVl1V2I5/NklYb3gybkFLRUZZ/RFRoRDJNLU09",
  Valparai:
    "https://imgs.search.brave.com/Ijzrhm6ythv_2L2QS-lneSTLrKESSppluUKWqNekv50/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbS5o/dW50LmluL2NnL2Nv/aW1iYXRvcmUvQ2l0/eS1HdWlkZS9WYWxw/YXJhaS5KUEc",
  "Kolli Hills":
    "https://imgs.search.brave.com/ZnQR9ClSInBsrBoJKH7Dg68UYZd3elxRffib8pwXxWw/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMyLnRyaXBvdG8u/Y29tL21lZGlhL2Zp/bHRlci9ubC9pbWcv/MTc1OTI5L1RyaXBE/b2N1bWVudC8xNTY1/NTMxODY1X2NhcHR1/cmUuanBn",
  Yercaud:
    "https://imgs.search.brave.com/JFNIGFIjps7u7bpfXscQALnWBxtE0TK_3Op9wJAzAHs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly92aXNp/dHllcmNhdWQuY29t/L3dwLWNvbnRlbnQv/dXBsb2Fkcy8yMDE3/LzA5L2xhZHlzZWF0/LXZpc2l0eWVyY2F1/ZC5qcGc",
  Chettinad:
    "https://imgs.search.brave.com/0qsdHlg_digZS0qbi42gKQ5FEz4IaOgnjip2rhThsw0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvODg5/NDMyMTUvcGhvdG8v/aW5kaWEtdmlldy1v/Zi10aGUtY2hldHRp/bmFkdS1icmVha2Zh/c3QtYXQtY2hldHRp/YXItbWFuc2lvbnMt/aW4tY2hldHRpbmFk/LXRhbWlsLW5hZHUt/aW5kaWEuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPUZHa2t4/ejVRZlZHS2s0OEll/UDZCLWNLQzFES09I/SGM2dmg3bTgtWkM3/d3c9",

  Rameswaram:
    "https://imgs.search.brave.com/tl4ajWxlSeiks3O5oQpztOVAdpVwB5RxNgejKEZm_fs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTE2/MTk1MjMzMy9waG90/by9yYW1hbmF0aGFz/d2FteS10ZW1wbGUt/cmFtZXN3YXJhbS1i/ZWFjaC12aWV3LWZy/b20tYXJhYmlhbi1z/ZWEuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPURSRVA3b2Zm/bnZidVNZclVQcjh4/Q2JDMlg0U2V4aXdJ/Y2xsT2p2ZzduMmM9",
  // Add more places as needed...
};

const getPlaceImage = (city: string) => {
  return (
    placeImages[city] ||
    `https://picsum.photos/seed/${encodeURIComponent(city)}/400/530`
  );
};

const DestinationChooser = () => {
  const navigate = useNavigate();
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [curatedSuggestions, setCuratedSuggestions] = useState<string[]>([]);

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const toggleFavorite = (place: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(place)) next.delete(place);
      else next.add(place);
      return next;
    });
  };

  // Auto-fetch recommendations whenever selected vibes change
  useEffect(() => {
    if (selectedVibes.length === 0) {
      setRecommendations([]);
      setError(null);
      return;
    }

    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      const moodsList = selectedVibes
        .map((id) => vibes.find((v) => v.id === id)?.mood || "")
        .filter(Boolean);
      const uniqueMoods = [...new Set(moodsList)];
      setCuratedSuggestions(recommendByMoods(uniqueMoods));

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/recommend`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moods: uniqueMoods }),
          },
        );

        if (!response.ok) throw new Error("Failed to fetch recommendations");

        const data = await response.json();
        const merged = [
          ...new Set([
            ...(data.recommendations || []),
            ...recommendByMoods(uniqueMoods),
          ]),
        ];
        setRecommendations(merged);
      } catch (err) {
        setError(
          "Failed to get live recommendations. Showing curated mood picks.",
        );
        setRecommendations(recommendByMoods(uniqueMoods));
        console.error("Error fetching recommendations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [selectedVibes]);

  const handleDestinationClick = (destination: string) => {
    const chosenDestination = destination.trim();
    try {
      localStorage.setItem("tourenvi:selectedDestination", chosenDestination);
      const ev = new CustomEvent("tourenvi:setDestination", {
        detail: { destination: chosenDestination },
      });
      window.dispatchEvent(ev);
    } catch {}
    const el = document.querySelector("#get-started") as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const getVibeTag = (index: number) => {
    if (selectedVibes.length === 0) return "";
    const vibeIndex = index % selectedVibes.length;
    return vibes.find((v) => v.id === selectedVibes[vibeIndex])?.label || "";
  };

  const parseDestination = (dest: string) => {
    const parts = dest.split(",").map((s) => s.trim());
    return { city: parts[0] || dest, country: parts[1] || "India" };
  };

  return (
    <section id="locgenie" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Find Your Next Adventure
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Pick the vibes that match your journey
                </p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            {/* Side-by-side layout: Left = Moods, Right = Destinations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT SIDE — Mood Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Select Your Vibes
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {vibes.map((vibe) => {
                    const isSelected = selectedVibes.includes(vibe.id);
                    const Icon = vibe.icon;
                    return (
                      <button
                        key={vibe.id}
                        onClick={() => toggleVibe(vibe.id)}
                        className={`relative rounded-2xl overflow-hidden aspect-[4/3] group transition-all duration-200 outline-none ${
                          isSelected
                            ? "ring-[3px] ring-emerald-500 shadow-lg shadow-emerald-500/25"
                            : "ring-1 ring-gray-200 hover:ring-2 hover:ring-emerald-300"
                        }`}
                      >
                        <img
                          src={vibe.image}
                          alt={vibe.label}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white drop-shadow" />
                          </div>
                          <span className="text-white text-xs sm:text-sm font-semibold drop-shadow-md">
                            {vibe.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                            <Check
                              className="w-3.5 h-3.5 text-white"
                              strokeWidth={3}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDE — Destinations */}
              <div className="min-h-[300px]">
                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 mb-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Loading */}
                {isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="p-4 bg-emerald-50 rounded-xl animate-pulse w-full">
                      <p className="text-sm text-emerald-700 font-medium text-center">
                        Finding perfect destinations for you...
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && recommendations.length === 0 && !error && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Globe className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm font-medium">
                      Select vibes to see recommendations here
                    </p>
                  </div>
                )}

                {/* Tailored Recommendations */}
                {recommendations.length > 0 && !isLoading && (
                  <div>
                    {curatedSuggestions.length > 0 && (
                      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">
                          Mood-based suggestions
                        </p>
                        <p className="text-sm text-emerald-900">
                          {curatedSuggestions.join(", ")}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Tailored Recommendations:
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {recommendations.slice(0, 6).map((place, index) => {
                        const { city, country } = parseDestination(place);
                        const tag = getVibeTag(index);
                        const details = placeDetails[city];
                        // Rightmost column: tooltip opens LEFT; others open RIGHT
                        const isRightmost = index % 3 === 2;
                        return (
                          <div
                            key={place}
                            className="group/card relative text-left rounded-2xl overflow-visible cursor-pointer"
                            onClick={() => handleDestinationClick(place)}
                          >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                              <img
                                src={getPlaceImage(city)}
                                alt={city}
                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              {tag && (
                                <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                  {tag}
                                </div>
                              )}
                            </div>
                            <div className="flex items-start justify-between mt-2 px-0.5">
                              <div>
                                <p className="font-semibold text-sm text-gray-900 leading-tight">
                                  {city}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {country}
                                </p>
                              </div>
                              <button
                                onClick={(e) => toggleFavorite(place, e)}
                                className="mt-0.5 hover:scale-110 transition-transform"
                                aria-label={`Favorite ${city}`}
                              >
                                <Heart
                                  className={`w-4 h-4 transition-colors ${
                                    favorites.has(place)
                                      ? "fill-red-500 text-red-500"
                                      : "text-gray-400 hover:text-red-400"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Hover popover — right side for most, left side for rightmost column */}
                            {details && (
                              <div
                                className={`absolute top-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 opacity-0 invisible group-hover/card:opacity-100 group-hover/card:visible transition-all duration-200 pointer-events-none ${isRightmost ? "right-full mr-2" : "left-full ml-2"}`}
                              >
                                <div
                                  className={`absolute top-4 w-3 h-3 bg-white rotate-45 ${isRightmost ? "left-full border-r border-b border-gray-200 -ml-1.5" : "right-full border-l border-b border-gray-200 -mr-1.5"}`}
                                />

                                <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                  {city}
                                </h4>

                                <div className="mb-2">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                    Top Spots
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {details.spots.map((spot) => (
                                      <span
                                        key={spot}
                                        className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full"
                                      >
                                        {spot}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-gray-600 mb-1.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-blue-500" />
                                    {details.bestTime}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Sun className="w-3 h-3 text-amber-500" />
                                    {details.season}
                                  </span>
                                </div>

                                <div className="flex items-start gap-1 text-[11px] text-gray-500">
                                  <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <span>{details.famousFor}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DestinationChooser;
