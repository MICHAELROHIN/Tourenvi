import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAuth, adminDb } from "@/lib/firebaseAdminAuth";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export interface UserRow {
  id: string;
  uid?: string;
  name?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  createdAt?: any;
  phone?: string;
  phoneNumber?: string;
  authProvider?: string;
  [key: string]: any;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(adminDb || db, "users"));
      const list: UserRow[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid || d.id,
          name: data.name || data.displayName || data.fullName || (data.email ? data.email.split("@")[0] : "Traveler"),
          email: data.email || "",
          role: data.role || "user",
          status: data.status || "active",
          phone: data.phone || data.phoneNumber || "",
          ...data,
        };
      });
      setUsers(list);
    } catch (err) {
      console.error("UserManagement fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(adminAuth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      unsubSnapshot = onSnapshot(
        collection(adminDb, "users"),
        (snapshot) => {
          const list: UserRow[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              uid: data.uid || d.id,
              name: data.name || data.displayName || data.fullName || (data.email ? data.email.split("@")[0] : "Traveler"),
              email: data.email || "",
              role: data.role || "user",
              status: data.status || "active",
              phone: data.phone || data.phoneNumber || "",
              ...data,
            };
          });
          setUsers(list);
          setLoading(false);
        },
        (err) => {
          console.warn("UserManagement onSnapshot notice:", err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const handleViewUserTrips = async (user: UserRow) => {
    setSelectedUser(user);
    setLoadingTrips(true);
    setUserTrips([]);

    try {
      const uid = user.uid || user.id;
      const q = query(collection(adminDb || db, "trips"), where("userId", "==", uid));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setUserTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } else {
        setUserTrips([]);
      }
    } catch (err) {
      console.error("Error fetching user trips:", err);
      toast.error("Failed to load user trips.");
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleToggleStatus = async (user: UserRow) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      await updateDoc(doc(adminDb || db, "users", user.id), { status: newStatus });
      toast.success(`User account marked as ${newStatus}.`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name || user.email}?`)) return;
    try {
      await deleteDoc(doc(adminDb || db, "users", user.id));
      toast.success("User account deleted.");
    } catch (err) {
      toast.error("Failed to delete user.");
    }
  };

  const filtered = users.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (row.name || "").toLowerCase().includes(q) ||
      (row.email || "").toLowerCase().includes(q) ||
      (row.role || "").toLowerCase().includes(q) ||
      (row.status || "").toLowerCase().includes(q) ||
      (row.phone || "").toLowerCase().includes(q) ||
      (row.id || row.uid || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-4 py-20 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Inspect accounts, manage security roles, and view user-planned travel itineraries.
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Accounts
        </Button>
      </div>

      <Input
        placeholder="Search by name, email, role, or status..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-md"
      />

      <div className="overflow-x-auto border rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading accounts from database...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">
                    {row.name || "Anonymous User"}
                  </td>
                  <td className="p-3 text-slate-600">{row.email || "N/A"}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {row.role || "user"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        row.status === "suspended"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {row.status || "active"}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewUserTrips(row)}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer text-xs"
                      >
                        View Trips
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleStatus(row)}
                        className="text-xs"
                      >
                        {row.status === "suspended" ? "Activate" : "Suspend"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(row)}
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No accounts found matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Trips Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <span>Planned Trips for {selectedUser.name || selectedUser.email}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-slate-50 text-xs flex flex-wrap gap-4 text-slate-600 border border-slate-200">
                <div>Email: <strong className="text-slate-900">{selectedUser.email}</strong></div>
                <div>Role: <strong className="uppercase text-slate-900">{selectedUser.role || "user"}</strong></div>
                <div>Status: <strong className="capitalize text-emerald-600">{selectedUser.status || "active"}</strong></div>
              </div>

              {loadingTrips ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading user's planned trips from database...
                </div>
              ) : userTrips.length > 0 ? (
                <div className="space-y-4">
                  {userTrips.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex justify-between items-start border-b pb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">
                            {t.tripName || `${t.startLocation || "Origin"} Trip`}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin size={14} className="text-emerald-600" />
                            <span>
                              Route: <strong>{t.startLocation || t.routeDetails?.startLocation || "Origin"}</strong> ➔ {Array.isArray(t.destinations) ? t.destinations.join(" ➔ ") : t.destinations || t.routeDetails?.destination || "Destination"}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-700">
                            ₹{(t.totalCost || t.financials?.totalCost || t.costBreakdown?.total || 0).toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Total Cost
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="px-2.5 py-1 rounded bg-slate-100">
                          ⏱️ Duration: <strong>{t.numberOfDays || t.itinerary?.length || 3} Days</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded bg-slate-100">
                          👥 Members: <strong>{t.numberOfMembers || t.tripData?.numberOfMembers || 1} Persons</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded bg-slate-100">
                          🚗 Vehicle: <strong>{t.vehicleType || t.routeDetails?.vehicleType || "Car"}</strong> ({t.fuelType || t.routeDetails?.fuelType || "Petrol"})
                        </span>
                      </div>

                      {(t.costBreakdown || t.financials) && (
                        <div className="p-2.5 rounded-lg bg-slate-50 text-xs grid grid-cols-5 gap-2 text-center border border-slate-100">
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">Fuel</div>
                            <div className="font-bold text-slate-800">₹{t.costBreakdown?.fuel || t.financials?.fuelExpenditure || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">Tolls</div>
                            <div className="font-bold text-slate-800">₹{t.costBreakdown?.toll || t.financials?.tollPricing || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">Hotel</div>
                            <div className="font-bold text-slate-800">₹{t.costBreakdown?.hotel || t.financials?.totalLodging || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">Food</div>
                            <div className="font-bold text-slate-800">₹{t.costBreakdown?.food || t.financials?.foodCost || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">Places</div>
                            <div className="font-bold text-slate-800">₹{t.costBreakdown?.places || t.financials?.placesCost || 0}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-xl text-slate-500 text-xs">
                  No planned trips found in database for this user account.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserManagement;
