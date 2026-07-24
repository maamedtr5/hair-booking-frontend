// src/api/users.ts
import apiClient from '../utils/apiClient';
import type { User, AuthUser } from '../types';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data.data ?? data;
  },

  /**
   * Admin-only: creates a brand-new User account with a given role.
   * Used by the "Add staff member" flow — a Staff record can only ever
   * reference an *existing* user, so adding someone who isn't already a
   * user requires creating the account first.
   */
  createWithRole: async (payload: {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'STAFF' | 'CLIENT';
  }): Promise<User> => {
    const { data } = await apiClient.post('/users', payload);
    return data.data ?? data;
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data ?? data;
  },

  update: async (
    id: number,
    payload: Partial<{
      name: string;
      currentPassword: string;
      newPassword: string;
    }>
  ): Promise<User> => {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return data.data ?? data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

/**
 * Fetch the currently authenticated user profile.
 * Returns an AuthUser (User + token).
 */
export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<User>('/users/me');

  // Attach token from localStorage so AuthContext can persist it
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('No auth token found in storage');

  return { ...data, token };
}
