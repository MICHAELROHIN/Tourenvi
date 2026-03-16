import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot, type DocumentData } from "firebase/firestore";
import { auth, db, onAuthChange, type UserRole } from "@/firebase";
import type { User } from "firebase/auth";

type AuthContextValue = {
  currentUser: User | null;
  userRole: UserRole | null;
  userDoc: DocumentData | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  userRole: null,
  userDoc: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userDoc, setUserDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthChange((user, role) => {
      setCurrentUser(user);
      setUserRole(role ?? null);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (!user) {
        setUserDoc(null);
        setLoading(false);
        return;
      }

      unsubscribeUserDoc = onSnapshot(
        doc(db, "users", user.uid),
        (snap) => {
          const data = snap.exists() ? snap.data() : null;
          setUserDoc(data);
          setUserRole((data?.role as UserRole | undefined) ?? role ?? "user");
          setLoading(false);
        },
        () => {
          setUserDoc(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userRole,
      userDoc,
      loading,
    }),
    [currentUser, userRole, userDoc, loading],
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
