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

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
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