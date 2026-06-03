import axios, { AxiosError, type AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem('auth_token');
      // Use replace so the user can't navigate back to the protected page
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);


export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Backend returns { success: false, message: '...' } or { error: '...' }
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export default apiClient;