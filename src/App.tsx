import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Hotels from "./pages/Hotels"; 
import Cart from "./pages/Cart";
import RoutePlanner from "@/components/RoutePlanner";
import FuelEstimator from "@/components/FuelEstimator";
import DestinationChooser from "@/components/DestinationChooser";
import AIChat from "./pages/AIChat";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// ✨ 1. Protected Route: Forces login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// ✨ 2. Public Route: Forces Home if ALREADY authenticated (prevents seeing login again)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const showNav = location.pathname !== "/login";

  return (
    <div className="min-h-screen bg-background">
      {showNav && <Navigation />} 
      
      <Routes>
        {/* ✨ PROTECTED ROUTES: Require Login */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hotels" 
          element={
            <ProtectedRoute>
              <Hotels />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cart" 
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/route-planner" 
          element={
            <ProtectedRoute>
              <RoutePlanner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fuel-estimator" 
          element={
            <ProtectedRoute>
              <FuelEstimator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/destination-genie" 
          element={
            <ProtectedRoute>
              <DestinationChooser />
            </ProtectedRoute>
          } 
        />
        <Route 
  path="/chatAI" 
  element={
    <ProtectedRoute>
      <AIChat />
    </ProtectedRoute>
  } 
/>
        
        {/* ✨ PUBLIC ROUTE: Only accessible if NOT logged in */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;