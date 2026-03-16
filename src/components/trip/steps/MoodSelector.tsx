import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TripMood } from "@/context/TripContext";
import { recommendByMoods } from "@/lib/recommender";

const moods: TripMood[] = [
  "Adventure",
  "Pilgrimage",
  "Nature",
  "Heritage",
  "Food",
  "Beach",
];
const genres = [
  "Budget",
  "Luxury",
  "Offbeat",
  "Eco",
  "Weekend",
  "Roadtrip",
  "Pilgrim",
];

type Props = {
  selectedMoods: TripMood[];
  selectedGenres: string[];
  onMoodsChange: (moods: TripMood[]) => void;
  onGenresChange: (genres: string[]) => void;
  onSuggestions: (destinations: string[]) => void;
};

const MoodSelector = ({
  selectedMoods,
  selectedGenres,
  onMoodsChange,
  onGenresChange,
  onSuggestions,
}: Props) => {
  const suggestions = useMemo(
    () => recommendByMoods(selectedMoods),
    [selectedMoods],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {moods.map((mood) => {
          const selected = selectedMoods.includes(mood);
          return (
            <Button
              key={mood}
              variant={selected ? "default" : "outline"}
              onClick={() => {
                const next = selected
                  ? selectedMoods.filter((item) => item !== mood)
                  : [...selectedMoods, mood];
                onMoodsChange(next);
                onSuggestions(recommendByMoods(next));
              }}
            >
              {mood}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => {
          const selected = selectedGenres.includes(genre);
          return (
            <Badge
              key={genre}
              className="cursor-pointer"
              variant={selected ? "default" : "outline"}
              onClick={() => {
                const next = selected
                  ? selectedGenres.filter((item) => item !== genre)
                  : [...selectedGenres, genre];
                onGenresChange(next);
              }}
            >
              #{genre}
            </Badge>
          );
        })}
      </div>

      <div className="rounded-md border p-3 text-sm bg-muted/40">
        <p className="font-semibold mb-1">Mood-based destination suggestions</p>
        <p className="text-muted-foreground">
          {suggestions.join(", ") || "Select at least one mood"}
        </p>
      </div>
    </div>
  );
};

export default MoodSelector;
