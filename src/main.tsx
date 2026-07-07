// src/main.tsx
import React, { useEffect } from "react";
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
import "./index.css";

// Layouts
import { AdminLayout } from "./components/layout/AdminLayout";
import ClientLayout from "./components/layout/ClientLayout";
import { StaffLayout } from "./components/layout/StaffLayout";

// Auth pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// Client pages
import { BookingPage } from "./pages/client/BookingPage";
import { ConfirmationPage } from "./pages/client/ConfirmationPage";
import { MyBookings } from "./pages/client/MyBookings";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import { Calendar } from "./pages/admin/Calendar";
import { StaffPage } from "./pages/admin/Staff";
import { Reports } from "./pages/admin/Reports";
import { Settings } from "./pages/admin/Settings";

// Staff pages
import { StaffSchedule } from "./pages/staff/StaffSchedule";
import { ClientNotes } from "./pages/staff/ClientNotes";


import UnauthorizedPage from "./pages/Unauthorizedpage";
import { LandingPage } from "./pages/LandingPage";


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

 
      {
        element: <ProtectedRoute roles={["CLIENT"]} />,
        children: [
          {
            element: <ClientLayout />,
            children: [
              { path: "/book",                              element: <BookingPage /> },
              { path: "/my/bookings",                        element: <MyBookings /> },
              { path: "/booking/confirmation/:bookingId",    element: <ConfirmationPage /> },
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
              { path: "/dashboard",           element: <Dashboard /> },
              { path: "/dashboard/calendar",  element: <Calendar /> },
              { path: "/dashboard/staff",     element: <StaffPage /> },
              { path: "/dashboard/reports",   element: <Reports /> },
              { path: "/dashboard/settings",  element: <Settings /> },
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
              { path: "/staff/schedule",              element: <StaffSchedule /> },
              { path: "/staff/clients/:clientId/notes", element: <ClientNotes /> },
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