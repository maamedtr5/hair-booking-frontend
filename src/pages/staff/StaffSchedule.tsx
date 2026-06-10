import { useState } from 'react';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppointmentsByStaff, useUpdateAppointment } from '../../hooks/useAppointments';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDateTime, formatAppointmentDate, formatDuration, isUpcoming, } from '../../utils/formatDate';
import { formatGHS } from '../../utils/formatCurrency';
import "../../styles/layout/PageStyles/StaffScheduleStyle.css";


function toYMD(date: Date) { return date.toISOString().split('T')[0]; }

export function StaffSchedule() {
  const { user } = useAuth();
  const staffId = user?.id ?? 0;
  const [filter, setFilter] = useState<'upcoming' | 'today' | 'all'>('today');
  const { data: appointments = [], isLoading } = useAppointmentsByStaff(staffId);
  const updateMutation = useUpdateAppointment();

  const today = toYMD(new Date());
  const filtered = appointments.filter(a => {
    if (filter === 'today')    return toYMD(new Date(a.date)) === today;
    if (filter === 'upcoming') return isUpcoming(a.date) && a.status !== 'CANCELLED';
    return true;
  });

  return (
    <>
      
      <div className="schedule-page animate-fade-up">
        <div className="schedule-header">
          <h1 className="schedule-title">My Schedule</h1>
          <p className="schedule-sub">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="filter-row">
          {(['today', 'upcoming', 'all'] as const).map(f => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? <PageSpinner message="Loading schedule…" /> : (
          <div className="appt-list">
            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">✦</div>
                <div className="empty-title">
                  {filter === 'today' ? 'No appointments today' : 'No appointments found'}
                </div>
                <p className="empty-sub">
                  {filter === 'today' ? 'Enjoy your free day!' : 'No matching appointments in this view'}
                </p>
              </div>
            ) : (
              filtered.map(appt => (
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
                      Client #{appt.booking?.clientId ?? '—'}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <StatusBadge status={appt.status} size="sm" />
                    {appt.notes && (
                      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                        "{appt.notes}"
                      </p>
                    )}
                  </div>

                  {appt.status === 'CONFIRMED' && (
                    <div className="appt-actions">
                      <Button
                        size="sm"
                        icon={<CheckCircle size={13} />}
                        onClick={() => updateMutation.mutate({ id: appt.id, payload: { status: 'COMPLETED' } })}
                        loading={updateMutation.isPending}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  )}
                  {appt.status === 'PENDING' && (
                    <div className="appt-actions">
                      <Button
                        size="sm" variant="outline"
                        icon={<CheckCircle size={13} />}
                        onClick={() => updateMutation.mutate({ id: appt.id, payload: { status: 'CONFIRMED' } })}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm" variant="danger"
                        icon={<XCircle size={13} />}
                        onClick={() => updateMutation.mutate({ id: appt.id, payload: { status: 'CANCELLED' } })}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}