import React, { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { adminAuth } from "@/lib/firebaseAdminAuth";
import { db } from "@/firebase";
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
        const adminDocSnap = await getDoc(doc(db, "admins", user.uid));
        if (adminDocSnap.exists()) {
          setUserRole(adminDocSnap.data().role || "admin");
        } else {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-[1rem] border border-border bg-card shadow-card">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium tracking-wide text-foreground">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md rounded-[1rem] border border-border bg-card p-8 text-center shadow-card space-y-6 relative overflow-hidden">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">403 Unauthorized Access</h2>
            <p className="text-sm text-secondary leading-relaxed">
              Your account does not possess the administrative privileges required to view the operations panel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-card bg-primary/10 hover:bg-primary/15 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Homepage
            </button>
            <button
              onClick={async () => {
                await signOut(adminAuth);
                navigate("/admin/login");
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground border border-border hover:bg-gray-50 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer"
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
