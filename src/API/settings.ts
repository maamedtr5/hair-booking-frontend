import apiClient from '../utils/apiClient';
import type { Settings, ApiResponse } from '../types/models';

export const settingsApi = {
  getAll: async (): Promise<Settings[]> => {
    const { data } = await apiClient.get<ApiResponse<Settings[]>>('/settings');
    return data.data ?? [];
  },
  getByKey: async (key: string): Promise<Settings> => {
    const { data } = await apiClient.get<ApiResponse<Settings>>(`/settings/key/${key}`);
    return data.data!;
  },
  create: async (payload: { key: string; value: string }): Promise<Settings> => {
    const { data } = await apiClient.post<ApiResponse<Settings>>('/settings', payload);
    return data.data!;
  },
  update: async (id: number, payload: { value: string }): Promise<Settings> => {
    const { data } = await apiClient.put<ApiResponse<Settings>>(`/settings/${id}`, payload);
    return data.data!;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/settings/${id}`);
  },
};