import apiClient from '../utils/apiClient';
import type { LoginPayload, RegisterPayload, User } from '../types/models';

interface AuthResponse {
  success: boolean;
  token: string;
  user?: User;
  message?: string;
}

/** POST /users/login */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/users/login', payload);
  return data;
}

/** POST /users/register */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/users/register', payload);
  return data;
}