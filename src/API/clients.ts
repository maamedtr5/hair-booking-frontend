import apiClient from '../utils/apiClient';
import type { Client, ApiResponse } from '../types/models';

export interface UpdateClientPayload {
  phone?: string;
  address?: string;
}

/** GET /clients */
export async function getClients(): Promise<Client[]> {
  const { data } = await apiClient.get<ApiResponse<Client[]>>('/clients');
  return data.data ?? [];
}

/** GET /clients/:id */
export async function getClient(id: number): Promise<Client> {
  const { data } = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
  return data.data!;
}

/** PUT /clients/:id */
export async function updateClient(
  id: number,
  payload: UpdateClientPayload,
): Promise<Client> {
  const { data } = await apiClient.put<ApiResponse<Client>>(`/clients/${id}`, payload);
  return data.data!;
}

/** DELETE /clients/:id */
export async function deleteClient(id: number): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}