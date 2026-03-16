const moodMap: Record<string, string[]> = {
  Adventure: ["Manali", "Coorg", "Munnar", "Rishikesh"],
  Beach: ["Goa", "Rameswaram", "Varkala", "Pondicherry"],
  Heritage: ["Hampi", "Jaipur", "Madurai", "Mysore"],
  Nature: ["Ooty", "Kodaikanal", "Wayanad", "Coorg"],
  Pilgrimage: ["Varanasi", "Tirupati", "Shirdi", "Madurai"],
  Food: ["Chennai", "Hyderabad", "Kolkata", "Pune"],
};

export const recommendByMoods = (moods: string[]): string[] => {
  const result = new Set<string>();
  moods.forEach((mood) => {
    (moodMap[mood] || []).forEach((city) => result.add(city));
  });
  return Array.from(result);
};

export const getMoodSuggestionMap = () => moodMap;
