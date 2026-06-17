// api/Promocodes.ts
import apiClient from '../utils/apiClient';
import type { Promocode } from '../types/models';

export const PromocodesApi = {
  getAll: async (): Promise<Promocode[]> => {
    const { data } = await apiClient.get('/Promocodes');
    return data.data ?? data;
  },
  getByCode: async (code: string): Promise<Promocode> => {
    const { data } = await apiClient.get(`/Promocodes/code/${code}`);
    return data.data ?? data;
  },
  create: async (payload: { code: string; discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number; maxUses?: number; expiryDate?: string }): Promise<Promocode> => {
    const { data } = await apiClient.post('/Promocodes', payload);
    return data.data ?? data;
  },
  update: async (id: number, payload: Partial<Promocode>): Promise<Promocode> => {
    const { data } = await apiClient.put(`/Promocodes/${id}`, payload);
    return data.data ?? data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Promocodes/${id}`);
  },
};