import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as appointmentsApi from '../api/appointments';
import type { AppointmentStatus, CreateAppointmentPayload, ReschedulePayload } from '../types/models';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

// ─── Query keys ───────────────────────────────────────────────────────────────
export const appointmentKeys = {
  all: ['appointments'] as const,
  byId: (id: number) => ['appointments', id] as const,
  byClient: (clientId: number) => ['appointments', 'client', clientId] as const,
  byStaff: (staffId: number) => ['appointments', 'staff', staffId] as const,
  byDate: (date: string) => ['appointments', 'date', date] as const,
  byStatus: (status: AppointmentStatus) => ['appointments', 'status', status] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

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

export function useAppointmentsByStaff(staffId: number) {
  return useQuery({
    queryKey: appointmentKeys.byStaff(staffId),
    queryFn: () => appointmentsApi.getAppointmentsByStaff(staffId),
    enabled: !!staffId,
  });
}

export function useAppointmentsByDate(date: string) {
  return useQuery({
    queryKey: appointmentKeys.byDate(date),
    queryFn: () => appointmentsApi.getAppointmentsByDate(date),
    enabled: !!date,
    // Refetch every 2 minutes — availability changes frequently
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