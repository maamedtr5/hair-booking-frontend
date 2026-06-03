import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as slotsApi from '../api/slots';
import type { CreateSlotPayload } from '../types/models';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

export const slotKeys = {
  all: ['slots'] as const,
  available: (staffId: number, date: string) =>
    ['slots', 'available', staffId, date] as const,
  byId: (id: number) => ['slots', id] as const,
};

/** Fetch available (unbooked, future) slots for a staff member on a given date */
export function useAvailableSlots(staffId: number | null, date: string | null) {
  return useQuery({
    queryKey: slotKeys.available(staffId ?? 0, date ?? ''),
    queryFn: () => slotsApi.getAvailableSlots(staffId!, date!),
    enabled: !!staffId && !!date,
    // Refetch every 60 seconds — slots can be booked by other users
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSlotPayload) => slotsApi.createSlot(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slotKeys.all });
      toast.success('Slot created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreateSlotPayload> & { isBooked?: boolean };
    }) => slotsApi.updateSlot(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slotKeys.all });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => slotsApi.deleteSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slotKeys.all });
      toast.success('Slot removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}