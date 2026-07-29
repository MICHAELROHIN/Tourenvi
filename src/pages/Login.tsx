import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  KeyRound,
  Leaf,
  Mail,
  Phone,
  User2,
} from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  sendPasswordReset,
  db,
  loginWithEmail,
  loginWithGoogle,
  logout,
  signUpWithEmail,
  type UserRole,
} from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import PasswordRecoveryDialog from "@/components/auth/PasswordRecoveryDialog";

// --- IMPORT YOUR LOCAL BACKGROUND IMAGE HERE ---
import bgImage from "@/assets/background.jpg";

const roleRoutes: Record<UserRole, string> = {
  user: "/hero",
  admin: "/admin/dashboard",
  guide: "/guide/dashboard",
  support: "/support/dashboard",
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, currentUser } = useAuth();

  // --- Auth States ---
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // Added Phone State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  // --- UI Animation State ---
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial delay before lifting the shutter
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // --- Redirect Logic ---
  useEffect(() => {
    if (currentUser && userRole) {
      navigate(roleRoutes[userRole], { replace: true });
    }
  }, [currentUser, navigate, userRole]);

  const routeAfterAuth = (role: UserRole | null) => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from && from !== "/login") {
      navigate(from, { replace: true });
      return;
    }
    navigate(role ? roleRoutes[role] : "/hero", { replace: true });
  };

  const getAuthErrorMessage = (error: unknown): string => {
    const code = (error as { code?: string })?.code || "";
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password. Please check your credentials.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please log in.";
      case "auth/weak-password":
        return "Password should be at least 6 characters long.";
      case "auth/too-many-requests":
        return "Access to this account is temporarily disabled due to many failed login attempts. Reset your password or try again later.";
      default:
        return error instanceof Error ? error.message : "Authentication error.";
    }
  };

  const resolveExistingAccount = async (firebaseUser: User): Promise<UserRole> => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          phone: firebaseUser.phoneNumber || "",
          role: "user",
          createdAt: serverTimestamp(),
        }).catch((err) => console.warn("Could not create user document:", err));
        return "user";
      }
      return (snap.data().role as UserRole | undefined) ?? "user";
    } catch (e) {
      console.warn("Could not fetch user document, defaulting to user role:", e);
      return "user";
    }
  };

  // --- Auth Handlers ---
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await logout().catch(() => undefined);
      const credential = await loginWithEmail(email, password);
      const resolvedRole = await resolveExistingAccount(credential.user);
      toast.success("Signed in successfully");
      routeAfterAuth(resolvedRole);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      await logout().catch(() => undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signUpWithEmail(email, password, "user", name.trim(), phone.trim());

      toast.success("Account created successfully");
      routeAfterAuth("user");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email to reset password");
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      toast.success("Reset link sent to your email");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send reset email.";
      toast.error(message);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const credential = await loginWithGoogle();
      if (credential?.user) {
        const userRef = doc(db, "users", credential.user.uid);
        const snap = await getDoc(userRef);
        let resolvedRole: UserRole = "user";
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: credential.user.uid,
            name: credential.user.displayName || "Google User",
            email: credential.user.email || "",
            phone: credential.user.phoneNumber || "",
            role: "user",
            createdAt: serverTimestamp(),
          });
        } else {
          resolvedRole = (snap.data().role as UserRole | undefined) ?? "user";
        }
        toast.success("Signed in with Google");
        routeAfterAuth(resolvedRole);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in with Google. Please check your account.";
      toast.error(message);
      await logout().catch(() => undefined);
    } finally {
      setLoading(false);
    }
  };

  // SVG Google Logo
  const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden font-['Poppins',sans-serif]">

      {/* --- FULLPAGE BLURRED BACKGROUND --- */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-[24px] scale-110"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/25" />

      {/* --- 1. SHUTTER --- */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1a3c35] transition-all duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)]
          ${isLoaded ? "-translate-y-full rounded-b-[50%_20%]" : "translate-y-0 rounded-b-none"}
        `}
      >
        <div
          className={`flex items-center gap-3 text-5xl font-bold font-sans text-white transition-opacity duration-1000
            ${isLoaded ? "opacity-0" : "opacity-100"}
          `}
        >
          <Leaf className="h-12 w-12 text-[#2ecc71]" strokeWidth={2.5} />
          TOURENVI
        </div>
      </div>

      {/* --- 2. MAIN CARD --- */}
      <div
        className={`relative z-10 min-h-[600px] w-[950px] max-w-[92%] overflow-hidden rounded-[30px] bg-white shadow-2xl transition-all duration-1000 delay-[400ms] ease-out
          ${isLoaded ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-95"}
        `}
      >

        {/* SIGN UP FORM */}
        <div
          className={`absolute left-0 top-0 h-full w-1/2 transition-all duration-700 ease-in-out
            ${isRegister ? "translate-x-[100%] opacity-100 z-50" : "opacity-0 z-10"}
          `}
        >
          <form onSubmit={handleRegister} className="flex h-full flex-col items-center justify-center bg-white px-12 text-center">
            <h1 className="mb-2 text-3xl font-bold font-sans text-[#1e3b34]">Create Account</h1>
            <p className="mb-6 text-sm text-gray-400">Join our sustainable travel community</p>

            <div className="relative mb-3 w-full">
              <User2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="peer w-full rounded-xl border-2 border-transparent bg-[#f0f4f8] px-4 py-3 pl-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71]"
              />
            </div>

            <div className="relative mb-3 w-full">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="peer w-full rounded-xl border-2 border-transparent bg-[#f0f4f8] px-4 py-3 pl-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71]"
              />
            </div>

            <div className="relative mb-3 w-full">
              <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                required
                className="peer w-full rounded-xl border-2 border-transparent bg-[#f0f4f8] px-4 py-3 pl-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71]"
              />
            </div>

            <div className="relative mb-4 w-full">
              <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={6}
                required
                className="peer w-full rounded-xl border-2 border-transparent bg-[#f0f4f8] px-4 py-3 pl-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] py-3.5 text-sm font-bold font-sans text-white shadow-md transition-all hover:bg-[#27ae60] active:scale-95 disabled:opacity-70"
            >
              {loading ? "Please wait..." : "Register"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <div className="my-3 flex w-full items-center">
              <hr className="w-full border-gray-200" />
              <span className="px-3 text-xs text-gray-400">OR</span>
              <hr className="w-full border-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold font-sans text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <GoogleIcon />
              {loading ? "Please wait..." : "Sign up with Google"}
            </button>
          </form>
        </div>

        {/* SIGN IN FORM */}
        <div
          className={`absolute left-0 top-0 h-full w-1/2 z-20 transition-all duration-700 ease-in-out
            ${isRegister ? "translate-x-[100%] opacity-0" : "opacity-100"}
          `}
        >
          <form onSubmit={handleLogin} className="flex h-full flex-col items-center justify-center bg-white px-12 text-center">
            <h1 className="mb-2 text-3xl font-bold font-sans text-[#1e3b34]">Welcome Back</h1>
            <p className="mb-6 text-sm text-gray-400">Please enter your details to sign in.</p>

            <div className="relative mb-4 w-full">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="peer w-full rounded-xl border-2 border-transparent bg-[#f0f4f8] px-4 py-3 pl-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71]"
              />
            </div>

            <div className="relative mb-3 w-full">
              <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 peer-focus:text-[#2ecc71] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="peer w-full rounded-xl border-2 border-transparent bg-[#f0f4f8] px-4 py-3 pl-11 text-sm text-gray-700 outline-none transition-all focus:bg-white focus:border-[#2ecc71]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] py-3.5 text-sm font-bold font-sans text-white shadow-md transition-all hover:bg-[#27ae60] active:scale-95 disabled:opacity-70"
            >
              {loading ? "Please wait..." : "Log In"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <div className="my-4 flex w-full items-center">
              <hr className="w-full border-gray-200" />
              <span className="px-3 text-xs text-gray-400">OR</span>
              <hr className="w-full border-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold font-sans text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <GoogleIcon />
              {loading ? "Please wait..." : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={() => setIsRecoveryOpen(true)}
              className="mt-5 text-sm font-semibold font-sans text-[#1e3b34] transition-all hover:underline"
            >
              Forgot Password?
            </button>
          </form>
        </div>

        {/* OVERLAY CONTAINER (Right Side Green Panel) */}
        <div
          className={`absolute left-1/2 top-0 z-[100] h-full w-1/2 overflow-hidden transition-transform duration-700 ease-in-out
            ${isRegister ? "-translate-x-full" : ""}
          `}
        >
          <div
            className={`relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out
              ${isRegister ? "translate-x-1/2" : "translate-x-0"}
            `}
          >
            {/* Dark Scenic Background (Using Local Image) */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgImage})` }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-[#1a3c35]/20 mix-blend-multiply" />
            </div>

            {/* OVERLAY PANEL LEFT (Active during Sign Up) */}
            <div
              className={`absolute top-0 z-10 flex h-full w-1/2 flex-col items-center justify-center px-12 text-center text-white transition-transform duration-700 ease-in-out
                ${isRegister ? "translate-x-0" : "-translate-x-[20%]"}
              `}
            >
              <h1 className="mb-3 text-4xl font-bold font-sans">Already part of us?</h1>
              <p className="mb-8 max-w-xs text-sm font-light opacity-90">
                To keep connected with your eco-friendly trips, please log in with your personal info!
              </p>
              <button
                onClick={() => setIsRegister(false)}
                className="rounded-full border-2 border-white bg-transparent px-10 py-3 text-xs font-bold font-sans tracking-widest text-white uppercase transition-all hover:bg-white hover:text-gray-800 active:scale-95"
              >
                Sign In
              </button>
            </div>

            {/* OVERLAY PANEL RIGHT (Active during Sign In) */}
            <div
              className={`absolute right-0 top-0 z-10 flex h-full w-1/2 flex-col items-center justify-center px-12 text-center text-white transition-transform duration-700 ease-in-out
                ${isRegister ? "translate-x-[20%]" : "translate-x-0"}
              `}
            >
              <h1 className="mb-3 text-4xl font-bold font-sans">New here?</h1>
              <p className="mb-8 max-w-xs text-sm font-light opacity-90">
                Sign up and discover a great amount of new opportunities!
              </p>
              <button
                onClick={() => setIsRegister(true)}
                className="rounded-full border-2 border-white bg-transparent px-10 py-3 text-xs font-bold font-sans tracking-widest text-white uppercase transition-all hover:bg-white hover:text-gray-800 active:scale-95"
              >
                Create An Account
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Password Recovery Popup Card Dialog */}
      <PasswordRecoveryDialog
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
};

export default Login;