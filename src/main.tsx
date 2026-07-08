// src/main.tsx
import React, { Suspense, lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./store/queryClient";
import { AuthProvider } from "./store/AuthContext";
import { useAuthContext } from "./hooks/useAuthcontext";
import { ProtectedRoute } from "./router/ProtectedRoute";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { AppToastContainer } from "./components/ui/AppToastContainer";
import { Spinner } from "./components/ui/Spinner";
import "./index.css";

// Layouts — kept eager. These are small and every portal needs its own
// layout immediately on route entry; lazy-loading them would just add a
// spinner flash with no real bundle-size win.
import { AdminLayout } from "./components/layout/AdminLayout";
import ClientLayout from "./components/layout/ClientLayout";
import { StaffLayout } from "./components/layout/StaffLayout";


import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { LandingPage } from "./pages/LandingPage";

import UnauthorizedPage from "./pages/Unauthorizedpage";


const BookingPage = lazy(() =>
  import("./pages/client/BookingPage").then((m) => ({ default: m.BookingPage }))
);
const ConfirmationPage = lazy(() =>
  import("./pages/client/ConfirmationPage").then((m) => ({ default: m.ConfirmationPage }))
);
const MyBookings = lazy(() =>
  import("./pages/client/MyBookings").then((m) => ({ default: m.MyBookings }))
);


const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Calendar = lazy(() =>
  import("./pages/admin/Calendar").then((m) => ({ default: m.Calendar }))
);
const StaffPage = lazy(() =>
  import("./pages/admin/Staff").then((m) => ({ default: m.StaffPage }))
);
const Reports = lazy(() =>
  import("./pages/admin/Reports").then((m) => ({ default: m.Reports }))
);
const Settings = lazy(() =>
  import("./pages/admin/Settings").then((m) => ({ default: m.Settings }))
);

// ── Staff portal pages — lazy ───────────────────────────────────────────
const StaffSchedule = lazy(() =>
  import("./pages/staff/StaffSchedule").then((m) => ({ default: m.StaffSchedule }))
);
const ClientNotes = lazy(() =>
  import("./pages/staff/ClientNotes").then((m) => ({ default: m.ClientNotes }))
);

// Shared fallback for every lazy route — reuses the same Spinner already
// used elsewhere (e.g. LandingPage's services grid) instead of introducing
// a second loading pattern.
function RouteFallback() {
  return (
    <div className="spinner-overlay">
      <Spinner size="lg" />
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export function Root() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  useEffect(() => {
    function handleUnauthorized() {
      logout();
      navigate("/login", { replace: true });
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate, logout]);

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      // Public routes
      { path: "/login",    element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/",          element: <LandingPage /> },

      // Client portal — CLIENT role required.
      {
        element: <ProtectedRoute roles={["CLIENT"]} />,
        children: [
          {
            element: <ClientLayout />,
            children: [
              { path: "/book",                           element: withSuspense(<BookingPage />) },
              { path: "/my/bookings",                     element: withSuspense(<MyBookings />) },
              { path: "/booking/confirmation/:bookingId", element: withSuspense(<ConfirmationPage />) },
            ],
          },
        ],
      },

      // Admin portal — ADMIN role required
      {
        element: <ProtectedRoute roles={["ADMIN"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "/dashboard",           element: withSuspense(<Dashboard />) },
              { path: "/dashboard/calendar",  element: withSuspense(<Calendar />) },
              { path: "/dashboard/staff",     element: withSuspense(<StaffPage />) },
              { path: "/dashboard/reports",   element: withSuspense(<Reports />) },
              { path: "/dashboard/settings",  element: withSuspense(<Settings />) },
            ],
          },
        ],
      },

      // Staff portal — STAFF role required
      {
        element: <ProtectedRoute roles={["STAFF"]} />,
        children: [
          {
            element: <StaffLayout />,
            children: [
              { path: "/staff/schedule",                element: withSuspense(<StaffSchedule />) },
              { path: "/staff/clients/:clientId/notes", element: withSuspense(<ClientNotes />) },
            ],
          },
        ],
      },

      { path: "/unauthorized", element: <UnauthorizedPage /> },

      // 404 fallback
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AppToastContainer />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);