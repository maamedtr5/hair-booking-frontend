// src/utils/authStorage.ts
import type { AuthUser } from '../types';

export function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (!raw || !token) return null;

    const parsed = JSON.parse(raw) as AuthUser;
    return { ...parsed, token };
  } catch {
    return null;
  }
}
