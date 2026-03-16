import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/firebase";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole) {
      return (
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      );
    }

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
