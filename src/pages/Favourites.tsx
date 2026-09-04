import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const tabs = ["Destinations", "Hotels", "Attractions", "Restaurants"];

type FavouriteItem = {
  id: string;
  title: string;
  type: string;
};

const Favourites = () => {
  const [items, setItems] = useState<FavouriteItem[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    const ref = collection(db, "users", uid, "favourites");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setItems(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...(docItem.data() as Omit<FavouriteItem, "id">),
          })),
        );
      },
      (err) => {
        console.warn("Favourites snapshot error:", err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const seedFavourite = async (type: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    const id = `${type.toLowerCase()}-${Date.now()}`;
    setItems((prev) => [{ id, title: `Sample ${type}`, type }, ...prev]);

    await setDoc(doc(db, "users", uid, "favourites", id), {
      title: `Sample ${type}`,
      type,
      createdAt: new Date().toISOString(),
    });
  };

  const removeFavourite = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    await deleteDoc(doc(db, "users", uid, "favourites", id));
  };

  return (
    <div className="container mx-auto px-4 py-20 space-y-6">
      <h1 className="text-3xl font-bold">Favourites</h1>
      <Tabs defaultValue="Destinations" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => {
          const filtered = items.filter((item) => item.type === tab);
          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <Button onClick={() => seedFavourite(tab)}>Add demo {tab}</Button>
              {filtered.length === 0 && (
                <div className="rounded border border-dashed p-8 text-center text-muted-foreground">
                  No favourites yet in {tab}. Start adding from cards across the
                  app.
                </div>
              )}
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="border rounded p-3 flex justify-between"
                >
                  <span>{item.title}</span>
                  <Button
                    variant="ghost"
                    onClick={() => removeFavourite(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Favourites;
