import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WriteGuide = () => {
  const [form, setForm] = useState({
    destination: "",
    title: "",
    coverImage: "",
    introduction: "",
    places: "",
    bestTime: "",
    localFood: "",
    gettingThere: "",
    budget: "",
    hiddenGems: "",
  });

  return (
    <div className="container mx-auto px-4 py-20">
      <Card>
        <CardHeader>
          <CardTitle>Write Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              placeholder="Destination"
              value={form.destination}
              onChange={(e) =>
                setForm((p) => ({ ...p, destination: e.target.value }))
              }
            />
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </div>
          <Input
            placeholder="Cover image URL"
            value={form.coverImage}
            onChange={(e) =>
              setForm((p) => ({ ...p, coverImage: e.target.value }))
            }
          />
          <Textarea
            placeholder="Introduction"
            value={form.introduction}
            onChange={(e) =>
              setForm((p) => ({ ...p, introduction: e.target.value }))
            }
          />
          <Textarea
            placeholder="Places with tips"
            value={form.places}
            onChange={(e) => setForm((p) => ({ ...p, places: e.target.value }))}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              placeholder="Best time"
              value={form.bestTime}
              onChange={(e) =>
                setForm((p) => ({ ...p, bestTime: e.target.value }))
              }
            />
            <Input
              placeholder="Local food"
              value={form.localFood}
              onChange={(e) =>
                setForm((p) => ({ ...p, localFood: e.target.value }))
              }
            />
          </div>
          <Textarea
            placeholder="Getting there"
            value={form.gettingThere}
            onChange={(e) =>
              setForm((p) => ({ ...p, gettingThere: e.target.value }))
            }
          />
          <Textarea
            placeholder="Budget breakdown"
            value={form.budget}
            onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
          />
          <Textarea
            placeholder="Hidden gems"
            value={form.hiddenGems}
            onChange={(e) =>
              setForm((p) => ({ ...p, hiddenGems: e.target.value }))
            }
          />

          <div className="flex gap-2">
            <Button variant="outline">Preview</Button>
            <Button>Publish Guide</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WriteGuide;
