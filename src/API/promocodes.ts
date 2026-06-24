import apiClient from '../utils/apiClient';
import type { Promocode, ApiResponse } from '../types/models';

export const promoCodesApi = {
  getAll: async (): Promise<Promocode[]> => {
    const { data } = await apiClient.get<ApiResponse<Promocode[]>>('/promocodes');
    return data.data ?? [];
  },
  getByCode: async (code: string): Promise<Promocode> => {
    const { data } = await apiClient.get<ApiResponse<Promocode>>(`/promocodes/code/${code}`);
    return data.data!;
  },
  create: async (payload: {
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
    validFrom: string;
    validUntil: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Promocode> => {
    const { data } = await apiClient.post<ApiResponse<Promocode>>('/promocodes', payload);
    return data.data!;
  },
  update: async (id: number, payload: Partial<Promocode>): Promise<Promocode> => {
    const { data } = await apiClient.put<ApiResponse<Promocode>>(`/promocodes/${id}`, payload);
    return data.data!;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/promocodes/${id}`);
  },
};