import React, { useState, useEffect } from 'react';
import { Mail, Lock, Leaf, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bgImage from '@/assets/background.jpg'; 

const Login: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // ✨ State for sliding animation
  const navigate = useNavigate();

  useEffect(() => {
    // 800ms delay before shutter animation starts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("isAuthenticated", "true");
    navigate("/");
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just redirect to login logic or handle signup API
    localStorage.setItem("isAuthenticated", "true");
    navigate("/");
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden font-['Poppins']">
      
      {/* BACKGROUND IMAGE LAYER */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="Background" className="h-full w-full object-cover blur-md scale-110" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* --- 1. SHUTTER ANIMATION --- */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1a3c35] transition-all duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${isLoaded ? '-translate-y-full rounded-b-[50%_20%]' : 'translate-y-0 rounded-b-none'}`}>
        <div className={`flex items-center gap-3 text-5xl font-bold text-white transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
          <Leaf className="h-12 w-12 text-[#2ecc71]" strokeWidth={2.5} />
          TOURENVI
        </div>
      </div>

      {/* --- 2. MAIN CARD CONTAINER --- */}
      <div className={`relative z-10 w-[1000px] max-w-[90%] h-[600px] bg-white rounded-[30px] shadow-[0_20px_60px_rgba(26,60,53,0.15)] overflow-hidden transition-all duration-1000 delay-[400ms] ease-out ${isLoaded ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[100px] scale-95 opacity-0'}`}>

        {/* --- FORM 1: SIGN UP (Hidden Initially) --- */}
        <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col justify-center p-12 transition-all duration-700 ease-in-out bg-white ${isSignUp ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10'}`}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a3c35] mb-2">Create Account</h1>
            <p className="text-sm text-[#889898]">Join us for a sustainable future.</p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleSignUp}>
            <div className="relative">
              <input type="text" placeholder="Full Name" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-4 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required />
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <div className="relative">
              <input type="email" placeholder="Email Address" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-4 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required />
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <div className="relative">
              <input type="password" placeholder="Password" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-4 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required />
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] py-4 text-base font-semibold text-white shadow-lg hover:bg-[#219150] transition-all active:scale-95">
              Sign Up <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* --- FORM 2: SIGN IN (Visible Initially) --- */}
        <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col justify-center p-12 transition-all duration-700 ease-in-out bg-white ${isSignUp ? 'translate-x-full opacity-0' : 'opacity-100 z-20'}`}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a3c35] mb-2">Welcome Back</h1>
            <p className="text-sm text-[#889898]">Please enter your details to sign in.</p>
          </div>
          <form className="flex flex-col gap-6" onSubmit={handleLogin}>
            <div className="relative">
              <input type="email" placeholder="Email Address" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-4 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required />
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <div className="relative">
              <input type="password" placeholder="Password" className="peer w-full rounded-xl border-2 border-transparent bg-[#f7f9f8] px-5 py-4 pl-12 text-sm text-[#1a3c35] outline-none transition-all focus:border-[#2ecc71] focus:bg-white" required />
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aebdbb] transition-colors peer-focus:text-[#2ecc71]" />
            </div>
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] py-4 text-base font-semibold text-white shadow-lg hover:bg-[#219150] transition-all active:scale-95">
              Log In <ArrowRight className="h-4 w-4" />
            </button>
            <div className="text-center text-sm text-[#888]">
              <a href="#" className="font-semibold text-[#1a3c35] hover:text-[#2ecc71] hover:underline">Forgot Password?</a>
            </div>
          </form>
        </div>

        {/* --- OVERLAY CONTAINER (Sliding Green Panel) --- */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isSignUp ? '-translate-x-full rounded-r-[30px]' : 'rounded-l-[30px]'}`}>
          
          <div className={`relative -left-full h-full w-[200%] bg-[#1a3c35] text-white transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}`}>
            
            {/* Overlay Background Image with Tint */}
            <div className="absolute inset-0 z-0 opacity-40">
               <img src={bgImage} alt="Overlay" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 z-0 bg-[#1a3c35]/60" />

            {/* --- PANEL LEFT: "One of us?" (Shows when SignUp is active) --- */}
            <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ease-in-out z-10 ${isSignUp ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h1 className="text-3xl font-bold mb-4">One of us?</h1>
              <p className="text-sm opacity-90 mb-8 leading-relaxed">
                If you already have an account, just sign in. We've missed you!
              </p>
              <button onClick={() => setIsSignUp(false)} className="px-8 py-3 rounded-full border-2 border-white text-white font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-[#1a3c35] transition-all">
                Sign In
              </button>
            </div>

            {/* --- PANEL RIGHT: "New here?" (Shows when SignIn is active) --- */}
            <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-700 ease-in-out z-10 ${isSignUp ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h1 className="text-3xl font-bold mb-4">New here?</h1>
              <p className="text-sm opacity-90 mb-8 leading-relaxed">
                Sign up and discover a great amount of new opportunities for eco-travel!
              </p>
              <button onClick={() => setIsSignUp(true)} className="px-8 py-3 rounded-full border-2 border-white text-white font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-[#1a3c35] transition-all">
                Create an Account
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;