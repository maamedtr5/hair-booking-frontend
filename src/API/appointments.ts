import apiClient from '../utils/apiClient';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
  ReschedulePayload,
  ApiResponse,
} from '../types/models';

/** POST /appointments */
export async function createAppointment(
  payload: CreateAppointmentPayload,
): Promise<Appointment> {
  const { data } = await apiClient.post<ApiResponse<Appointment>>('/appointments', payload);
  return data.data!;
}

/** GET /appointments */
export async function getAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>('/appointments');
  return data.data ?? [];
}

/** GET /appointments/:id */
export async function getAppointment(id: number): Promise<Appointment> {
  const { data } = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return data.data!;
}

/** PUT /appointments/:id */
export async function updateAppointment(
  id: number,
  payload: Partial<CreateAppointmentPayload> & { status?: AppointmentStatus },
): Promise<Appointment> {
  const { data } = await apiClient.put<ApiResponse<Appointment>>(
    `/appointments/${id}`,
    payload,
  );
  return data.data!;
}

/** DELETE /appointments/:id */
export async function deleteAppointment(id: number): Promise<void> {
  await apiClient.delete(`/appointments/${id}`);
}

/** PUT /appointments/:id/reschedule */
export async function rescheduleAppointment(
  id: number,
  payload: ReschedulePayload,
): Promise<Appointment> {
  const { data } = await apiClient.put<ApiResponse<Appointment>>(
    `/appointments/${id}/reschedule`,
    payload,
  );
  return data.data!;
}

/** POST /appointments/bulk/cancel */
export async function bulkCancelAppointments(
  appointmentIds: number[],
): Promise<void> {
  await apiClient.post('/appointments/bulk/cancel', { appointmentIds });
}

/** GET /appointments/client/:clientId */
export async function getAppointmentsByClient(
  clientId: number,
): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(
    `/appointments/client/${clientId}`,
  );
  return data.data ?? [];
}

/** GET /appointments/staff/:staffId */
export async function getAppointmentsByStaff(
  staffId: number,
): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(
    `/appointments/staff/${staffId}`,
  );
  return data.data ?? [];
}

/** GET /appointments/date/:date  (date = YYYY-MM-DD) */
export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(
    `/appointments/date/${date}`,
  );
  return data.data ?? [];
}

/** GET /appointments/status/:status */
export async function getAppointmentsByStatus(
  status: AppointmentStatus,
): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>(
    `/appointments/status/${status}`,
  );
  return data.data ?? [];
}

/** POST /appointments/:id/sync-calendar */
export async function syncToCalendar(id: number): Promise<void> {
  await apiClient.post(`/appointments/${id}/sync-calendar`);
}

/** DELETE /appointments/:id/calendar-event */
export async function removeFromCalendar(id: number): Promise<void> {
  await apiClient.delete(`/appointments/${id}/calendar-event`);
}

/** POST /appointments/:id/send-reminder */
export async function sendReminder(id: number): Promise<void> {
  await apiClient.post(`/appointments/${id}/send-reminder`);
}

/** DELETE /appointments/:id/reminder */
export async function cancelReminder(id: number): Promise<void> {
  await apiClient.delete(`/appointments/${id}/reminder`);
}