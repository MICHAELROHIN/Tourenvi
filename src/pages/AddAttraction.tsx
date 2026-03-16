import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statesAndUTs = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const categories = [
  "Nature",
  "Heritage",
  "Food",
  "Adventure",
  "Religious",
  "Viewpoint",
  "Waterfall",
  "Beach",
  "Other",
];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const AddAttraction = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    destination: "",
    state: "",
    category: "Nature",
    lat: "",
    lng: "",
    entryFee: "0",
    tips: "",
    bestMonths: [] as string[],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(() => {
    return (
      form.name.trim().length > 2 &&
      form.description.trim().length >= 50 &&
      form.destination.trim()
    );
  }, [form.description, form.destination, form.name]);

  const toggleMonth = (month: string) => {
    setForm((prev) => ({
      ...prev,
      bestMonths: prev.bestMonths.includes(month)
        ? prev.bestMonths.filter((item) => item !== month)
        : [...prev.bestMonths, month],
    }));
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setForm((prev) => ({
        ...prev,
        lat: String(position.coords.latitude),
        lng: String(position.coords.longitude),
      }));
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user || !isValid) {
      toast.error("Complete required fields first");
      return;
    }

    setSaving(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 5)) {
        const storageRef = ref(
          storage,
          `attractions/${user.uid}/${Date.now()}-${file.name}`,
        );
        await uploadBytes(storageRef, file);
        urls.push(await getDownloadURL(storageRef));
      }

      await addDoc(collection(db, "attractions"), {
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        entryFee: Number(form.entryFee),
        images: urls,
        status: "pending",
        submittedBy: user.uid,
        submittedByName: user.displayName || "Guide",
        spamScore: null,
        createdAt: serverTimestamp(),
      });

      toast.success("Submitted successfully. Review timeline: 48 hours.");
      setForm({
        name: "",
        description: "",
        destination: "",
        state: "",
        category: "Nature",
        lat: "",
        lng: "",
        entryFee: "0",
        tips: "",
        bestMonths: [],
      });
      setFiles([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <Card>
        <CardHeader>
          <CardTitle>Add Attraction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Only submit real publicly accessible places. False submissions =
            account suspension.
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label>Destination</Label>
                <Input
                  value={form.destination}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, destination: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label>Description (min 50 chars)</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                minLength={50}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>State</Label>
                <Select
                  value={form.state}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, state: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose state" />
                  </SelectTrigger>
                  <SelectContent>
                    {statesAndUTs.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Latitude</Label>
                <Input
                  value={form.lat}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lat: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  value={form.lng}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lng: e.target.value }))
                  }
                />
              </div>
            </div>

            <Button variant="outline" type="button" onClick={useMyLocation}>
              Use my location
            </Button>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Entry Fee</Label>
                <Input
                  type="number"
                  value={form.entryFee}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, entryFee: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Images (up to 5)</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setFiles(Array.from(e.target.files || []).slice(0, 5))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Best Months</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {months.map((month) => (
                  <Button
                    key={month}
                    type="button"
                    variant={
                      form.bestMonths.includes(month) ? "default" : "outline"
                    }
                    onClick={() => toggleMonth(month)}
                  >
                    {month}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Tips for visitors</Label>
              <Textarea
                value={form.tips}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tips: e.target.value }))
                }
              />
            </div>

            <Button
              disabled={!isValid || saving}
              type="submit"
              className="w-full"
            >
              {saving ? "Submitting..." : "Submit attraction"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddAttraction;
