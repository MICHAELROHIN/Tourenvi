import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminAuth } from "@/lib/firebaseAdminAuth";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { Compass, Mail, KeyRound, Loader2, ArrowLeft } from "lucide-react";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in as admin on the isolated session, redirect to dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (user) => {
      if (user) {
        try {
          const adminSnap = await getDoc(doc(db, "admins", user.uid));
          const userDocSnap = adminSnap.exists() ? adminSnap : await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
            const from = (location.state as { from?: string } | null)?.from || "/admin";
            navigate(from, { replace: true });
          }
        } catch (error) {
          console.error("Failed to query user profile in AdminLogin session listener:", error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in with isolated adminAuth instance
      const credential = await signInWithEmailAndPassword(adminAuth, email.trim(), password);
      
      // 2. Fetch User Profile from Firestore to check Role (Check admins collection first)
      const adminSnap = await getDoc(doc(db, "admins", credential.user.uid));
      const userDocSnap = adminSnap.exists() ? adminSnap : await getDoc(doc(db, "users", credential.user.uid));
      
      if (!userDocSnap.exists()) {
        await signOut(adminAuth);
        toast.error("Account profile not found.");
        setLoading(false);
        return;
      }

      const role = userDocSnap.data().role;
      if (role !== "admin") {
        await signOut(adminAuth);
        toast.error("Access denied. Admin credentials required.");
        setLoading(false);
        return;
      }

      // Success
      toast.success("Welcome back, Commander.");
      navigate("/admin", { replace: true });
    } catch (error: any) {
      console.error("Admin sign in error:", error);
      const errCode = error?.code || "";
      let errMsg = "Failed to sign in.";
      if (errCode === "auth/invalid-credential" || errCode === "auth/wrong-password" || errCode === "auth/user-not-found") {
        errMsg = "Invalid email or password.";
      } else if (errCode === "auth/too-many-requests") {
        errMsg = "Too many failed attempts. Try again later.";
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 relative overflow-hidden font-sans">

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Illustration / Brand panel */}
        <div className="hidden md:flex flex-col items-center justify-center rounded-[1rem] p-8 bg-gradient-to-br from-primary/10 to-accent/6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-card mb-6">
            <Compass className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Tourenvi Admin</h2>
          <p className="text-sm text-secondary mt-2 text-center">Authorized operations console — restricted access only.</p>
        </div>

        {/* Main Login Card */}
        <div className="w-full rounded-[1rem] border border-border bg-card p-8 shadow-card">
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-secondary">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="commander@tourenvi.com"
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-secondary">Operations Key</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-2 py-3 px-4 rounded-lg text-sm font-semibold uppercase tracking-wider text-card bg-primary hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-card" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Homepage
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
