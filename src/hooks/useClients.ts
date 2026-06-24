import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClients,
  getClient,
  getClientByUserId,
  updateClient,
  deleteClient,
} from '../api/clients';
import type { UpdateClientPayload } from '../api/clients';

const KEY = 'clients';

export function useClients() {
  return useQuery({ queryKey: [KEY], queryFn: getClients });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => getClient(id),
    enabled: !!id,
  });
}

export function useClientByUserId(userId: number | undefined) {
  return useQuery({
    queryKey: [KEY, 'byUser', userId],
    queryFn: () => getClientByUserId(userId!),
    enabled: !!userId,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateClientPayload }) =>
      updateClient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
