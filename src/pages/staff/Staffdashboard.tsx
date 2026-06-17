// pages/staff/StaffDashboard.tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../store/AuthContext';
import {useAppointmentsByStaff, useUpdateAppointment,useMyAppointments } from '../../hooks/useAppointments';
 import { useNotifications } from '../../hooks/useNotifications';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { useUIStore } from '../../store/uiStore';
import type { Appointment } from '../../types';


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
  onNoShow,
}: {
  appt: Appointment;
  onComplete: (id: number) => void;
  onNoShow: (id: number) => void;
}) {
  const isPending   = appt.status === 'PENDING';
  const isConfirmed = appt.status === 'CONFIRMED';
  const isFinal     = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status);
  const isNow       = Math.abs(new Date(appt.date).getTime() - Date.now()) < 30 * 60 * 1000;

  return (
    <div className={`staff-today__row ${isNow ? 'staff-today__row--now' : ''}`}>
      <div className="staff-today__time-col">
        <span className="staff-today__time">{formatTime(appt.date)}</span>
        {appt.service?.duration && (
          <span className="staff-today__dur">{formatDuration(appt.service.duration)}</span>
        )}
      </div>

      <div className="staff-today__info">
        <span className="staff-today__client">{appt.client?.user?.name ?? '—'}</span>
        <span className="staff-today__service">{appt.service?.name ?? '—'}</span>
        {appt.client?.user?.phone && (
          <a href={`tel:${appt.client.user.phone}`} className="staff-today__phone">
            {appt.client.user.phone}
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
            <button type="button" onClick={() => onNoShow(appt.id)} className="btn btn--ghost btn--sm">
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
  const { user }    = useAuthContext();
  const { addToast } = useUIStore();

  const { data: appointments, isLoading } = useMyAppointments();
  const updateMutation = useUpdateAppointment();
  const { data: notifications } =useNotifications(user?.id ?? 0);

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

  const weekRevenue = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (appointments ?? [])
      .filter((a: Appointment) => a.status === 'COMPLETED' && new Date(a.date).getTime() > weekAgo)
      .reduce((sum: number, a: Appointment) => sum + (a.service?.price ?? 0), 0);
  }, [appointments]);

  const completedToday = todayAppts.filter((a: Appointment) => a.status === 'COMPLETED').length;
  const unreadCount = (notifications ?? []).filter((n: any) => !n.isRead).length;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  async function handleStatusChange(id: number, status: 'COMPLETED' | 'NO_SHOW') {
    try {
      await updateMutation.mutateAsync({ id, payload: { status: status as unknown as Appointment['status'] } });
      addToast({ type: 'success', message: `Appointment marked as ${status === 'COMPLETED' ? 'completed' : 'no-show'}.` });
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
                onComplete={(id) => handleStatusChange(id, 'COMPLETED')}
                onNoShow={(id) => handleStatusChange(id, 'NO_SHOW')}
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
                  <span className="staff-upcoming__client">{a.client?.user?.name ?? '—'}</span>
                  <span className="staff-upcoming__service">{a.service?.name ?? '—'}</span>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{`
        .staff-dash { display:flex;flex-direction:column;gap:1.5rem;padding:1.75rem 1.5rem;max-width:900px;margin:0 auto; }
        .staff-dash__header { display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
        .staff-dash__greeting { font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.625rem;font-weight:600;color:var(--color-espresso,#2c1a0e);margin:0; }
        .staff-dash__date { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;color:var(--color-text-muted,#9a8e82);margin:.25rem 0 0;display:flex;align-items:center;gap:.625rem; }
        .staff-dash__notif-pill { display:inline-flex;align-items:center;padding:.2rem .5rem;background:color-mix(in srgb,var(--color-gold,#c9a96e) 18%,transparent);border:1px solid color-mix(in srgb,var(--color-gold,#c9a96e) 35%,transparent);border-radius:999px;font-size:.75rem;font-weight:600;color:var(--color-espresso,#2c1a0e); }
        /* Stats */
        .staff-dash__stats { display:grid;grid-template-columns:repeat(4,1fr);gap:.875rem; }
        .staff-stat { background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:12px;padding:1rem 1.125rem;display:flex;flex-direction:column;gap:.25rem; }
        .staff-stat--accent { border-color:color-mix(in srgb,var(--color-gold,#c9a96e) 40%,transparent);background:color-mix(in srgb,var(--color-gold,#c9a96e) 5%,var(--color-surface,#faf8f5)); }
        .staff-stat__value { font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.625rem;font-weight:700;color:var(--color-espresso,#2c1a0e);line-height:1.1; }
        .staff-stat__label { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.78rem;font-weight:500;color:var(--color-text-muted,#9a8e82); }
        /* Section */
        .staff-dash__section { background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:14px;padding:1.25rem;display:flex;flex-direction:column;gap:.875rem; }
        .staff-dash__section-header { display:flex;align-items:center;justify-content:space-between; }
        .staff-dash__section-title { font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.125rem;font-weight:600;color:var(--color-espresso,#2c1a0e);margin:0; }
        .staff-dash__section-count { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;color:var(--color-text-muted,#9a8e82);background:var(--color-border,#e5e0d8);padding:.2rem .5rem;border-radius:999px;font-weight:500; }
        .staff-dash__see-all { background:none;border:none;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;font-weight:600;color:var(--color-gold,#c9a96e);cursor:pointer;padding:0;transition:color .15s; }
        .staff-dash__see-all:hover { color:var(--color-espresso,#2c1a0e); }
        .staff-dash__state { display:flex;justify-content:center;padding:2rem; }
        .staff-dash__empty { display:flex;flex-direction:column;align-items:center;gap:.625rem;padding:2rem;color:var(--color-text-muted,#9a8e82);font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;text-align:center; }
        /* Today rows */
        .staff-today { display:flex;flex-direction:column;gap:.375rem; }
        .staff-today__row { display:grid;grid-template-columns:70px 1fr auto;align-items:center;gap:.875rem;padding:.75rem .875rem;border-radius:10px;border:1px solid transparent;transition:background .12s,border-color .12s; }
        .staff-today__row:hover { background:color-mix(in srgb,var(--color-gold,#c9a96e) 4%,var(--color-surface,#faf8f5));border-color:var(--color-border,#e5e0d8); }
        .staff-today__row--now { border-color:var(--color-gold,#c9a96e) !important;background:color-mix(in srgb,var(--color-gold,#c9a96e) 7%,var(--color-surface,#faf8f5)) !important; }
        .staff-today__time-col { display:flex;flex-direction:column;gap:.15rem;align-items:flex-start; }
        .staff-today__time { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;font-weight:700;color:var(--color-gold,#c9a96e);white-space:nowrap; }
        .staff-today__dur { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.75rem;color:var(--color-text-muted,#9a8e82); }
        .staff-today__info { display:flex;flex-direction:column;gap:.1rem;min-width:0; }
        .staff-today__client { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9375rem;font-weight:600;color:var(--color-espresso,#2c1a0e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .staff-today__service { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;color:var(--color-text-muted,#9a8e82); }
        .staff-today__phone { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;color:var(--color-gold,#c9a96e);text-decoration:none; }
        .staff-today__right { display:flex;flex-direction:column;align-items:flex-end;gap:.5rem; }
        .staff-today__actions { display:flex;gap:.375rem; }
        .staff-today__complete-btn { background:var(--color-espresso,#2c1a0e) !important;color:var(--color-cream,#faf8f5) !important;border:none !important; }
        /* Upcoming */
        .staff-upcoming { display:flex;flex-direction:column;gap:.375rem; }
        .staff-upcoming__row { display:grid;grid-template-columns:100px 1fr auto;align-items:center;gap:.875rem;padding:.625rem .875rem;border-radius:10px;transition:background .12s; }
        .staff-upcoming__row:hover { background:color-mix(in srgb,var(--color-border,#e5e0d8) 40%,transparent); }
        .staff-upcoming__date-col { display:flex;flex-direction:column;gap:.1rem; }
        .staff-upcoming__date { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;font-weight:600;color:var(--color-espresso,#2c1a0e); }
        .staff-upcoming__time { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.78rem;color:var(--color-text-muted,#9a8e82); }
        .staff-upcoming__info { display:flex;flex-direction:column;gap:.1rem;min-width:0; }
        .staff-upcoming__client { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;font-weight:600;color:var(--color-espresso,#2c1a0e); }
        .staff-upcoming__service { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;color:var(--color-text-muted,#9a8e82); }
        /* Buttons */
        .btn { display:inline-flex;align-items:center;gap:.5rem;padding:.6875rem 1.25rem;border-radius:10px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;font-weight:600;cursor:pointer;transition:all .18s;border:none;white-space:nowrap; }
        .btn--ghost { background:transparent;border:1px solid var(--color-border,#e5e0d8);color:var(--color-espresso,#2c1a0e); }
        .btn--ghost:hover { background:var(--color-border,#e5e0d8); }
        .btn--sm { padding:.4375rem .875rem;font-size:.8125rem; }
        @media(max-width:760px){ .staff-dash{padding:1.25rem 1rem;} .staff-dash__stats{grid-template-columns:1fr 1fr;} .staff-today__row{grid-template-columns:60px 1fr;} .staff-today__right{display:none;} }
        @media(max-width:420px){ .staff-dash__stats{grid-template-columns:1fr;} }
      `}</style>
    </div>
  );
}