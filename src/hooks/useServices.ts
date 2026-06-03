import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as servicesApi from '../api/services';
import type { ServiceFormValues } from '../utils/validators';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

export const serviceKeys = {
  all: ['services'] as const,
  byId: (id: number) => ['services', id] as const,
};

export function useServices() {
  return useQuery({
    queryKey: serviceKeys.all,
    queryFn: servicesApi.getServices,
    staleTime: 10 * 60 * 1000, // Services change infrequently — 10 min cache
  });
}

export function useService(id: number) {
  return useQuery({
    queryKey: serviceKeys.byId(id),
    queryFn: () => servicesApi.getService(id),
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceFormValues) => servicesApi.createService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      toast.success('Service created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServiceFormValues> }) =>
      servicesApi.updateService(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      qc.invalidateQueries({ queryKey: serviceKeys.byId(id) });
      toast.success('Service updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => servicesApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.all });
      toast.success('Service deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}