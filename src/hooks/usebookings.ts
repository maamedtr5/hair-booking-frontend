// src/hooks/useBookings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings';
import type { CreateBookingPayload, BookingStatus } from '../types/models';

const KEY = 'bookings';

export function useBookings() {
  return useQuery({
    queryKey: [KEY],
    queryFn: bookingsApi.getAll,
  });
}

export function useBooking(id: number) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => bookingsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreateBookingPayload> & { status?: BookingStatus };
    }) => bookingsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
