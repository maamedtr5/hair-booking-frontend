import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './router/ProtectedRoute';
import './index.css';
import { AuthProvider } from './store/AuthContext'; 
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './store/queryClient'; // make sure this file exports a QueryClient

// Layouts
import { AdminLayout } from './components/layout/AdminLayout';
import { ClientLayout } from './components/layout/ClientLayout';
import { StaffLayout } from './components/layout/StaffLayout';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Client pages
import { BookingPage } from './pages/client/BookingPage';
import { ConfirmationPage } from './pages/client/ConfirmationPage';
import { MyBookings } from './pages/client/MyBookings';

// Admin pages
import { Dashboard } from './pages/admin/Dashboard';
import { Calendar } from './pages/admin/Calendar';
import { StaffPage } from './pages/admin/Staff';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';

// Staff pages
import { StaffSchedule } from './pages/staff/StaffSchedule';
import { ClientNotes } from './pages/staff/ClientNotes';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/book',
    element: (
      <ClientLayout>
        <BookingPage />
      </ClientLayout>
    ),
  },

  // Client portal
  {
    element: <ProtectedRoute roles={['CLIENT']} />,
    children: [
      {
        element: <ClientLayout />,
        children: [
          { path: '/my/bookings', element: <MyBookings /> },
          { path: '/booking/confirmation', element: <ConfirmationPage /> },
        ],
      },
    ],
  },

  // Admin portal
  {
    element: <ProtectedRoute roles={['ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/dashboard/calendar', element: <Calendar /> },
          { path: '/dashboard/staff', element: <StaffPage /> },
          { path: '/dashboard/reports', element: <Reports /> },
          { path: '/dashboard/settings', element: <Settings /> },
        ],
      },
    ],
  },

  // Staff portal
  {
    element: <ProtectedRoute roles={['STAFF']} />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          { path: '/staff/schedule', element: <StaffSchedule /> },
          { path: '/staff/clients/:clientId/notes', element: <ClientNotes /> },
        ],
      },
    ],
  },

  // Root redirect
  { path: '/', element: <Navigate to="/book" replace /> },

  // 404 fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);
