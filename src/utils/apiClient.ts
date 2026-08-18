// src/utils/apiClient.ts
import axios, { AxiosError, type AxiosResponse } from "axios";
import { getCsrfToken } from "./csrf";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  // The session JWT now lives in an httpOnly cookie (never readable by
  // JS — that's the whole point), so it's carried automatically by the
  // browser. withCredentials tells axios to actually send/receive
  // cookies on cross-origin requests (the API and frontend are on
  // different origins in dev, and likely in production too).
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const SAFE_METHODS = new Set(["get", "head", "options"]);

// ─── Request Interceptor ────────────────────────────────────────────────
// No more Authorization header — there's no token in JS to attach, by
// design. What every mutating request needs instead is the CSRF header
// (see csrf.ts + the backend's csrfProtection middleware for why this is
// still required even with SameSite=Lax cookies).
apiClient.interceptors.request.use(
  (config) => {
    if (!SAFE_METHODS.has((config.method ?? "get").toLowerCase())) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────────────────────

// Requests where a 401 is an *expected, already-handled* outcome, not a
// "your session just died" signal:
//  - /auth/login, /auth/register, /auth/verify-otp, /auth/resend-otp: a
//    401 here just means bad credentials/code — LoginPage already shows
//    that inline via getErrorMessage(). Broadcasting it as a global
//    "unauthorized" event too would fire logout() on every wrong-password
//    attempt, which itself calls /auth/logout — see next point.
//  - /auth/logout: a 401 here means "you were already logged out",
//    firing the same event again and re-triggering another logout call —
//    an infinite loop. (The backend route is now idempotent too; this is
//    belt-and-suspenders.)
//  - /users/me: the mount-time "am I logged in" probe. A 401 there is a
//    normal answer for a guest, not an expired session — AuthContext
//    already handles that locally, no need to broadcast it.
const SUPPRESS_UNAUTHORIZED_EVENT_PATHS = ["/auth/", "/users/me"];

function shouldSuppressUnauthorizedEvent(url?: string): boolean {
  if (!url) return false;
  return SUPPRESS_UNAUTHORIZED_EVENT_PATHS.some((path) => url.includes(path));
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !shouldSuppressUnauthorizedEvent(error.config?.url)) {
      // No token/user to clear from localStorage anymore — the cookie is
      // cleared server-side on logout/expiry. This just tells the app
      // "you're signed out now" so it can reset UI state.
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

// ─── Error Helper ──────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
 
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

// Machine-readable error code from the backend (e.g. 'SLOT_CONFLICT',
// 'ACCOUNT_EXISTS'), when present. Lets the UI branch on the *kind* of
// error instead of guessing from HTTP status alone — several distinct
// error cases can legitimately share the same status code (409).
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.code === "string") return data.code;
  }
  return undefined;
}

export default apiClient;