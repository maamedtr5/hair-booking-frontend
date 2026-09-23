import apiClient from '../utils/apiClient';
import type { ServiceCategory, ApiResponse } from '../types/models';
import type { ServiceCategoryFormValues } from '../validators/serviceCategoryValidator';

/**
 * GET /service-categories
 * Public: active categories + active services + assigned form template
 * (with ordered fields). Admin (authenticated): pass includeInactive to
 * also see inactive categories/services for management.
 */
export async function getServiceCategories(options?: {
  includeInactive?: boolean;
}): Promise<ServiceCategory[]> {
  const { data } = await apiClient.get<ApiResponse<ServiceCategory[]>>('/service-categories', {
    params: options?.includeInactive ? { activeOnly: 'false' } : undefined,
  });
  return data.data ?? [];
}

/** GET /service-categories/:id */
export async function getServiceCategory(id: number): Promise<ServiceCategory> {
  const { data } = await apiClient.get<ApiResponse<ServiceCategory>>(`/service-categories/${id}`);
  return data.data!;
}

/** POST /service-categories */
export async function createServiceCategory(
  payload: ServiceCategoryFormValues,
): Promise<ServiceCategory> {
  const { data } = await apiClient.post<ApiResponse<ServiceCategory>>('/service-categories', payload);
  return data.data!;
}

/** PUT /service-categories/:id */
export async function updateServiceCategory(
  id: number,
  payload: Partial<ServiceCategoryFormValues>,
): Promise<ServiceCategory> {
  const { data } = await apiClient.put<ApiResponse<ServiceCategory>>(`/service-categories/${id}`, payload);
  return data.data!;
}

/** DELETE /service-categories/:id — refused (409) while it still has services in it */
export async function deleteServiceCategory(id: number): Promise<void> {
  await apiClient.delete(`/service-categories/${id}`);
}
