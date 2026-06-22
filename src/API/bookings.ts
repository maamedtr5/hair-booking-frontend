import apiClient from '../utils/apiClient';
import type { Booking, BookingStatus, CreateBookingPayload, ApiResponse } from '../types/models';

export const bookingsApi = {
  getAll: async (): Promise<Booking[]> => {
    const { data } = await apiClient.get<ApiResponse<Booking[]>>('/bookings');
    return data.data ?? [];
  },
  getById: async (id: number): Promise<Booking> => {
    const { data } = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return data.data!;
  },
  create: async (payload: CreateBookingPayload): Promise<Booking> => {
    const { data } = await apiClient.post<ApiResponse<Booking>>('/bookings', payload);
    return data.data!;
  },
  update: async (id: number, payload: Partial<CreateBookingPayload> & { status?: BookingStatus }): Promise<Booking> => {
    const { data } = await apiClient.put<ApiResponse<Booking>>(`/bookings/${id}`, payload);
    return data.data!;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },
};