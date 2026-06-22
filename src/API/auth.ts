import apiClient from '../utils/apiClient';
import type { LoginPayload, RegisterPayload, User } from '../types/models';

interface AuthResponse {
  token: string;
  user?: User | null;
  message?: string;
}

/** POST /users/login */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post('/users/login', payload);

  // Normalize response shape
  if (data.token && data.user) {
    return { token: data.token, user: data.user };
  }
  if (data.data?.token && data.data?.user) {
    return { token: data.data.token, user: data.data.user };
  }
  if (data.token) {
    return { token: data.token, user: null }; // fallback if no user returned
  }
  throw new Error('Unexpected login response');
}

/** POST /users/register */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post('/users/register', payload);

  // Normalize response shape
  if (data.token && data.user) {
    return { token: data.token, user: data.user };
  }
  if (data.data?.token && data.data?.user) {
    return { token: data.data.token, user: data.data.user };
  }
  if (data.token) {
    return { token: data.token, user: null }; // fallback if no user returned
  }
  throw new Error('Unexpected register response');
}
