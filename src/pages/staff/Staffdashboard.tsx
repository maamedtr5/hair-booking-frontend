// pages/staff/StaffDashboard.tsx
import { useMemo, useContext,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../store/AuthContext';
import { useUpdateAppointment,useMyAppointments } from '../../hooks/useAppointments';
import { useNotifications } from '../../hooks/useNotifications';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { useUIStore } from '../../store/uiStore';
import type { AppNotification, Appointment, AppointmentStatus } from '../../types/models';


function formatGHS(n: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(n);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60); const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function isToday(iso: string) { return iso.startsWith(todayStr()); }
function isUpcoming(iso: string) { return new Date(iso) > new Date(); }

// ─── Today appointment row ────────────────────────────────────────────────────
function TodayAppointmentRow({
  appt,
  onComplete,
  onReschedule,
}: {
  appt: Appointment;
  onComplete: (id: number) => void;
  onReschedule: (id: number) => void;
}) {
 const [now] = useState(() => Date.now());

  const isPending   = appt.status === 'PENDING';
  const isConfirmed = appt.status === 'CONFIRMED';
  const isFinal     = ['COMPLETED', 'CANCELLED', 'RESCHEDULED'].includes(appt.status);
  const isNow       = Math.abs(new Date(appt.date).getTime() - now) < 30 * 60 * 1000;

  return (
    <div className={`staff-today__row ${isNow ? 'staff-today__row--now' : ''}`}>
      <div className="staff-today__time-col">
        <span className="staff-today__time">{formatTime(appt.date)}</span>
        {appt.service?.duration && (
          <span className="staff-today__dur">{formatDuration(appt.service.duration)}</span>
        )}
      </div>

      <div className="staff-today__info">
  <span className="staff-today__client">
    {appt.booking?.client?.user?.name ?? '—'}
  </span>
  <span className="staff-today__service">
    {appt.service?.name ?? '—'}
  </span>
  {appt.booking?.client?.phone && (
    <a
      href={`tel:${appt.booking.client?.phone}`}
      className="staff-today__phone"
    >
      {appt.booking.client?.phone}
    </a>
  )}
</div>


      <div className="staff-today__right">
        <StatusBadge status={appt.status} />
        {!isFinal && (isConfirmed || isPending) && (
          <div className="staff-today__actions">
            <button type="button" onClick={() => onComplete(appt.id)} className="btn btn--sm staff-today__complete-btn">
              Complete
            </button>
            <button type="button" onClick={() => onReschedule(appt.id)} className="btn btn--ghost btn--sm">
              No-show
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats mini card ──────────────────────────────────────────────────────────

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`staff-stat ${accent ? 'staff-stat--accent' : ''}`}>
      <span className="staff-stat__value">{value}</span>
      <span className="staff-stat__label">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const navigate    = useNavigate();
  const  auth    = useContext(AuthContext);
  const user = auth?.user;
  const { addToast } = useUIStore();

  const { data: appointments, isLoading } = useMyAppointments();
  const updateMutation = useUpdateAppointment();
  const { data: notifications } = useNotifications(user?.id ?? 0);

  const todayAppts = useMemo(
    () => (appointments ?? [])
      .filter((a: Appointment) => isToday(a.date))
      .sort((a: Appointment, b: Appointment) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [appointments]
  );

  const upcomingAppts = useMemo(
    () => (appointments ?? [])
      .filter((a: Appointment) => isUpcoming(a.date) && !isToday(a.date) && a.status !== 'CANCELLED')
      .sort((a: Appointment, b: Appointment) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5),
    [appointments]
  );

// capture "now" once per render
 const [now] = useState(() => Date.now());
const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

const weekRevenue = useMemo(() => {
  return (appointments ?? [])
    .filter(
      (a: Appointment) =>
        a.status === 'COMPLETED' && new Date(a.date).getTime() > weekAgo
    )
    .reduce((sum: number, a: Appointment) => sum + (a.service?.price ?? 0), 0);
}, [appointments, weekAgo]);

const completedToday = todayAppts.filter(
  (a: Appointment) => a.status === 'COMPLETED'
).length;

const unreadCount = (notifications as AppNotification[] ?? []).filter((n) => !n.read).length;

const greeting = useMemo(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}, []);

async function handleStatusChange(id: number, status: AppointmentStatus) {
  try {
    await updateMutation.mutateAsync({ id, payload: { status } });
    addToast({
      type: 'success',
      message: `Appointment marked as ${
        status === 'COMPLETED' ? 'completed' : 'rescheduled'
      }.`,
    });
  } catch {
    addToast({ type: 'error', message: 'Update failed.' });
  }
}


  return (
    <div className="staff-dash">
      {/* Header */}
      <div className="staff-dash__header">
        <div>
          <h1 className="staff-dash__greeting">{greeting}, {user?.name?.split(' ')[0] ?? 'there'}</h1>
          <p className="staff-dash__date">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}
            {unreadCount > 0 && <span className="staff-dash__notif-pill">{unreadCount} new</span>}
          </p>
        </div>
        <button type="button" onClick={() => navigate('/staff/schedule')} className="btn btn--ghost btn--sm">
          View full schedule →
        </button>
      </div>

      {/* Stats row */}
      <div className="staff-dash__stats">
        <MiniStat label="Today's appointments" value={isLoading ? '…' : todayAppts.length} accent />
        <MiniStat label="Completed today" value={isLoading ? '…' : completedToday} />
        <MiniStat label="This week's revenue" value={isLoading ? '…' : formatGHS(weekRevenue)} />
        <MiniStat label="Upcoming (next 7 days)" value={isLoading ? '…' : upcomingAppts.length} />
      </div>

      {/* Today's schedule */}
      <section className="staff-dash__section">
        <div className="staff-dash__section-header">
          <h2 className="staff-dash__section-title">Today's appointments</h2>
          <span className="staff-dash__section-count">{todayAppts.length} total</span>
        </div>

        {isLoading ? (
          <div className="staff-dash__state"><Spinner size="md" /></div>
        ) : todayAppts.length === 0 ? (
          <div className="staff-dash__empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>No appointments today. Enjoy the day!</p>
          </div>
        ) : (
          <div className="staff-today">
            {todayAppts.map((a: Appointment) => (
              <TodayAppointmentRow
                key={a.id}
                appt={a}
                onComplete={(id: number) => handleStatusChange(id, 'COMPLETED')}
                onReschedule={(id: number) => handleStatusChange(id, 'RESCHEDULED')}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcomingAppts.length > 0 && (
        <section className="staff-dash__section">
          <div className="staff-dash__section-header">
            <h2 className="staff-dash__section-title">Coming up</h2>
            <button type="button" onClick={() => navigate('/staff/schedule')} className="staff-dash__see-all">
              See all →
            </button>
          </div>
      <div className="staff-upcoming">
  {upcomingAppts.map((a: Appointment) => (
    <div key={a.id} className="staff-upcoming__row">
      <div className="staff-upcoming__date-col">
        <span className="staff-upcoming__date">{formatDate(a.date)}</span>
        <span className="staff-upcoming__time">{formatTime(a.date)}</span>
      </div>
      <div className="staff-upcoming__info">
        <span className="staff-upcoming__client">
          {a.booking?.client?.user?.name ?? '—'}
        </span>
        <span className="staff-upcoming__service">
          {a.service?.name ?? '—'}
        </span>
      </div>
      <StatusBadge status={a.status} />
    </div>
  ))}
</div>

        </section>
      )}

     
    </div>
  );
}