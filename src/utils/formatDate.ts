import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  addHours,
  parseISO,
  isValid,
  differenceInMinutes,
  startOfDay,
  endOfDay,
} from 'date-fns';

// ─── Display Formatting ───────────────────────────────────────────────────────

/** "Monday, 20 January 2025" */
export function formatAppointmentDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Invalid date';
  return format(date, 'EEEE, dd MMMM yyyy');
}

/** "10:00 AM" */
export function formatTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return '';
  return format(date, 'hh:mm a');
}

/** "20 Jan 2025, 10:00 AM" — compact for tables */
export function formatDateTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'Invalid date';
  return format(date, 'dd MMM yyyy, hh:mm a');
}

/** "2 hours ago" / "in 3 days" — for notifications */
export function formatRelative(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

/** "10:00 AM – 12:00 PM" — for slot display */
export function formatSlotRange(startStr: string, endStr: string): string {
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  if (!isValid(start) || !isValid(end)) return '';
  return `${format(start, 'hh:mm a')} – ${format(end, 'hh:mm a')}`;
}

/** "180 min" → "3 hrs" or "90 min" → "1 hr 30 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr${hrs > 1 ? 's' : ''} ${rem} min`;
}

/** "YYYY-MM-DD" for date inputs */
export function toInputDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

// ─── Business Logic ───────────────────────────────────────────────────────────

/**
 * Cancellation policy: client may cancel/reschedule up to 24 hours before appointment.
 * Returns true if the appointment is still within the cancellable window.
 */
export function isWithinCancellationWindow(appointmentDateStr: string): boolean {
  const appointmentDate = parseISO(appointmentDateStr);
  if (!isValid(appointmentDate)) return false;
  const cutoff = addHours(new Date(), 24);
  return isAfter(appointmentDate, cutoff);
}

/** Returns true if the appointment date is in the future */
export function isUpcoming(dateStr: string): boolean {
  const date = parseISO(dateStr);
  if (!isValid(date)) return false;
  return isAfter(date, new Date());
}

/** Returns true if a slot's startTime is in the future and not booked */
export function isSlotAvailable(startTimeStr: string, isBooked: boolean): boolean {
  if (isBooked) return false;
  const start = parseISO(startTimeStr);
  return isValid(start) && isAfter(start, new Date());
}

/** Get start and end of a given day for API date filters */
export function getDayRange(dateStr: string): { start: string; end: string } {
  const date = parseISO(dateStr);
  return {
    start: startOfDay(date).toISOString(),
    end: endOfDay(date).toISOString(),
  };
}

/** Duration of a slot in minutes */
export function slotDurationMinutes(startStr: string, endStr: string): number {
  return differenceInMinutes(parseISO(endStr), parseISO(startStr));
}

/** Check if a date string is in the past */
export function isPast(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isBefore(date, new Date());
}