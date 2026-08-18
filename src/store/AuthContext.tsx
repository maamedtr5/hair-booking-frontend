// src/store/AuthContext.tsx
import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  verifyOtp as apiVerifyOtp,
  resendOtp as apiResendOtp,
  isOtpRequired,
  logoutRequest,
  logoutAllRequest,
} from "../api/auth";
import * as usersApi from "../api/users";
import { loadCachedUser, cacheUser, clearCachedUser } from "../utils/authStorage";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types/models";
import { OtpRequiredError } from "../store/errors";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  verifyOtp: (otpToken: string, code: string) => Promise<AuthUser>;
  resendOtp: (otpToken: string) => Promise<string>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  logoutAllDevices: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // The cached user is optimistic display data only — paints the UI
  // instantly instead of a spinner flash on every reload, but it is NOT
  // proof of a valid session (see authStorage.ts). isInitializing stays
  // true until the mount-time getMe() call below confirms or corrects it.
  const [user, setUser] = useState<AuthUser | null>(() => loadCachedUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Mirrors `user` for use inside `logout`, which needs to stay a stable
  // callback (it's registered as a window event listener) but also needs
  // to know, at call time, whether there's actually a session worth
  // revoking. Reading `user` directly would mean either putting it in
  // logout's deps (re-subscribing the listener on every login/logout) or
  // capturing a stale closure.
  const userRef = useRef<AuthUser | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const logout = useCallback(() => {
    // Only hit the server if we actually think there's a session to
    // revoke. Calling logoutRequest() unconditionally — including when
    // we're already logged out — was harmless on its own, but combined
    // with the auth:unauthorized listener below it created a loop: no
    // session -> /auth/logout 401s -> event fires again -> logout() runs
    // again -> another /auth/logout call -> ad infinitum.
    if (userRef.current) {
      logoutRequest();
    }
    clearCachedUser();
    setUser(null);
  }, []);
  const logoutAllDevices = useCallback(async () => {
    await logoutAllRequest();
    clearCachedUser();
    setUser(null);
  }, []);

  useEffect(() => {
    // Listen for logout events from apiClient
    window.addEventListener("auth:unauthorized", logout);
    return () => window.removeEventListener("auth:unauthorized", logout);
  }, [logout]);

  useEffect(() => {
    // The session cookie is httpOnly — invisible to this code — so the
    // only way to know whether it's actually still valid (not expired,
    // not revoked via logout-all elsewhere) is to ask the server. This
    // runs once per app load and is the real source of truth; the
    // optimistic cached user above is just what's shown while this is
    // in flight.
    let cancelled = false;
    usersApi
      .getMe()
      .then((freshUser) => {
        if (cancelled) return;
        cacheUser(freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        if (cancelled) return;
        clearCachedUser();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((authUser: AuthUser) => {
    cacheUser(authUser);
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const response = await apiLogin(payload);
        if (isOtpRequired(response)) {
          // Not a failure — deliberately thrown so LoginPage's existing
          // try/catch is enough to route to the OTP step without every
          // other login() caller needing to learn a new return shape.
          throw new OtpRequiredError(response.otpToken, response.message);
        }
        // The session cookie is already set by the server at this point
        // (login's response Set-Cookie header) — this call just fetches
        // the full profile to show in the UI, it isn't what establishes
        // the session.
        const authUser = response.user
          ? { ...response.user, ...(await usersApi.getMe()) }
          : await usersApi.getMe();
        persist(authUser);
        return authUser;
      } finally {
        setIsLoading(false);
      }
    },
    [persist]
  );

  const verifyOtp = useCallback(
    async (otpToken: string, code: string): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const response = await apiVerifyOtp(otpToken, code);
        const authUser = response.user
          ? { ...response.user, ...(await usersApi.getMe()) }
          : await usersApi.getMe();
        persist(authUser);
        return authUser;
      } finally {
        setIsLoading(false);
      }
    },
    [persist]
  );

  const resendOtp = useCallback(async (otpToken: string): Promise<string> => {
    const response = await apiResendOtp(otpToken);
    return response.otpToken;
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const response = await apiRegister(payload);
        const authUser = response.user
          ? { ...response.user, ...(await usersApi.getMe()) }
          : await usersApi.getMe();
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
        verifyOtp,
        resendOtp,
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