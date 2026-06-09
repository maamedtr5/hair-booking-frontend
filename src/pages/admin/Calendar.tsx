import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAppointmentsByDate,
  useRescheduleAppointment,
  useUpdateAppointment,
} from '../../hooks/useAppointments';
import { useStaff } from '../../hooks/useStaff';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import {
  formatTime,
  formatAppointmentDate,
  isWithinCancellationWindow,
} from '../../utils/formatDate';
import { formatGHS } from '../../utils/formatCurrency';
import type { Appointment, AppointmentStatus } from '../../types/models';
import '../../styles/layout/PageStyles/CalenderStyles.css';

const STATUS_FILTERS: { label: string; value: AppointmentStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const toYMD = (date: Date) => date.toISOString().split('T')[0];

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export function Calendar() {
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Start from Sunday
    return d;
  });
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [staffFilter, setStaffFilter] = useState<number | 'ALL'>('ALL');
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [newDate, setNewDate] = useState('');

  const { data: dayAppts = [], isLoading } = useAppointmentsByDate(selectedDate);
  const { data: staff = [] } = useStaff();
  const rescheduleMutation = useRescheduleAppointment();
  const updateMutation = useUpdateAppointment();

  // Generate 7-day week array
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter appointments based on selected filters
  const filteredAppts = dayAppts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (staffFilter !== 'ALL' && a.staffId !== staffFilter) return false;
    return true;
  });

  return (
    <>
      

      <div className="cal-page animate-fade-up">
        {/* Header */}
        <div className="cal-header">
          <div>
            <h1 className="cal-title">Calendar</h1>
            <p className="cal-sub">{formatAppointmentDate(selectedDate + 'T00:00:00')}</p>
          </div>
        </div>

        {/* Week strip navigation */}
        <div className="week-strip">
          <button
            className="week-nav-btn"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="week-days">
            {weekDays.map((day) => {
              const ymd = toYMD(day);
              const isToday = ymd === toYMD(new Date());
              return (
                <div
                  key={ymd}
                  className={`week-day${ymd === selectedDate ? ' selected' : ''}${
                    isToday ? ' today' : ''
                  }`}
                  onClick={() => setSelectedDate(ymd)}
                  role="button"
                  aria-label={formatAppointmentDate(ymd + 'T00:00:00')}
                >
                  <span className="week-day-name">
                    {day.toLocaleDateString('en-GH', { weekday: 'short' })}
                  </span>
                  <span className="week-day-num">{day.getDate()}</span>
                </div>
              );
            })}
          </div>
          <button
            className="week-nav-btn"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Filters */}
        <div className="filters-row">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              className={`filter-chip${statusFilter === value ? ' active' : ''}`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
          {staff.length > 0 && (
            <select
              className="filter-select"
              value={staffFilter}
              onChange={(e) =>
                setStaffFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
            >
              <option value="ALL">All Stylists</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.name ?? `Stylist #${s.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Appointments list */}
        {isLoading ? (
          <PageSpinner message="Loading appointments…" />
        ) : (
          <div className="appt-list">
            {filteredAppts.length === 0 ? (
              <div className="empty-day">
                No appointments{' '}
                {statusFilter !== 'ALL' ? `with status "${statusFilter.toLowerCase()}"` : ''} on this day
              </div>
            ) : (
              filteredAppts.map((appt) => (
                <div key={appt.id} className="appt-card">
                  {/* Time column */}
                  <div className="appt-time-col">
                    <div className="appt-time">{formatTime(appt.date)}</div>
                    <div className="appt-time-label">start</div>
                  </div>
                  {/* Separator */}
                  <div className="appt-divider" />
                  {/* Main info */}
                  <div className="appt-main">
                    <div className="appt-name">
                      {appt.service?.name ?? `Service #${appt.serviceId}`}
                    </div>
                    <div className="appt-meta">
                      {appt.staff?.user?.name
                        ? `with ${appt.staff.user.name}`
                        : 'Stylist TBD'}
                      {appt.notes && ` · ${appt.notes}`}
                    </div>
                    <StatusBadge status={appt.status} size="sm" />
                    {/* Actions */}
                    <div className="appt-actions">
                      {appt.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMutation.mutate({
                              id: appt.id,
                              payload: { status: 'CONFIRMED' },
                            })
                          }
                          loading={updateMutation.isPending}
                        >
                          Confirm
                        </Button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRescheduleTarget(appt);
                            setNewDate('');
                          }}
                        >
                          Reschedule
                        </Button>
                      )}
                      {isWithinCancellationWindow(appt.date) && appt.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setCancelTarget(appt.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Price */}
                  {appt.service && (
                    <div className="appt-price">{formatGHS(appt.service.price)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
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
                    { onSuccess: () => setRescheduleTarget(null) }
                  );
                }
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 8,
            }}
          >
            New Date & Time
          </label>
          <input
            type="datetime-local"
            className="reschedule-input"
            value={newDate}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            updateMutation.mutate(
              { id: cancelTarget, payload: { status: 'CANCELLED' } },
              { onSettled: () => setCancelTarget(null) }
            );
          }
        }}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmLabel="Yes, Cancel"
        danger
        loading={updateMutation.isPending}
      />
    </>
  );
}