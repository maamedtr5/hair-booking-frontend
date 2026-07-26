// components/dashboard/AppointmentDetailModal.tsx
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/Badge';
import { useAuthContext } from '../../hooks/useAuthcontext';
import { useRecordManualPayment } from '../../hooks/Usepaymentadmin';
import { toast } from '../../store/uiStore';
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
  const { user } = useAuthContext();
  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const client = appointment.booking?.client;
  const booking = appointment.booking;
  const payment = booking?.payment;
  const servicePrice = appointment.service?.price ?? 0;
  const alreadyPaid = payment?.status === 'SUCCESS' ? payment.amount : 0;
  const balanceDue = Math.max(0, servicePrice - alreadyPaid);

  const [recordingPayment, setRecordingPayment] = useState(false);
  const [payAmount, setPayAmount] = useState(balanceDue > 0 ? String(balanceDue) : '');
  const [payMethod, setPayMethod] = useState<'CASH' | 'MOBILE_MONEY'>('MOBILE_MONEY');

  const recordPayment = useRecordManualPayment();

  async function handleRecordPayment() {
    if (!booking) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await recordPayment.mutateAsync({ bookingId: booking.id, amount, method: payMethod });
      setRecordingPayment(false);
    } catch {
      // toast already shown by the hook
    }
  }

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

        {isStaffOrAdmin && booking && (
          <div className="appt-detail__payment">
            <div className="appt-detail__row">
              <span className="appt-detail__key">Paid so far</span>
              <span className="appt-detail__value">{formatGHS(alreadyPaid)}</span>
            </div>
            <div className="appt-detail__row">
              <span className="appt-detail__key">Balance due</span>
              <span className="appt-detail__value">{formatGHS(balanceDue)}</span>
            </div>

            {!recordingPayment ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRecordingPayment(true)}>
                Record a payment
              </button>
            ) : (
              <div className="appt-detail__payment-form">
                <div className="appt-detail__payment-row">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="appt-detail__payment-input"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Amount"
                  />
                  <select
                    className="appt-detail__payment-select"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as 'CASH' | 'MOBILE_MONEY')}
                  >
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div className="appt-detail__payment-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRecordingPayment(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={handleRecordPayment}
                    disabled={recordPayment.isPending}
                  >
                    {recordPayment.isPending ? 'Saving…' : 'Save payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
