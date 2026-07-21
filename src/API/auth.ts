import apiClient from '../utils/apiClient';
import type { LoginPayload, RegisterPayload, User } from '../types/models';

export interface AuthResponse {
  success: boolean;
  token: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  message?: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/register', payload);
  return data.data;
}

/** Best-effort — revokes the session server-side. Never blocks the UI logout. */
export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout').catch(() => {});
}

/** Revokes every session for this user ("log out everywhere"). */
export async function logoutAllRequest(): Promise<void> {
  await apiClient.post('/auth/logout-all');
}