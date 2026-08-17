import apiClient from '../utils/apiClient';
import type { LoginPayload, RegisterPayload, User } from '../types/models';

export interface AuthResponse {
  success: boolean;
  // No `token` here — the session lives in an httpOnly cookie the server
  // sets directly on the response, invisible to and untouched by this
  // client code. csrfToken is the one piece of session-adjacent state
  // the frontend does need to read (see utils/csrf.ts for why that's safe).
  csrfToken: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  message?: string;
}

// Returned by /auth/login for ADMIN accounts instead of a real token — a
// second factor (emailed code) is required before a session is issued.
export interface OtpRequiredResponse {
  success: boolean;
  otpRequired: true;
  otpToken: string;
  message?: string;
}

export type LoginResult = AuthResponse | OtpRequiredResponse;

export function isOtpRequired(result: LoginResult): result is OtpRequiredResponse {
  return 'otpRequired' in result && result.otpRequired === true;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await apiClient.post<{ success: boolean; data: LoginResult }>('/auth/login', payload);
  return data.data;
}

export async function verifyOtp(otpToken: string, code: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/verify-otp', {
    otpToken,
    code,
  });
  return data.data;
}

export async function resendOtp(otpToken: string): Promise<{ otpToken: string; message?: string }> {
  const { data } = await apiClient.post<{ success: boolean; data: { otpToken: string; message?: string } }>(
    '/auth/resend-otp',
    { otpToken }
  );
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