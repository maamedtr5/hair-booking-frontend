import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/AuthContext';
import { queryClient } from './store/queryClient';
import { router } from './router';
import { ToastContainer } from './components/ui/Toast';
import './App.css';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        {/* Global toast notifications — rendered outside router so they survive navigation */}
        <ToastContainer />
      </AuthProvider>
    </QueryClientProvider>
  );
}