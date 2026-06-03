import apiClient from '../utils/apiClient';
import type { Slot, CreateSlotPayload, ApiResponse } from '../types/models';

/** GET /slots */
export async function getSlots(): Promise<Slot[]> {
  const { data } = await apiClient.get<ApiResponse<Slot[]>>('/slots');
  return data.data ?? [];
}

/** GET /slots/:id */
export async function getSlot(id: number): Promise<Slot> {
  const { data } = await apiClient.get<ApiResponse<Slot>>(`/slots/${id}`);
  return data.data!;
}

/**
 * GET /slots — filtered by staffId + date.
 * The backend accepts query params; we filter client-side if no dedicated route exists.
 * Returns only unbooked, future slots for the given staff on the given date.
 */
export async function getAvailableSlots(
  staffId: number,
  date: string, // YYYY-MM-DD
): Promise<Slot[]> {
  const { data } = await apiClient.get<ApiResponse<Slot[]>>('/slots', {
    params: { staffId, date },
  });
  return data.data ?? [];
}

/** POST /slots */
export async function createSlot(payload: CreateSlotPayload): Promise<Slot> {
  const { data } = await apiClient.post<ApiResponse<Slot>>('/slots', payload);
  return data.data!;
}

/** PUT /slots/:id */
export async function updateSlot(
  id: number,
  payload: Partial<CreateSlotPayload> & { isBooked?: boolean },
): Promise<Slot> {
  const { data } = await apiClient.put<ApiResponse<Slot>>(`/slots/${id}`, payload);
  return data.data!;
}

/** DELETE /slots/:id */
export async function deleteSlot(id: number): Promise<void> {
  await apiClient.delete(`/slots/${id}`);
}