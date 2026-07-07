// src/utils/apiClient.ts
import axios, { AxiosError, type AxiosResponse } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ───────────────────────────────────────────────
// On 401, clear stale auth state and notify the app via a custom event
// rather than doing a hard window.location redirect. A hard redirect wipes
// the React Query cache and any in-progress booking flow state (Zustand
// store survives, but the page remount loses query cache and scroll
// position). App.tsx listens for 'auth:unauthorized' and uses React
// Router's navigate() to redirect softly instead.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

// ─── Error Helper ──────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    // Backend now returns { success: false, message: "..." } consistently —
    // read .message first, fall back to .error for any stale endpoints.
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export default apiClient;