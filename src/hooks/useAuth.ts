// src/hooks/useAuthContext.ts
import { useContext } from 'react';
import { AuthContext } from '../store/AuthContext';
import type { AuthContextValue } from '../store/AuthContext';


export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>');
  }
  return ctx;
}


export { useAuthContext as useAuth };