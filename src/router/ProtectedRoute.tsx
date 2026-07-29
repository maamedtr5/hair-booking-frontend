import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/models';

interface ProtectedRouteProps {
  /** Roles allowed to access this route. If empty, any authenticated user is allowed. */
  roles?: Role[];
}

export function ProtectedRoute({ roles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  // Not logged in → redirect to login, preserving the intended destination
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their correct portal
  if (roles.length > 0 && !roles.includes(user.role)) {
    const fallback =
      user.role === 'ADMIN'
        ? '/dashboard'
        : user.role === 'STAFF'
          ? '/staff/dashboard'
          : '/my/bookings';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

// The public booking flow (/book, /booking/confirmation/:id) is meant for
// guests and clients only. Admin and staff are authenticated into their
// own portals and have no reason to land on the guest-facing booking
// pages — previously nothing stopped them from navigating there (or being
// linked there) and seeing a fully interactive "book now" flow meant for
// customers. This sends them back to their own dashboard instead; anyone
// not logged in, or logged in as a CLIENT, passes through unaffected.
export function RedirectStaffAndAdminFromBooking() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated && user?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  if (isAuthenticated && user?.role === 'STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Outlet />;
}
// The public booking flow (/book, /booking/confirmation/:id) is meant for
// guests and clients only. Admin and staff are authenticated into their
// own portals and have no reason to land on the guest-facing booking
// pages — previously nothing stopped them from navigating there (or being
// linked there) and seeing a fully interactive "book now" flow meant for
// customers. This sends them back to their own dashboard instead; anyone
// not logged in, or logged in as a CLIENT, passes through unaffected.
export function RedirectStaffAndAdminFromBooking() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated && user?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  if (isAuthenticated && user?.role === 'STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Outlet />;
}