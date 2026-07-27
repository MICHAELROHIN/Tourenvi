import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/firebase";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();
  const provisionalRole = userRole ?? (allowedRoles?.includes("user") ? "user" : null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Loading your trip workspace</h2>
            <p className="text-sm text-muted-foreground">
              Checking your session and preparing the trip planner.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-36 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!provisionalRole) {
      return (
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      );
    }

    if (!allowedRoles.includes(provisionalRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
