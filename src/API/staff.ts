import apiClient from '../utils/apiClient';
import type { Staff, ApiResponse } from '../types/models';

export interface CreateStaffPayload {
  userId: number;
  bio?: string;
}

/** GET /staff */
export async function getStaff(): Promise<Staff[]> {
  const { data } = await apiClient.get<ApiResponse<Staff[]>>('/staff');
  return data.data ?? [];
}

/** GET /staff/:id */
export async function getStaffMember(id: number): Promise<Staff> {
  const { data } = await apiClient.get<ApiResponse<Staff>>(`/staff/${id}`);
  return data.data!;
}

/** POST /staff */
export async function createStaff(payload: CreateStaffPayload): Promise<Staff> {
  const { data } = await apiClient.post<ApiResponse<Staff>>('/staff', payload);
  return data.data!;
}

/** PUT /staff/:id */
export async function updateStaff(
  id: number,
  payload: Partial<CreateStaffPayload>,
): Promise<Staff> {
  const { data } = await apiClient.put<ApiResponse<Staff>>(`/staff/${id}`, payload);
  return data.data!;
}

/** DELETE /staff/:id */
export async function deleteStaff(id: number): Promise<void> {
  await apiClient.delete(`/staff/${id}`);
}