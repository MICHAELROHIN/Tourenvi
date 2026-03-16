import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  KeyRound,
  Leaf,
  Mail,
  ShieldCheck,
  User2,
} from "lucide-react";
import bgImage from "@/assets/background.jpg";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sendPasswordReset,
  db,
  loginWithEmail,
  signUpWithEmail,
  type UserRole,
} from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";

const roleRoutes: Record<UserRole, string> = {
  user: "/dashboard",
  admin: "/admin/dashboard",
  guide: "/guide/dashboard",
  support: "/support/dashboard",
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, currentUser } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleChoice, setRoleChoice] = useState<"traveler" | "local-guide">(
    "traveler",
  );

  useEffect(() => {
    if (currentUser && userRole) {
      navigate(roleRoutes[userRole], { replace: true });
    }
  }, [currentUser, navigate, userRole]);

  const resolveRole = (): UserRole => {
    return roleChoice === "local-guide" ? "guide" : "user";
  };

  const routeAfterAuth = (role: UserRole | null) => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from && from !== "/login") {
      navigate(from, { replace: true });
      return;
    }
    navigate(role ? roleRoutes[role] : "/dashboard", { replace: true });
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const credential = await loginWithEmail(email, password);
      toast.success("Signed in successfully");
      let resolvedRole: UserRole | null = userRole;

      if (!resolvedRole) {
        try {
          const snap = await getDoc(doc(db, "users", credential.user.uid));
          if (snap.exists()) {
            resolvedRole = (snap.data().role as UserRole | undefined) ?? "user";
          }
        } catch {
          resolvedRole = null;
        }
      }

      const fallbackRole = (
        credential.user.email?.includes("admin") ? "admin" : "user"
      ) as UserRole;
      routeAfterAuth(resolvedRole ?? fallbackRole);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const role = resolveRole();
      await signUpWithEmail(email, password, role, name.trim());
      toast.success("Account created");
      routeAfterAuth(role);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create account.";
      toast.error(message);
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

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#10211f]">
      <img
        src={bgImage}
        alt="travel"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-[#10211f]" />

      <Card className="relative z-10 w-full max-w-md border-white/20 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 text-emerald-700">
            <Leaf className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Tourenvi
            </span>
          </div>
          <CardTitle className="text-2xl">
            {isRegister ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? "Register as a traveler or local guide"
              : "Login to continue to your travel dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={isRegister ? handleRegister : handleLogin}
          >
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User2 className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="name"
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="email"
                  className="pl-9"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="password"
                  className="pl-9"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={roleChoice}
                  onValueChange={(value: "traveler" | "local-guide") =>
                    setRoleChoice(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traveler">Traveler</SelectItem>
                    <SelectItem value="local-guide">Local Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="w-full" disabled={loading} type="submit">
              <ShieldCheck className="h-4 w-4 mr-2" />
              {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setIsRegister((prev) => !prev)}
              className="text-primary hover:underline"
            >
              {isRegister ? "Already registered? Login" : "New user? Register"}
            </button>
            {!isRegister && (
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-muted-foreground hover:text-foreground"
              >
                Forgot password
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
