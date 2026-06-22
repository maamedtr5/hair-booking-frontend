import {
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import * as usersApi from '../api/users';
import { loadStoredUser } from '../utils/authStorage';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ✅ initialize directly instead of setState in useEffect
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing] = useState(false);

  const persist = useCallback((authUser: AuthUser) => {
    localStorage.setItem('auth_token', authUser.token);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const response = await apiLogin(payload);

        if (response.user) {
          const authUser = { ...response.user, token: response.token };
          persist(authUser);
          return authUser;
        } else {
          // ✅ fallback: fetch user profile
          const fetchedUser = await usersApi.getMe();
          const authUser = { ...fetchedUser, token: response.token };
          persist(authUser);
          return authUser;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [persist]
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const response = await apiRegister(payload);

        if (response.user) {
          const authUser = { ...response.user, token: response.token };
          persist(authUser);
          return authUser;
        } else {
          const fetchedUser = await usersApi.getMe();
          const authUser = { ...fetchedUser, token: response.token };
          persist(authUser);
          return authUser;
        }
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

export type { AuthContextValue };
export { AuthContext };
