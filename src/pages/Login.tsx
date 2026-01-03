import React, { useState, useEffect } from 'react';
import { Mail, Lock, Leaf, ArrowRight, User, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bgImage from '@/assets/background.jpg'; 

// --- FIREBASE IMPORTS ---
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo, 
  deleteUser 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase'; 

// --- Google Icon Component ---
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Login: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  // --- FORM STATES ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // ✨ State for the Custom Modal
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // --- 1. HANDLE MANUAL SIGN UP ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      localStorage.setItem("isAuthenticated", "true");
      navigate("/"); 
    } catch (err: any) {
      console.error("Sign Up Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Try logging in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message);
      }
    }
  };

  // --- 2. HANDLE MANUAL LOG IN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/");
    } catch (err: any) {
      console.error("Log In Error:", err);
      if (err.code === 'auth/invalid-credential') {
         setError("Invalid email or password.");
      } else {
         setError("Failed to log in. Please check your details.");
      }
    }
  };

  // --- 3. HANDLE GOOGLE AUTH ---
  const handleGoogleAuth = async (mode: 'login' | 'signup') => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser;

      // 🛑 SCENARIO: User tries to 'Log In' but account does not exist (was deleted)
      if (mode === 'login' && isNewUser) {
        // 1. Rollback: Delete the temporary user Firebase created
        await deleteUser(user);
        
        // 2. ✨ Show the Custom Modal instead of Alert
        setShowErrorModal(true);
        return;
      }

      // ✅ Valid Login or Sign Up
      localStorage.setItem("isAuthenticated", "true");
      navigate("/");

    } catch (error: any) {
      console.error("Google Auth Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setError("Google authentication failed. Please try again.");
      }
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden font-['Poppins']">
      
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="Background" className="h-full w-full object-cover blur-md scale-110" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* --- SHUTTER ANIMATION --- */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1a3c35] transition-all duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${isLoaded ? '-translate-y-full rounded-b-[50%_20%]' : 'translate-y-0 rounded-b-none'}`}>
        <div className={`flex items-center gap-3 text-5xl font-bold text-white transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
          <Leaf className="h-12 w-12 text-[#2ecc71]" strokeWidth={2.5} />
          TOURENVI
        </div>
      </div>

      {/* --- MAIN CARD --- */}
      <div className={`relative z-10 w-[1000px] max-w-[90%] h-[650px] bg-white rounded-[30px] shadow-[0_20px_60px_rgba(26,60,53,0.15)] overflow-hidden transition-all duration-1000 delay-[400ms] ease-out ${isLoaded ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[100px] scale-95 opacity-0'}`}>

        {/* --- SIGN UP FORM --- */}
        <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col justify-center p-12 transition-all duration-700 ease-in-out bg-white ${isSignUp ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10'}`}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#1a3c35] mb-2">Create Account</h1>
            <p className="text-sm text-[#889898]">Join us for a sustainable future.</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
            {/* Inputs... */}
            <div className="relative">
              <input type="text" placeholder="Full Name" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-3 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <div className="relative">
              <input type="email" placeholder="Email Address" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-3 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <div className="relative">
              <input type="password" placeholder="Password" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-3 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            
            {error && isSignUp && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] py-3 text-base font-semibold text-white shadow-lg hover:bg-[#219150] transition-all active:scale-95">
              Sign Up <ArrowRight className="h-4 w-4" />
            </button>
            
            <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                <div className="relative bg-white px-2 text-xs text-gray-400 uppercase">Or</div>
            </div>

            <button type="button" onClick={() => handleGoogleAuth('signup')} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-100 bg-white py-3 text-sm font-semibold text-[#1a3c35] hover:bg-gray-50 transition-all active:scale-95">
               <GoogleIcon /> Sign up with Google
            </button>
          </form>
        </div>

        {/* --- SIGN IN FORM --- */}
        <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col justify-center p-12 transition-all duration-700 ease-in-out bg-white ${isSignUp ? 'translate-x-full opacity-0' : 'opacity-100 z-20'}`}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a3c35] mb-2">Welcome Back</h1>
            <p className="text-sm text-[#889898]">Please enter your details to sign in.</p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="relative">
              <input type="email" placeholder="Email Address" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-3 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <div className="relative">
              <input type="password" placeholder="Password" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-3 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>

            {error && !isSignUp && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] py-3 text-base font-semibold text-white shadow-lg hover:bg-[#219150] transition-all active:scale-95">
              Log In <ArrowRight className="h-4 w-4" />
            </button>

             <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                <div className="relative bg-white px-2 text-xs text-gray-400 uppercase">Or</div>
            </div>

            <button type="button" onClick={() => handleGoogleAuth('login')} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-100 bg-white py-3 text-sm font-semibold text-[#1a3c35] hover:bg-gray-50 transition-all active:scale-95">
               <GoogleIcon /> Continue with Google
            </button>

            <div className="text-center text-sm text-[#888]">
              <a href="#" className="font-semibold text-[#1a3c35] hover:text-[#2ecc71] hover:underline">Forgot Password?</a>
            </div>
          </form>
        </div>

        {/* --- OVERLAY --- */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isSignUp ? '-translate-x-full rounded-r-[30px]' : 'rounded-l-[30px]'}`}>
          <div className={`relative -left-full h-full w-[200%] bg-[#1a3c35] text-white transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}`}>
            <div className="absolute inset-0 z-0 opacity-40">
               <img src={bgImage} alt="Overlay" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 z-0 bg-[#1a3c35]/60" />

            <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ease-in-out z-10 ${isSignUp ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h1 className="text-3xl font-bold mb-4">One of us?</h1>
              <p className="text-sm opacity-90 mb-8 leading-relaxed">If you already have an account, just log in.</p>
              <button onClick={() => { setIsSignUp(false); setError(""); }} className="px-8 py-3 rounded-full border-2 border-white text-white font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-[#1a3c35] transition-all">Log In</button>
            </div>

            <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ease-in-out z-10 ${isSignUp ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h1 className="text-3xl font-bold mb-4">New here?</h1>
              <p className="text-sm opacity-90 mb-8 leading-relaxed">Sign up and discover a great amount of new opportunities!</p>
              <button onClick={() => { setIsSignUp(true); setError(""); }} className="px-8 py-3 rounded-full border-2 border-white text-white font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-[#1a3c35] transition-all">Create an Account</button>
            </div>
          </div>
        </div>

      </div>

      {/* --- CUSTOM ERROR MODAL (Like your Screenshot) --- */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[400px] max-w-[90%] bg-white rounded-xl shadow-2xl p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Account Not Found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                We couldn't find an account associated with this Google ID. Would you like to create a new one?
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {/* Cancel Button */}
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              
              {/* Create Account Button (Styles match the screenshot layout) */}
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setIsSignUp(true); // ✨ Switch to Sign Up View
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2ecc71] rounded-lg hover:bg-[#219150] focus:outline-none focus:ring-2 focus:ring-[#2ecc71] shadow-md"
              >
                Create Account
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Login;