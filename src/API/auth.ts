import apiClient from '../utils/apiClient';
import type { LoginPayload, RegisterPayload, User } from '../types/models';

export interface AuthResponse {
  success: boolean;
  token: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  message?: string;
}

/** POST /auth/login — returns JWT + user data */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

/** POST /auth/register — returns user data (no token on register) */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}