import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminAuth, adminDb } from "@/lib/firebaseAdminAuth";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { Compass, Mail, KeyRound, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in as admin on the isolated session, redirect to dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (user) => {
      if (user) {
        try {
          const adminSnap = await getDoc(doc(adminDb, "admins", user.uid));
          const userDocSnap = adminSnap.exists() ? adminSnap : await getDoc(doc(adminDb, "users", user.uid));
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

      // 2. Fetch User Profile from Firestore to check Role (Check admins collection first, then users)
      let role: string | null = null;
      try {
        const adminSnap = await getDoc(doc(adminDb, "admins", credential.user.uid));
        if (adminSnap.exists()) {
          role = adminSnap.data().role || "admin";
        } else {
          const userDocSnap = await getDoc(doc(adminDb, "users", credential.user.uid));
          if (userDocSnap.exists()) {
            role = userDocSnap.data().role;
          }
        }
      } catch (firestoreErr) {
        console.warn("Admin Firestore role check error:", firestoreErr);
      }

      if (role !== "admin") {
        await signOut(adminAuth);
        toast.error("Access denied. Admin privileges required for this portal.");
        setLoading(false);
        return;
      }

      // Success
      toast.success("Welcome back, Commander.");
      navigate("/admin", { replace: true });
    } catch (error: unknown) {
      console.error("Admin sign in error:", error);
      const errCode = (error as { code?: string })?.code || "";
      let errMsg = "Failed to sign in.";
      if (errCode === "auth/invalid-credential" || errCode === "auth/wrong-password" || errCode === "auth/user-not-found" || errCode === "auth/invalid-email") {
        errMsg = "Invalid email or password.";
      } else if (errCode === "auth/too-many-requests") {
        errMsg = "Too many failed attempts. Try again later.";
      } else if (errCode === "auth/unauthorized-domain") {
        errMsg = "Domain not authorized. Please add tourenvi-web.vercel.app to Firebase Authentication Authorized Domains.";
      } else if (errCode === "auth/network-request-failed") {
        errMsg = "Network error. Please check your internet connection.";
      } else if (error instanceof Error && error.message) {
        errMsg = error.message;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#051124] p-4 relative overflow-hidden font-sans">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#0B2B5C]/40 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-[150px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B2B5C]/15 backdrop-blur-xl p-8 shadow-[0_12px_40px_rgba(5,17,36,0.8)] relative z-10 transition-all duration-300 hover:border-white/15">

        {/* Top Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#0B2B5C] shadow-[0_0_20px_rgba(212,175,55,0.4)] mb-4">
            <Compass className="h-8 w-8 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tourenvi Admin</h2>
          <p className="text-xs text-gray-400 mt-1">Authorized Operations Login Only</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="commander@tourenvi.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">Operations Key</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-3.5 text-gray-400 transition-colors hover:text-[#D4AF37]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-2 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-[#0B2B5C] bg-[#D4AF37] hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Initialize Session"
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
