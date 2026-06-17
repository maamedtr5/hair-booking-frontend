// api/users.ts
import apiClient from '../utils/apiClient';
import type { User } from '../types';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data.data ?? data;
  },
  getById: async (id: number): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data ?? data;
  },
  update: async (id: number, payload: Partial<{ name: string; phone: string; currentPassword: string; newPassword: string }>): Promise<User> => {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return data.data ?? data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};