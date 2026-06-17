import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as clientsApi from '../api/clients';

const KEY = 'clients';

export function useClients() {
  return useQuery({ queryKey: [KEY], queryFn: clientsApi.getClients });
}

export function useClient(id: number) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => clientsApi.getClient(id), enabled: !!id });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: clientsApi.UpdateClientPayload }) =>
      clientsApi.updateClient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientsApi.deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}