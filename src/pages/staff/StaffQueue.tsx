import { Clock, User, Hand } from 'lucide-react';
import { useUnclaimedAppointments, useClaimAppointment } from '../../hooks/useAppointments';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDateTime, formatAppointmentDate, formatDuration } from '../../utils/formatDate';
import { formatGHS } from '../../utils/formatCurrency';

// "Available Appointments" — confirmed bookings with no staff preference
// that haven't been picked up yet. Anyone can claim one if it fits their
// own schedule; first to claim gets it (the backend's claimAppointment
// endpoint is what actually resolves a same-instant race, not this page).
export function StaffQueue() {
  const { data: appointments = [], isLoading } = useUnclaimedAppointments();
  const claimMutation = useClaimAppointment();

  return (
    <div className="schedule-page animate-fade-up">
      <div className="schedule-header">
        <h1 className="schedule-title">Available Appointments</h1>
        <p className="schedule-sub">
          Confirmed bookings with no stylist yet — claim one if it works with your schedule.
        </p>
      </div>

      {isLoading ? (
        <PageSpinner message="Loading available appointments…" />
      ) : appointments.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"> </div>
          <div className="empty-title">Nothing to claim right now</div>
          <p className="empty-sub">New unassigned appointments will show up here as soon as they're confirmed.</p>
        </div>
      ) : (
        <div className="appt-list">
          {appointments.map((appt) => (
            <div key={appt.id} className="appt-card">
              <div className="appt-card-top">
                <div className="appt-icon"><Clock size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="appt-service">
                    {appt.service?.name ?? `Service #${appt.serviceId}`}
                  </div>
                  <div className="appt-meta">
                    {formatAppointmentDate(appt.date)} at {formatDateTime(appt.date)}
                  </div>
                </div>
                {appt.service && <div className="appt-price">{formatGHS(appt.service.price)}</div>}
              </div>

              <div className="appt-details">
                <div className="appt-detail-item">
                  <Clock size={12} />
                  {appt.service ? formatDuration(appt.service.duration) : '—'}
                </div>
                <div className="appt-detail-item">
                  <User size={12} />
                  {appt.booking?.client?.user?.name ?? 'Client'}
                </div>
              </div>

              {appt.notes && (
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>
                  "{appt.notes}"
                </p>
              )}

              <div className="appt-actions">
                <Button
                  size="sm"
                  icon={<Hand size={13} />}
                  onClick={() => claimMutation.mutate(appt.id)}
                  loading={claimMutation.isPending && claimMutation.variables === appt.id}
                >
                  Claim this appointment
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
