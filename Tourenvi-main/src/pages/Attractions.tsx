import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Attraction = {
  id: string;
  name: string;
  destination: string;
  category: string;
  status: "pending" | "verified" | "rejected";
  rating?: number;
  submittedBy?: string;
  submittedByName?: string;
};

const Attractions = () => {
  const navigate = useNavigate();
  const [verified, setVerified] = useState<Attraction[]>([]);
  const [mine, setMine] = useState<Attraction[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const verifiedQuery = query(
      collection(db, "attractions"),
      where("status", "==", "verified"),
    );
    const unsubVerified = onSnapshot(verifiedQuery, (snapshot) => {
      setVerified(
        snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<Attraction, "id">),
        })),
      );
    });

    const uid = auth.currentUser?.uid;
    if (!uid) {
      return () => unsubVerified();
    }

    const myQuery = query(
      collection(db, "attractions"),
      where("submittedBy", "==", uid),
    );
    const unsubMine = onSnapshot(myQuery, (snapshot) => {
      setMine(
        snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<Attraction, "id">),
        })),
      );
    });

    return () => {
      unsubVerified();
      unsubMine();
    };
  }, []);

  const filteredVerified = useMemo(() => {
    const text = filter.toLowerCase();
    return verified.filter((item) =>
      [item.name, item.destination, item.category].some((field) =>
        field?.toLowerCase().includes(text),
      ),
    );
  }, [filter, verified]);

  return (
    <div className="container mx-auto px-4 py-20 space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Attractions</h1>
        <Button onClick={() => navigate("/attractions/add")}>
          Add a Place
        </Button>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Verified</TabsTrigger>
          <TabsTrigger value="mine">My Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Input
            placeholder="Filter by destination/category/rating"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          {filteredVerified.length === 0 && (
            <p className="text-muted-foreground">
              No verified attractions yet.
            </p>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVerified.map((item) => (
              <div key={item.id} className="border rounded p-4 space-y-2">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.destination}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{item.category}</Badge>
                  <Badge variant="outline">Verified</Badge>
                  <Badge variant="secondary">{item.rating ?? 4.4}★</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Guide: {item.submittedByName || "Community"}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          {mine.length === 0 && (
            <p className="text-muted-foreground">
              You have no submissions yet.
            </p>
          )}
          {mine.map((item) => (
            <div
              key={item.id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.destination}
                </p>
              </div>
              <Badge
                variant={
                  item.status === "verified"
                    ? "default"
                    : item.status === "pending"
                      ? "secondary"
                      : "destructive"
                }
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attractions;
