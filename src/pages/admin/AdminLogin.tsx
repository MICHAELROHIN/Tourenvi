import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminAuth, adminDb } from "@/lib/firebaseAdminAuth";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { Leaf, Mail, KeyRound, Loader2, ArrowLeft, Eye, EyeOff, ArrowRight } from "lucide-react";
import bgImage from "@/assets/background.jpg";

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto p-4 font-['Poppins',sans-serif]">

      {/* --- FULLPAGE BLURRED BACKGROUND --- */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center blur-[24px] scale-110"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/25" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-[26px] bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-300">

        {/* Top Branding */}
        <div className="mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2ecc71] text-white shadow-[0_6px_20px_rgba(46,204,113,0.35)]">
              <Leaf className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1e3b34]">Tourenvi Admin</h2>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#2ecc71] font-bold">Operations Center</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-normal">Authorized admin login only. Enter your credentials below.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="relative mb-3.5 w-full">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="commander@tourenvi.com"
              className="peer w-full rounded-xl border border-transparent bg-[#f4f7f6] px-4 py-3 pl-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20"
            />
          </div>

          <div className="relative mb-5 w-full">
            <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="peer w-full rounded-xl border border-transparent bg-[#f4f7f6] px-4 py-3 pl-11 pr-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#2ecc71]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] py-3.5 text-sm font-bold font-sans text-white shadow-[0_6px_20px_rgba(46,204,113,0.35)] transition-all hover:bg-[#27ae60] active:scale-[0.98] disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>Initialize Session <ArrowRight className="h-4 w-4 stroke-[2.5]" /></>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-5 text-center">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#1e3b34] transition-colors duration-300 cursor-pointer"
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
