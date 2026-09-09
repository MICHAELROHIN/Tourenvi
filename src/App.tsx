import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { TripProvider } from "@/context/TripContext";
import Navigation from "@/components/Navigation";
import ElitePlanner from "@/pages/ElitePlanner";
import EliteDashboard from "@/pages/EliteDashboard";
import TripsPlanned from "@/pages/TripsPlanned";
import Hotels from "@/pages/Hotels";
import Cart from "@/pages/Cart";
import AIChat from "@/pages/AIChat";
import RoutePlanner from "@/components/RoutePlanner";
import Attractions from "@/pages/Attractions";
import Favourites from "@/pages/Favourites";
import LiveTracking from "@/pages/LiveTracking";
import AddAttraction from "@/pages/AddAttraction";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AttractionVerifier from "@/portals/admin/AttractionVerifier";
import UserManagement from "@/portals/admin/UserManagement";
import GuideDashboard from "@/portals/guide/Dashboard";
import WriteGuide from "@/portals/guide/WriteGuide";
import GuideQueryInbox from "@/portals/guide/QueryInbox";
import SupportDashboard from "@/portals/support/Dashboard";
import SupportQueryInbox from "@/portals/support/QueryInbox";
import ReportManagement from "@/portals/support/ReportManagement";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

const queryClient = new QueryClient();

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (currentUser) {
    return <Navigate to="/hero" replace />;
  }
  return <>{children}</>;
};

const RootRedirect = () => {
  const { currentUser, loading, userRole } = useAuth();
  if (loading) return null;
  if (currentUser) {
    const roleRoutes: Record<string, string> = {
      user: "/hero",
      admin: "/hero", // Admins land on /hero user homepage by default from root
      guide: "/guide/dashboard",
      support: "/support/dashboard",
    };
    return <Navigate to={userRole ? roleRoutes[userRole] ?? "/hero" : "/hero"} replace />;
  }
  return <Navigate to="/login" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {children}
    </div>
  );
};

const PortalSafe = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return <ErrorBoundary fallbackTitle={title}>{children}</ErrorBoundary>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/login"
        element={
          <AuthGate>
            <Login />
          </AuthGate>
        }
      />
      <Route path="/hero" element={<Index />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "guide", "support"]}>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trip/new"
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <AppLayout>
              <ElitePlanner />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/elite-dashboard"
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <AppLayout>
              <EliteDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trips-planned"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "guide", "support"]}>
            <AppLayout>
              <TripsPlanned />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute allowedRoles={["user", "admin"]}>
            <AppLayout>
              <RoutePlanner />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attractions"
        element={
          <ProtectedRoute allowedRoles={["user", "guide", "admin"]}>
            <AppLayout>
              <Attractions />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attractions/add"
        element={
          <ProtectedRoute allowedRoles={["guide", "admin", "user"]}>
            <AppLayout>
              <AddAttraction />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/favourites"
        element={
          <ProtectedRoute allowedRoles={["user", "guide", "admin", "support"]}>
            <AppLayout>
              <Favourites />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hotels"
        element={
          <ProtectedRoute allowedRoles={["user", "guide", "admin", "support"]}>
            <AppLayout>
              <Hotels />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={["user", "guide", "admin", "support"]}>
            <AppLayout>
              <Cart />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chatAI"
        element={
          <ProtectedRoute allowedRoles={["user", "guide", "admin", "support"]}>
            <AppLayout>
              <AIChat />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/live"
        element={
          <ProtectedRoute allowedRoles={["user", "guide", "admin"]}>
            <AppLayout>
              <LiveTracking />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/tracking" element={<Navigate to="/live" replace />} />

      <Route 
        path="/admin" 
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } 
      />

      <Route
        path="/admin/login"
        element={
          <AdminLogin />
        }
      />

      <Route
        path="/admin/dashboard"
        element={<Navigate to="/admin" replace />}
      />
      <Route
        path="/admin/verify"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout>
              <PortalSafe title="Verification portal is temporarily unavailable">
                <AttractionVerifier />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout>
              <PortalSafe title="User management portal is temporarily unavailable">
                <UserManagement />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/guide/dashboard"
        element={
          <ProtectedRoute allowedRoles={["guide"]}>
            <AppLayout>
              <PortalSafe title="Guide portal is temporarily unavailable">
                <GuideDashboard />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide/add"
        element={
          <ProtectedRoute allowedRoles={["guide"]}>
            <AppLayout>
              <AddAttraction />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide/write"
        element={
          <ProtectedRoute allowedRoles={["guide"]}>
            <AppLayout>
              <PortalSafe title="Guide authoring portal is temporarily unavailable">
                <WriteGuide />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guide/queries"
        element={
          <ProtectedRoute allowedRoles={["guide"]}>
            <AppLayout>
              <PortalSafe title="Guide inbox is temporarily unavailable">
                <GuideQueryInbox />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/support/dashboard"
        element={
          <ProtectedRoute allowedRoles={["support"]}>
            <AppLayout>
              <PortalSafe title="Support portal is temporarily unavailable">
                <SupportDashboard />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support/queries"
        element={
          <ProtectedRoute allowedRoles={["support"]}>
            <AppLayout>
              <PortalSafe title="Support inbox is temporarily unavailable">
                <SupportQueryInbox />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support/reports"
        element={
          <ProtectedRoute allowedRoles={["support"]}>
            <AppLayout>
              <PortalSafe title="Report management is temporarily unavailable">
                <ReportManagement />
              </PortalSafe>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TripProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </BrowserRouter>
        </TripProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
