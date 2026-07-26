import apiClient from '../utils/apiClient';
import type { Settings, ApiResponse } from '../types/models';
import type { BusinessHoursConfig, PaymentPolicy } from '../types/models';

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

  // Business hours — admin-configurable open days/hours.
  getBusinessHours: async (): Promise<BusinessHoursConfig> => {
    const { data } = await apiClient.get<ApiResponse<BusinessHoursConfig>>('/settings/business-hours');
    return data.data!;
  },
  updateBusinessHours: async (config: BusinessHoursConfig): Promise<void> => {
    await apiClient.put('/settings/business-hours', config);
  },

  // Payment policy — deposit requirement at booking time. Read is public.
  getPaymentPolicy: async (): Promise<PaymentPolicy> => {
    const { data } = await apiClient.get<ApiResponse<PaymentPolicy>>('/settings/payment-policy');
    return data.data!;
  },
  updatePaymentPolicy: async (policy: PaymentPolicy): Promise<void> => {
    await apiClient.put('/settings/payment-policy', policy);
  },
};
