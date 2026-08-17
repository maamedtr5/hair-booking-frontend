// src/utils/authStorage.ts
import type { AuthUser } from '../types/models';

const USER_KEY = 'auth_user';

// The session JWT lives in an httpOnly cookie now — it's never readable
// by JS, on purpose, so there's nothing to decode or expiry-check
// client-side anymore. What's cached here is display data only (name,
// email, role — nothing that grants access on its own) purely so the UI
// can paint instantly on reload instead of showing a loading spinner
// every time. It is NOT proof of a valid session; AuthContext always
// re-verifies with the server (`GET /users/me`) on mount and corrects or
// clears this if the cookie is missing, expired, or revoked.
export function loadCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function cacheUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCachedUser(): void {
  localStorage.removeItem(USER_KEY);
}