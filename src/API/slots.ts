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
 * GET /slots/available — dynamically computed from business hours minus
 * existing appointments (there's no table of pre-made "open" slots to
 * query). staffId of null means "no preference" — the endpoint then
 * returns a time as available if *any* staff member is free then.
 */
export async function getAvailableSlots(
  staffId: number | null,
  date: string, // YYYY-MM-DD
): Promise<Slot[]> {
  const params: Record<string, string> = { date };
  if (staffId) params.staffId = String(staffId);
  const { data } = await apiClient.get<ApiResponse<Slot[]>>('/slots/available', { params });
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