import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  useAppointmentsByClient,
  useCancelAppointment,
  useRescheduleAppointment,
} from '../../hooks/useAppointments';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { formatGHS } from '../../utils/formatCurrency';
import {
  formatDateTime,
  formatDuration,
  isWithinCancellationWindow,
} from '../../utils/formatDate';
import type { Appointment } from '../../types/models';

export function MyBookings() {
  const { user } = useAuth();
  const clientId = user?.id ?? 0;
  const { data: appointments = [], isLoading } = useAppointmentsByClient(clientId);

  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();

  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');

  const upcoming = appointments.filter(
    (a) =>
      ['PENDING', 'CONFIRMED'].includes(a.status) &&
      new Date(a.date) > new Date(),
  );
  const past = appointments.filter(
    (a) =>
      ['COMPLETED', 'CANCELLED'].includes(a.status) ||
      new Date(a.date) <= new Date(),
  );

  if (isLoading) return <PageSpinner message="Loading your bookings…" />;

  return (
    <>
      <style>{`
        .my-bookings { padding: 40px 0 80px; }
        .my-bookings-title {
          font-family: var(--font-display);
          font-size: 2rem; font-weight: 600;
          color: var(--espresso); margin-bottom: 6px;
        }
        .my-bookings-sub {
          font-size: 13.5px; color: var(--text-muted);
          margin-bottom: 32px;
        }
        .bookings-section-title {
          font-family: var(--font-display);
          font-size: 1.1rem; font-weight: 600;
          color: var(--espresso); margin-bottom: 14px;
          padding-bottom: 10px; border-bottom: 1px solid var(--border);
        }
        .booking-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px 22px;
          display: flex; align-items: flex-start; gap: 18px;
          margin-bottom: 12px;
          transition: box-shadow var(--transition);
        }
        .booking-card:hover { box-shadow: var(--shadow-sm); }
        .booking-icon {
          width: 44px; height: 44px; border-radius: var(--radius-md);
          background: var(--cream-mid);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .booking-info { flex: 1; min-width: 0; }
        .booking-name {
          font-family: var(--font-display);
          font-size: 1.05rem; font-weight: 600;
          color: var(--espresso); margin-bottom: 4px;
        }
        .booking-meta {
          font-size: 12.5px; color: var(--text-muted);
          margin-bottom: 8px;
        }
        .booking-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .empty-state {
          padding: 48px 24px; text-align: center;
          border: 1.5px dashed var(--border);
          border-radius: var(--radius-lg);
          margin-bottom: 28px;
        }
        .empty-icon { font-size: 36px; margin-bottom: 12px; }
        .empty-title {
          font-family: var(--font-display);
          font-size: 1.2rem; font-weight: 600;
          color: var(--espresso); margin-bottom: 6px;
        }
        .empty-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
        .section-gap { margin-bottom: 36px; }
        .reschedule-label {
          font-size: 12px; font-weight: 500; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.06em;
          display: block; margin-bottom: 8px;
        }
        .reschedule-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid var(--border); border-radius: var(--radius-md);
          font-family: var(--font-body); font-size: 14px;
          color: var(--espresso); outline: none; background: var(--bg-card);
        }
        .reschedule-input:focus {
          border-color: var(--gold); box-shadow: var(--shadow-gold);
        }
      `}</style>

      <div className="my-bookings animate-fade-up">
        <h1 className="my-bookings-title">My Bookings</h1>
        <p className="my-bookings-sub">Manage your appointments at Locs Allure</p>

        {/* Upcoming */}
        <div className="section-gap">
          <div className="bookings-section-title">Upcoming</div>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <div className="empty-title">No upcoming appointments</div>
              <p className="empty-sub">Ready for a fresh look? Book your next visit.</p>
              <a href="/book">
                <Button variant="primary">Book Now</Button>
              </a>
            </div>
          ) : (
            upcoming.map((appt) => (
              <div key={appt.id} className="booking-card">
                <div className="booking-icon">✂</div>
                <div className="booking-info">
                  <div className="booking-name">
                    {appt.service?.name ?? `Service #${appt.serviceId}`}
                  </div>
                  <div className="booking-meta">
                    {formatDateTime(appt.date)}
                    {appt.service && ` · ${formatDuration(appt.service.duration)}`}
                    {appt.staff?.user?.name && ` · ${appt.staff.user.name}`}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <StatusBadge status={appt.status} size="sm" />
                  </div>
                  <div className="booking-actions">
                    {isWithinCancellationWindow(appt.date) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRescheduleTarget(appt);
                            setNewDate('');
                          }}
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setCancelTarget(appt.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {appt.service && (
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      color: 'var(--gold-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {formatGHS(appt.service.price)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <div className="bookings-section-title">Past Bookings</div>
            {past.map((appt) => (
              <div key={appt.id} className="booking-card" style={{ opacity: 0.75 }}>
                <div className="booking-icon" style={{ opacity: 0.6 }}>✂</div>
                <div className="booking-info">
                  <div className="booking-name">
                    {appt.service?.name ?? `Service #${appt.serviceId}`}
                  </div>
                  <div className="booking-meta">{formatDateTime(appt.date)}</div>
                  <StatusBadge status={appt.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirm dialog */}
      <ConfirmModal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            cancelMutation.mutate(cancelTarget, {
              onSettled: () => setCancelTarget(null),
            });
          }
        }}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Appointment"
        danger
        loading={cancelMutation.isPending}
      />

      {/* Reschedule modal */}
      <Modal
        open={rescheduleTarget !== null}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Appointment"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={rescheduleMutation.isPending}
              disabled={!newDate}
              onClick={() => {
                if (rescheduleTarget && newDate) {
                  rescheduleMutation.mutate(
                    {
                      id: rescheduleTarget.id,
                      payload: { newDate: new Date(newDate).toISOString() },
                    },
                    { onSuccess: () => setRescheduleTarget(null) },
                  );
                }
              }}
            >
              Confirm Reschedule
            </Button>
          </>
        }
      >
        <div>
          <label className="reschedule-label">New Date & Time</label>
          <input
            type="datetime-local"
            className="reschedule-input"
            value={newDate}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
