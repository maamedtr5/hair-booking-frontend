// components/dashboard/AppointmentDetailModal.tsx
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/Badge';
import type { Appointment } from '../../types';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GH', {
    weekday: 'long', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatGHS(value: number): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
}

interface AppointmentDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export function AppointmentDetailModal({ appointment, onClose }: AppointmentDetailModalProps) {
  const client = appointment.booking?.client;

  return (
    <Modal open title="Appointment details" onClose={onClose} size="md">
      <div className="appt-detail">
        <div className="appt-detail__row">
          <span className="appt-detail__key">Status</span>
          <span className="appt-detail__value"><StatusBadge status={appointment.status} /></span>
        </div>
        <div className="appt-detail__row">
          <span className="appt-detail__key">Client</span>
          <span className="appt-detail__value">{client?.user?.name ?? '—'}</span>
        </div>
        <div className="appt-detail__row">
          <span className="appt-detail__key">Contact</span>
          <span className="appt-detail__value">{client?.user?.email ?? client?.phone ?? '—'}</span>
        </div>
        <div className="appt-detail__row">
          <span className="appt-detail__key">Service</span>
          <span className="appt-detail__value">{appointment.service?.name ?? '—'}</span>
        </div>
        <div className="appt-detail__row">
          <span className="appt-detail__key">Stylist</span>
          <span className="appt-detail__value">{appointment.staff?.user?.name ?? 'Unassigned'}</span>
        </div>
        <div className="appt-detail__row">
          <span className="appt-detail__key">Date &amp; time</span>
          <span className="appt-detail__value">{formatDateTime(appointment.date)}</span>
        </div>
        <div className="appt-detail__row">
          <span className="appt-detail__key">Price</span>
          <span className="appt-detail__value">
            {appointment.service?.price != null ? formatGHS(appointment.service.price) : '—'}
          </span>
        </div>
        {appointment.notes && (
          <div className="appt-detail__row">
            <span className="appt-detail__key">Notes</span>
            <span className="appt-detail__value">{appointment.notes}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
