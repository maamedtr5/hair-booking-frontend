import { z } from 'zod';

export const appointmentSchema = z.object({
  serviceId: z.number().int().positive('Select a service'),
  staffId: z.number().int().positive().optional(),
  date: z.string().min(1, 'Select a date and time'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const rescheduleSchema = z.object({
  newDate: z.string().min(1, 'Select a new date and time'),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
export type RescheduleFormValues = z.infer<typeof rescheduleSchema>;
