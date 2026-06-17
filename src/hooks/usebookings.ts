// hooks/useBookings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings';

const KEY = 'bookings';

export function useBookings() {
  return useQuery({ queryKey: [KEY], queryFn: bookingsApi.getAll });
}

export function useBooking(id: number) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => bookingsApi.getById(id), enabled: !!id });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => bookingsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}