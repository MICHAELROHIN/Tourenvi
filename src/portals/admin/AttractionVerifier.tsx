import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminDb } from "@/lib/firebaseAdminAuth";
import { db } from "@/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { RefreshCw, MapPin, Check, X, ShieldAlert } from "lucide-react";

export interface AttractionItem {
  id: string;
  name?: string;
  description?: string;
  destination?: string;
  category?: string;
  lat?: number;
  lng?: number;
  images?: string[];
  submittedBy?: string;
  verified?: boolean;
  status?: string;
}

const mockFallback: AttractionItem[] = [
  {
    id: "mock-1",
    name: "Hidden Falls",
    description: "A scenic trail destination for monsoon hikes and photography.",
    destination: "Coorg",
    lat: 12.42,
    lng: 75.74,
    images: ["img"],
    submittedBy: "guide-1",
    verified: false,
  },
  {
    id: "mock-2",
    name: "Temple Viewpoint",
    description: "Historic viewpoint with local food stalls.",
    destination: "Madurai",
    lat: 9.92,
    lng: 78.12,
    images: ["img"],
    submittedBy: "guide-2",
    verified: false,
  },
];

const calculateSpamScore = (description: string): number => {
  const keywordPenalty = /(free money|adult|casino|click here)/i.test(description) ? 40 : 0;
  const lengthPenalty = description.length < 50 ? 25 : 0;
  return Math.min(100, keywordPenalty + lengthPenalty + Math.round(Math.random() * 20));
};

const AttractionVerifier = () => {
  const [queue, setQueue] = useState<AttractionItem[]>(mockFallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(adminDb || db, "attractions"),
      (snap) => {
        if (!snap.empty) {
          const list: AttractionItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AttractionItem, "id">),
          }));
          setQueue(list);
        } else {
          setQueue(mockFallback);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Attractions listener error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const scored = useMemo(
    () =>
      queue.map((item) => ({
        ...item,
        spamScore: calculateSpamScore(item.description || ""),
      })),
    [queue]
  );

  const handleApprove = async (id: string) => {
    try {
      if (id.startsWith("mock-")) {
        setQueue((prev) => prev.filter((item) => item.id !== id));
        toast.success("Attraction approved!");
        return;
      }
      await updateDoc(doc(adminDb || db, "attractions", id), {
        verified: true,
        status: "approved",
      });
      toast.success("Attraction approved and marked as verified!");
    } catch (err) {
      console.error("Failed to approve attraction:", err);
      toast.error("Failed to approve attraction.");
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject and remove this attraction submission?")) return;
    try {
      if (id.startsWith("mock-")) {
        setQueue((prev) => prev.filter((item) => item.id !== id));
        toast.success("Attraction rejected.");
        return;
      }
      await deleteDoc(doc(adminDb || db, "attractions", id));
      toast.success("Attraction submission deleted.");
    } catch (err) {
      console.error("Failed to delete attraction:", err);
      toast.error("Failed to delete attraction.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attraction Verifier</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review community and guide submitted travel spots, verify coordinates, and detect spam.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1">
          {queue.length} Submissions in Queue
        </Badge>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading submissions...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scored.map((item) => (
            <Card key={item.id} className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{item.name || "Untitled Attraction"}</span>
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
              <CardContent className="space-y-4 text-sm">
                <p className="text-slate-600 line-clamp-3">{item.description || "No description provided."}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{item.destination || "Location"} ({item.lat || 0}, {item.lng || 0})</span>
                  {item.submittedBy && (
                    <span className="ml-auto font-mono text-[11px]">By: {item.submittedBy}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <Button onClick={() => handleApprove(item.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(item.id)}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject & Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttractionVerifier;

