// src/store/AuthContext.tsx
import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { login as apiLogin, register as apiRegister , logoutRequest, logoutAllRequest} from "../api/auth";
import * as usersApi from "../api/users";
import { loadStoredUser } from "../utils/authStorage";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types/models";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  logoutAllDevices: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing] = useState(false);
  const logout = useCallback(() => {
    logoutRequest();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  }, []);
  const logoutAllDevices = useCallback(async () => {
  await logoutAllRequest();
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  setUser(null);
}, []);

  useEffect(() => {
    // Listen for logout events from apiClient
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);

  const persist = useCallback((authUser: AuthUser) => {
    localStorage.setItem("auth_token", authUser.token);
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const response = await apiLogin(payload);
        const authUser = response.user
          ? { ...response.user, token: response.token }
          : { ...(await usersApi.getMe()), token: response.token };
        persist(authUser);
        return authUser;
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
        const authUser = response.user
          ? { ...response.user, token: response.token }
          : { ...(await usersApi.getMe()), token: response.token };
        persist(authUser);
        return authUser;
      } finally {
        setIsLoading(false);
      }
    },
    [persist]
  );

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
        logoutAllDevices
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export type { AuthContextValue };
export { AuthContext };