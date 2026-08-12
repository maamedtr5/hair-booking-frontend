import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as slotsApi from '../api/slots';
import type { CreateSlotPayload } from '../types/models';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

export const slotKeys = {
  all: ['slots'] as const,
  available: (staffId: number, date: string, duration: number) =>
    ['slots', 'available', staffId, date, duration] as const,
  monthAvailability: (staffId: number, year: number, month: number, duration: number) =>
    ['slots', 'month-availability', staffId, year, month, duration] as const,
  byId: (id: number) => ['slots', id] as const,
};

/** Fetch available (unbooked, future) slots for a staff member — or any staff, if null — on a given date */
export function useAvailableSlots(staffId: number | null, date: string | null, durationMinutes?: number) {
  return useQuery({
    queryKey: slotKeys.available(staffId ?? 0, date ?? '', durationMinutes ?? 0),
    queryFn: () => slotsApi.getAvailableSlots(staffId, date!, durationMinutes),
    enabled: !!date,
    // Refetch every 60 seconds — slots can be booked by other users
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/** Per-day closed/full/available status for a whole month — powers the
 * booking calendar's faded-day display. `month` is 1-12. */
export function useMonthAvailability(
  year: number,
  month: number,
  staffId: number | null,
  durationMinutes?: number,
) {
  return useQuery({
    queryKey: slotKeys.monthAvailability(staffId ?? 0, year, month, durationMinutes ?? 0),
    queryFn: () => slotsApi.getMonthAvailability(year, month, staffId, durationMinutes),
    // Same staleness/refetch cadence as single-day availability — other
    // clients booking in the background can flip a day from available to
    // full at any time.
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