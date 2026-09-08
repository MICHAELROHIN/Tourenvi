import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot, setDoc, deleteDoc, getDoc, type DocumentData } from "firebase/firestore";
import { auth, db, getGoogleRedirectResult, logout, type UserRole } from "@/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { toast } from "sonner";

export const SUPER_ADMIN_EMAIL = "michaelrohin@gmail.com";

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
};

type AuthContextValue = {
  currentUser: User | null;
  userRole: UserRole | null;
  userDoc: DocumentData | null;
  loading: boolean;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  userRole: null,
  userDoc: null,
  loading: true,
  isSuperAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userDoc, setUserDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clear previous snapshot listeners
      unsubs.forEach((u) => {
        try { u(); } catch {}
      });
      unsubs = [];

      if (!user) {
        setCurrentUser(null);
        setUserRole(null);
        setUserDoc(null);
        setLoading(false);
        return;
      }

      const userEmail = user.email?.trim().toLowerCase() || "";
      const isSuper = userEmail === SUPER_ADMIN_EMAIL;

      // 1. Initial lookup to block suspended users before unlocking loading gate
      try {
        const [adminSnap, userSnap] = await Promise.all([
          getDoc(doc(db, "admins", user.uid)).catch(() => null),
          getDoc(doc(db, "users", user.uid)).catch(() => null),
        ]);

        const docData = adminSnap?.exists()
          ? adminSnap.data()
          : userSnap?.exists()
          ? userSnap.data()
          : null;

        if (!isSuper && docData?.status === "suspended") {
          await logout().catch(() => undefined);
          setCurrentUser(null);
          setUserRole(null);
          setUserDoc(null);
          setLoading(false);
          toast.error("Your account has been temporarily suspended. Please contact the administrator at michaelrohin@gmail.com.");
          return;
        }

        // Account is active
        setCurrentUser(user);
        if (adminSnap?.exists()) {
          setUserDoc({ ...adminSnap.data(), isSuperAdmin: isSuper || !!adminSnap.data().isSuperAdmin });
          setUserRole("admin");
        } else if (userSnap?.exists()) {
          const uData = userSnap.data();
          if (uData.role === "admin") {
            setDoc(doc(db, "admins", user.uid), { ...uData, role: "admin" }).then(() => {
              deleteDoc(doc(db, "users", user.uid)).catch(() => {});
            }).catch(() => {});
            setUserDoc({ ...uData, role: "admin", isSuperAdmin: isSuper || !!uData.isSuperAdmin });
            setUserRole("admin");
          } else {
            setUserDoc({ ...uData, isSuperAdmin: isSuper });
            setUserRole((uData.role as UserRole) || "user");
          }
        } else {
          setUserDoc({ isSuperAdmin: isSuper, status: "active", role: "user" });
          setUserRole("user");
        }
      } catch (err) {
        console.warn("Initial user doc check warning:", err);
        setCurrentUser(user);
        setUserRole("user");
      } finally {
        setLoading(false);
      }

      // 2. Realtime listener for live suspension enforcement
      const unsubAdmins = onSnapshot(
        doc(db, "admins", user.uid),
        (adminSnap) => {
          if (adminSnap.exists()) {
            const data = adminSnap.data();
            if (!isSuper && data.status === "suspended") {
              logout().catch(() => undefined);
              setCurrentUser(null);
              setUserDoc(null);
              setUserRole(null);
              toast.error("Your account has been temporarily suspended. Please contact the administrator.");
              return;
            }
            setUserDoc({ ...data, isSuperAdmin: isSuper || !!data.isSuperAdmin });
            setUserRole("admin");
          }
        },
        () => {}
      );
      unsubs.push(unsubAdmins);

      const unsubUsers = onSnapshot(
        doc(db, "users", user.uid),
        (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (!isSuper && data.status === "suspended") {
              logout().catch(() => undefined);
              setCurrentUser(null);
              setUserDoc(null);
              setUserRole(null);
              toast.error("Your account has been temporarily suspended. Please contact the administrator.");
              return;
            }
            if (data.role !== "admin") {
              setUserDoc({ ...data, isSuperAdmin: isSuper });
              setUserRole((data.role as UserRole) || "user");
            }
          }
        },
        () => {}
      );
      unsubs.push(unsubUsers);
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, []);

  // Capture redirect-based Google sign-in result on app load
  useEffect(() => {
    getGoogleRedirectResult().catch(() => {
      // Silently ignore — no redirect was pending
    });
  }, []);

  const isSuperAdmin = useMemo(() => {
    return isSuperAdminEmail(currentUser?.email) || userDoc?.isSuperAdmin === true;
  }, [currentUser, userDoc]);

  const value = useMemo(
    () => ({
      currentUser,
      userRole,
      userDoc,
      loading,
      isSuperAdmin,
    }),
    [currentUser, userRole, userDoc, loading, isSuperAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export const getCurrentUid = () => auth.currentUser?.uid ?? null;
