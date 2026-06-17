// context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types';



interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}



const AuthContext = createContext<AuthContextValue | null>(null);



function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (!raw || !token) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setUser(loadStoredUser());
    setIsInitializing(false);
  }, []);

  const persist = useCallback((authUser: AuthUser) => {
    localStorage.setItem('auth_token', authUser.token);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsLoading(true);
      try {
        const response = await apiLogin(payload);
        if (!response.user) throw new Error('Login response missing user data');
        persist({ ...response.user, token: response.token });
      } finally {
        setIsLoading(false);
      }
    },
    [persist]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      try {
        const response = await apiRegister(payload);
        if (!response.user)
          throw new Error('Register response missing user data');
        persist({ ...response.user, token: response.token });
      } finally {
        setIsLoading(false);
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}



export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
