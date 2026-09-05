import React, { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { adminAuth, adminDb } from "@/lib/firebaseAdminAuth";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Loader2, ShieldAlert, LogOut, ArrowLeft } from "lucide-react";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      try {
        const adminDocSnap = await getDoc(doc(adminDb, "admins", user.uid));
        if (adminDocSnap.exists()) {
          setUserRole(adminDocSnap.data().role || "admin");
        } else {
          const userDocSnap = await getDoc(doc(adminDb, "users", user.uid));
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role || "user");
          } else {
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error("Firestore user role query failed in AdminProtectedRoute:", error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-800 font-['Poppins',sans-serif] p-4">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl border border-slate-200/80 bg-white shadow-xl max-w-xs w-full text-center animate-fade-in">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-xs">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Verifying Admin Session...</h4>
            <p className="text-xs text-slate-500">Checking credentials & privileges</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 text-slate-800 font-['Poppins',sans-serif]">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl space-y-6 relative overflow-hidden animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200/80 shadow-xs">
            <ShieldAlert className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">403 Unauthorized Access</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your account does not possess the administrative privileges required to view the operations panel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Homepage
            </button>
            <button
              onClick={async () => {
                await signOut(adminAuth);
                navigate("/admin/login");
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
export { AdminProtectedRoute };
