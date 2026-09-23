import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as categoriesApi from '../api/serviceCategories';
import type { ServiceCategoryFormValues } from '../validators/serviceCategoryValidator';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

export const serviceCategoryKeys = {
  all: ['serviceCategories'] as const,
  admin: ['serviceCategories', 'admin'] as const,
  byId: (id: number) => ['serviceCategories', id] as const,
};

/** Public: active categories + active services + form template, for the booking page. */
export function useServiceCategories() {
  return useQuery({
    queryKey: serviceCategoryKeys.all,
    queryFn: () => categoriesApi.getServiceCategories(),
    staleTime: 10 * 60 * 1000, // Categories/services change infrequently
  });
}

/** Admin: every category (including inactive) with every service, for the dashboard. */
export function useAdminServiceCategories() {
  return useQuery({
    queryKey: serviceCategoryKeys.admin,
    queryFn: () => categoriesApi.getServiceCategories({ includeInactive: true }),
    staleTime: 60 * 1000,
  });
}

export function useServiceCategory(id: number) {
  return useQuery({
    queryKey: serviceCategoryKeys.byId(id),
    queryFn: () => categoriesApi.getServiceCategory(id),
    enabled: !!id,
  });
}

function invalidateCategoryQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: serviceCategoryKeys.all });
  qc.invalidateQueries({ queryKey: serviceCategoryKeys.admin });
  // Categories embed their services, but services can also be queried on
  // their own (e.g. the flat admin services table) — keep both in sync,
  // using the shared key prefix rather than importing useServices.ts
  // directly to avoid a circular import between the two hook modules.
  qc.invalidateQueries({ queryKey: ['services'] });
}

export function useCreateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceCategoryFormValues) => categoriesApi.createServiceCategory(payload),
    onSuccess: () => {
      invalidateCategoryQueries(qc);
      toast.success('Category created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServiceCategoryFormValues> }) =>
      categoriesApi.updateServiceCategory(id, payload),
    onSuccess: (_, { id }) => {
      invalidateCategoryQueries(qc);
      qc.invalidateQueries({ queryKey: serviceCategoryKeys.byId(id) });
      toast.success('Category updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.deleteServiceCategory(id),
    onSuccess: () => {
      invalidateCategoryQueries(qc);
      toast.success('Category deleted');
    },
    // Deliberately no generic onError toast here — the caller shows the
    // server's specific "still has N services in it" message inline
    // (see CategoriesPage), which is more useful than a toast.
  });
}
