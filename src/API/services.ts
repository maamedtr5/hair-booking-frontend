import apiClient from '../utils/apiClient';
import type { Service, ApiResponse } from '../types/models';
import type { ServiceFormValues } from '../utils/validators';

/** GET /services */
export async function getServices(): Promise<Service[]> {
  const { data } = await apiClient.get<ApiResponse<Service[]>>('/services');
  return data.data ?? [];
}

/** GET /services/:id */
export async function getService(id: number): Promise<Service> {
  const { data } = await apiClient.get<ApiResponse<Service>>(`/services/${id}`);
  return data.data!;
}

/** POST /services */
export async function createService(payload: ServiceFormValues): Promise<Service> {
  const { data } = await apiClient.post<ApiResponse<Service>>('/services', payload);
  return data.data!;
}

/** PUT /services/:id */
export async function updateService(
  id: number,
  payload: Partial<ServiceFormValues>,
): Promise<Service> {
  const { data } = await apiClient.put<ApiResponse<Service>>(`/services/${id}`, payload);
  return data.data!;
}

/** DELETE /services/:id */
export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}