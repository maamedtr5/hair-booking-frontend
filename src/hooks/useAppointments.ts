import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import * as appointmentsApi from '../api/appointments';
import type { AppointmentStatus, CreateAppointmentPayload, ReschedulePayload } from '../types/models';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';
import { useAuthContext } from './useAuthcontext';

export const appointmentKeys = {
  all: ['appointments'] as const,
  byId: (id: number) => ['appointments', id] as const,
  byClient: (clientId: number) => ['appointments', 'client', clientId] as const,
  byStaff: (staffId: number) => ['appointments', 'staff', staffId] as const,
  byDate: (date: string) => ['appointments', 'date', date] as const,
  byStatus: (status: AppointmentStatus) => ['appointments', 'status', status] as const,
};

export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.all,
    queryFn: appointmentsApi.getAppointments,
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: appointmentKeys.byId(id),
    queryFn: () => appointmentsApi.getAppointment(id),
    enabled: !!id,
  });
}

export function useAppointmentsByClient(clientId: number) {
  return useQuery({
    queryKey: appointmentKeys.byClient(clientId),
    queryFn: () => appointmentsApi.getAppointmentsByClient(clientId),
    enabled: !!clientId,
  });
}

export function useMyAppointments() {
  const { user } = useAuthContext();
  return useAppointmentsByStaff(user?.staff?.id ?? null);
}

export function useAppointmentsByStaff(staffId: number | null | undefined) {
  return useQuery({
    queryKey: appointmentKeys.byStaff(staffId ?? 0),
    queryFn: () => appointmentsApi.getAppointmentsByStaff(staffId!),
    enabled: !!staffId,
  });
}

export function useAppointmentsByDate(date: string) {
  return useQuery({
    queryKey: appointmentKeys.byDate(date),
    queryFn: () => appointmentsApi.getAppointmentsByDate(date),
    enabled: !!date,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useAppointmentsByStatus(status: AppointmentStatus) {
  return useQuery({
    queryKey: appointmentKeys.byStatus(status),
    queryFn: () => appointmentsApi.getAppointmentsByStatus(status),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      appointmentsApi.createAppointment(payload),
    // Transient slot-booking races surface as a 409 with this specific
    // message (see withConflictCheck on the backend) — safe to retry
    // automatically since nothing was partially applied. Any other
    // error (real validation failures, genuine double-booking, etc.)
    // is left alone and surfaces to the user immediately.
    retry: (failureCount, err) => {
      if (failureCount >= 1) return false;
      const status = (err as AxiosError)?.response?.status;
      const message = getErrorMessage(err);
      return status === 409 && message.includes('being booked by someone else');
    },
    retryDelay: 300,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment created successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreateAppointmentPayload> & { status?: AppointmentStatus };
    }) => appointmentsApi.updateAppointment(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      qc.invalidateQueries({ queryKey: appointmentKeys.byId(id) });
      toast.success('Appointment updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReschedulePayload }) =>
      appointmentsApi.rescheduleAppointment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment rescheduled');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      appointmentsApi.updateAppointment(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment cancelled');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useBulkCancelAppointments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => appointmentsApi.bulkCancelAppointments(ids),
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success(`${ids.length} appointments cancelled`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useSendReminder() {
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.sendReminder(id),
    onSuccess: () => toast.success('Reminder sent'),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}


// ─── Claim queue (staff self-service pickup) ────────────────────────────────

export const unclaimedQueueKey = ['appointments', 'queue', 'unclaimed'] as const;

export function useUnclaimedAppointments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: unclaimedQueueKey,
    queryFn: () =>
      appointmentsApi.getAppointmentsByStatus('UNCLAIMED' as AppointmentStatus),
    // The whole point of this list is "the moment someone's free" — poll
    // it so a newly-confirmed, unassigned appointment shows up without
    // staff having to manually refresh the page.
    refetchInterval: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useClaimAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      appointmentsApi.updateAppointment(id, {
        status: 'CLAIMED' as AppointmentStatus,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: unclaimedQueueKey });
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment claimed — added to your schedule.');
    },
    onError: (err) => {
      // A 409 here almost always means someone else claimed it first, or
      // it now overlaps something newly on the claimer's own schedule —
      // either way the queue is stale, so refresh it along with the error.
      qc.invalidateQueries({ queryKey: unclaimedQueueKey });
      toast.error(getErrorMessage(err));
    },
  });
}