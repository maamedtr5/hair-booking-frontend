import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/models';

interface ProtectedRouteProps {
  /** Roles allowed to access this route. If empty, any authenticated user is allowed. */
  roles?: Role[];
}

export function ProtectedRoute({ roles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Not logged in → redirect to login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their correct portal
  const userWithRole = user as unknown as { role: Role };

  if (roles.length > 0 && user && userWithRole.role && !roles.includes(userWithRole.role)) {
    const fallback =
      userWithRole.role === 'ADMIN'
        ? '/dashboard'
        : userWithRole.role === 'STAFF'
          ? '/staff/schedule'
          : '/my/bookings';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />; 
}