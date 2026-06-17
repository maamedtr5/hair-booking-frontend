// api/Settingss.ts
import apiClient from '../utils/apiClient';
import type { Settings } from '../types';

export const SettingssApi = {
  getAll: async (): Promise<Settings[]> => {
    const { data } = await apiClient.get('/Settingss');
    return data.data ?? data;
  },
  getByKey: async (key: string): Promise<Settings> => {
    const { data } = await apiClient.get(`/Settingss/key/${key}`);
    return data.data ?? data;
  },
  create: async (payload: { key: string; value: string }): Promise<Settings> => {
    const { data } = await apiClient.post('/Settingss', payload);
    return data.data ?? data;
  },
  update: async (id: number, payload: { value: string }): Promise<Settings> => {
    const { data } = await apiClient.put(`/Settingss/${id}`, payload);
    return data.data ?? data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Settingss/${id}`);
  },
};