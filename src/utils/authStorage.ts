// src/utils/authStorage.ts
import type { AuthUser, JwtPayload } from '../types/models';

const USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

// Decodes the JWT payload only — this does NOT verify the signature (that
// requires the server's secret, which the client never has and never
// should). This is purely a client-side UX/defense-in-depth check to avoid
// trusting an obviously-expired token for the split second before the
// backend's real verification rejects it on the next request. The backend
// remains the actual security boundary.
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  // No readable/valid exp claim → fail closed, treat as expired rather
  // than trusting a token we can't actually parse.
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!raw || !token) return null;

    if (isTokenExpired(token)) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    const parsed = JSON.parse(raw) as AuthUser;
    return { ...parsed, token };
  } catch {
    return null;
  }
}