import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockQueue = [
  {
    id: "1",
    name: "Hidden Falls",
    description:
      "A scenic trail destination for monsoon hikes and photography.",
    destination: "Coorg",
    lat: 12.42,
    lng: 75.74,
    images: ["img"],
    submittedBy: "guide-1",
  },
  {
    id: "2",
    name: "Temple Viewpoint",
    description: "Historic viewpoint with local food stalls.",
    destination: "Madurai",
    lat: 9.92,
    lng: 78.12,
    images: ["img"],
    submittedBy: "guide-2",
  },
];

const calculateSpamScore = (description: string): number => {
  const keywordPenalty = /(free money|adult|casino|click here)/i.test(
    description,
  )
    ? 40
    : 0;
  const lengthPenalty = description.length < 50 ? 25 : 0;
  return Math.min(
    100,
    keywordPenalty + lengthPenalty + Math.round(Math.random() * 20),
  );
};

const AttractionVerifier = () => {
  const [queue, setQueue] = useState(mockQueue);

  const scored = useMemo(
    () =>
      queue.map((item) => ({
        ...item,
        spamScore: calculateSpamScore(item.description),
      })),
    [queue],
  );

  const act = (id: string, action: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    console.log(`Action ${action} for ${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Attraction Verifier</h1>
      {scored.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{item.name}</span>
              <Badge
                variant={
                  item.spamScore <= 30
                    ? "default"
                    : item.spamScore <= 60
                      ? "secondary"
                      : "destructive"
                }
              >
                Spam Score {item.spamScore}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{item.description}</p>
            <p className="text-muted-foreground">
              {item.destination} ({item.lat}, {item.lng})
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => act(item.id, "approve")}>Approve</Button>
              <Button
                variant="outline"
                onClick={() => act(item.id, "edit-approve")}
              >
                Edit & Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => act(item.id, "reject")}
              >
                Reject
              </Button>
              <Button
                variant="destructive"
                onClick={() => act(item.id, "ban-user")}
              >
                Ban User
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AttractionVerifier;
