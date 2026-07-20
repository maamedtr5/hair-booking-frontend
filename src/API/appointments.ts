import apiClient from '../utils/apiClient';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
  ReschedulePayload,
  ApiResponse,
} from '../types/models';

/** POST /appointments — books directly; no login required. */
export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const { data } = await apiClient.post<ApiResponse<Appointment>>('/appointments', payload);
  return data.data!;
}

export async function getAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>('/appointments');
  return data.data ?? [];
}

export async function getAppointment(id: number): Promise<Appointment> {
  const { data } = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return data.data!;
}

export async function updateAppointment(
  id: number,
  payload: Partial<CreateAppointmentPayload> & { status?: AppointmentStatus },
): Promise<Appointment> {
  const { data } = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}`, payload);
  return data.data!;
}

export async function deleteAppointment(id: number): Promise<void> {
  await apiClient.delete(`/appointments/${id}`);
}

export async function rescheduleAppointment(id: number, payload: ReschedulePayload): Promise<Appointment> {
  const { data } = await apiClient.post<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, payload);
  return data.data!;
}

/** POST /appointments/bulk-cancel — was pointed at /bulk/cancel, which doesn't exist. */
export async function bulkCancelAppointments(appointmentIds: number[]): Promise<void> {
  await apiClient.post('/appointments/bulk-cancel', { appointmentIds });
}

export async function getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(`/appointments/client/${clientId}`);
  return data.data ?? [];
}

export async function getAppointmentsByStaff(staffId: number): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(`/appointments/staff/${staffId}`);
  return data.data ?? [];
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(`/appointments/date/${date}`);
  return data.data ?? [];
}

export async function getAppointmentsByStatus(status: AppointmentStatus): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(`/appointments/status/${status}`);
  return data.data ?? [];
}

export async function sendReminder(id: number): Promise<void> {
  await apiClient.post(`/appointments/${id}/reminder`);
}

export async function cancelReminder(id: number): Promise<void> {
  await apiClient.delete(`/appointments/${id}/reminder`);
}