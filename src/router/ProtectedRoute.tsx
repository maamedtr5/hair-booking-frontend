// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types/models";
import { Spinner } from "../components/ui/Spinner";


interface ProtectedRouteProps {
  roles?: Role[];
}

export function ProtectedRoute({ roles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  // While auth state is hydrating → show spinner
  if (isInitializing) {
    return <Spinner />;
  }

  // Not logged in → redirect to login, preserving intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to unauthorized page
  const userRole = (user as Partial<{ role: Role }>)?.role;

  if (roles.length > 0 && userRole && !roles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
