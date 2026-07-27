import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  RecaptchaVerifier,
  type User,
  type Unsubscribe,
  type ConfirmationResult as FirebaseConfirmationResult,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCh9nN8yktf1Igf6QB71w97amHwLP_v070",
  authDomain: "tourenvi-2fbd6.firebaseapp.com",
  projectId: "tourenvi-2fbd6",
  storageBucket: "tourenvi-2fbd6.firebasestorage.app",
  messagingSenderId: "813421473298",
  appId: "1:813421473298:web:821919c6dca8c08e0172cb",
  measurementId: "G-6ZEEJ6GR4T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

if (typeof window !== "undefined") {
  getAnalytics(app);
}

export type UserRole = "user" | "admin" | "guide" | "support";

export const signUpWithEmail = async (
  email: string,
  password: string,
  role: UserRole,
  name: string,
  phone?: string,
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(
    doc(db, "users", credential.user.uid),
    {
      name,
      email,
      phone: phone?.trim() || "",
      role,
      createdAt: serverTimestamp(),
      isActive: true,
      tripsCreated: 0,
      totalDistance: 0,
      profileComplete: false,
    },
    { merge: true },
  );

  return credential;
};

export const loginWithEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential;
};

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const logout = async () => {
  await signOut(auth);
};

export const onAuthChange = (
  callback: (user: User | null, role?: UserRole | null) => void,
): Unsubscribe => {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }

    // Publish the authenticated user immediately so protected routes can render.
    // The Firestore role lookup below refines permissions after the page is visible.
    callback(user, null);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const role = userSnap.exists()
        ? (userSnap.data().role as UserRole | undefined)
        : undefined;
      callback(user, role ?? null);
    } catch {
      // Do not block auth propagation if role lookup fails temporarily.
      callback(user, "user");
    }
  });
};

export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// --- Phone OTP helpers ---

export type ConfirmationResult = FirebaseConfirmationResult;

let recaptchaVerifier: RecaptchaVerifier | null = null;

export const sendPhoneOtp = async (
  phoneNumber: string,
  recaptchaContainerId: string,
): Promise<ConfirmationResult> => {
  // Create or reuse the invisible reCAPTCHA verifier
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: "invisible",
    });
  }
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

export const findUserByPhone = async (
  phoneNumber: string,
): Promise<boolean> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("phone", "==", phoneNumber));
  const snap = await getDocs(q);
  return !snap.empty;
};