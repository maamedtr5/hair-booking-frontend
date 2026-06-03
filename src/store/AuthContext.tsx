import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import type { JwtPayload, Role } from '../types/models';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: JwtPayload | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helper — safely decode token ────────────────────────────────────────────

function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    // Check token hasn't expired (exp is in seconds)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('auth_token'),
  );
  const [user, setUser] = useState<JwtPayload | null>(() => {
    const stored = localStorage.getItem('auth_token');
    return stored ? decodeToken(stored) : null;
  });

  // If stored token is expired on mount, clear it
  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored && !decodeToken(stored)) {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback((newToken: string) => {
    const decoded = decodeToken(newToken);
    if (!decoded) {
      console.error('Received invalid or expired token');
      return;
    }
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(decoded);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    // Redirect to login — replace so the user can't go back
    window.location.replace('/login');
  }, []);

  const hasRole = useCallback(
    (role: Role) => user?.role === role,
    [user],
  );

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF',
    isClient: user?.role === 'CLIENT',
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export { AuthContext };