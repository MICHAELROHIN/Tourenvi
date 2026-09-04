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
      <div className="min-h-screen flex items-center justify-center bg-[#051124] text-white">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl border border-white/10 bg-[#0B2B5C]/30 backdrop-blur-xl shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
          <p className="text-sm font-medium tracking-wide text-gray-300">
            Verifying Admin Session...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#051124] p-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/20 bg-[#0B2B5C]/20 backdrop-blur-xl p-8 text-center shadow-2xl space-y-6 relative overflow-hidden">
          {/* Decorative glowing orb */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#0B2B5C]/50 rounded-full blur-2xl pointer-events-none" />
          
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#0B2B5C]/50 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] animate-pulse">
            <ShieldAlert className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">403 Unauthorized Access</h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your account does not possess the administrative privileges required to view the operations panel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#0B2B5C] bg-[#D4AF37] hover:bg-[#D4AF37]/90 rounded-lg transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Homepage
            </button>
            <button
              onClick={async () => {
                await signOut(adminAuth);
                navigate("/admin/login");
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 border border-white/10 hover:bg-white/5 rounded-lg transition-all duration-300 active:scale-95 cursor-pointer"
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
