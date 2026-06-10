// pages/admin/Dashboard.tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../../hooks/useAppointments';
import { useClients } from '../../hooks/useClients';
import { useRevenueReport } from '../../hooks/useReports';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuthContext } from '../../context/AuthContext';
import {
  StatsCard,
  RevenueIcon,
  AppointmentIcon,
  ClientIcon,
  CancellationIcon,
} from '../../components/dashboard/StatsCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { AppointmentTable } from '../../components/dashboard/AppointmentTable';
import { StatusBadge } from '../../components/ui/Badge';
import type { Appointment } from '../../types';
import '..styles/layout/BookingStyles/

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGHS(value: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function previousThirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 60);
  return d.toISOString().split('T')[0];
}

function pctChange(current: number, previous: number): { label: string; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) return { label: '—', direction: 'neutral' };
  const delta = ((current - previous) / previous) * 100;
  const abs = Math.abs(delta).toFixed(1);
  return {
    label: `${delta >= 0 ? '+' : '−'}${abs}%`,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
  };
}

// ─── Quick action card ────────────────────────────────────────────────────────

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}

function QuickAction({ label, description, icon, onClick, accent }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`quick-action ${accent ? 'quick-action--accent' : ''}`}
    >
      <span className="quick-action__icon" aria-hidden="true">{icon}</span>
      <span className="quick-action__text">
        <span className="quick-action__label">{label}</span>
        <span className="quick-action__desc">{description}</span>
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="quick-action__arrow" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  );
}

// ─── Today's schedule row ─────────────────────────────────────────────────────

function TodayRow({ appt }: { appt: Appointment }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/admin/appointments/${appt.id}`)}
      className="today-row"
      aria-label={`View appointment for ${appt.client?.user?.name ?? 'client'}`}
    >
      <div className="today-row__time">{formatTime(appt.date)}</div>
      <div className="today-row__info">
        <span className="today-row__client">{appt.client?.user?.name ?? '—'}</span>
        <span className="today-row__service">{appt.service?.name ?? '—'}</span>
      </div>
      <div className="today-row__staff">{appt.staff?.user?.name ?? 'Unassigned'}</div>
      <div className="today-row__price">
        {appt.service?.price != null ? formatGHS(appt.service.price) : '—'}
      </div>
      <StatusBadge status={appt.status} />
    </button>
  );
}

// ─── Top services widget ──────────────────────────────────────────────────────

function TopServicesWidget({ appointments }: { appointments: Appointment[] }) {
  const ranked = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const a of appointments) {
      if (!a.service) continue;
      const key = String(a.service.id);
      if (!counts[key]) counts[key] = { name: a.service.name, count: 0, revenue: 0 };
      counts[key].count += 1;
      counts[key].revenue += a.service.price ?? 0;
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [appointments]);

  const max = ranked[0]?.count ?? 1;

  if (ranked.length === 0) {
    return <p className="widget__empty">No service data yet.</p>;
  }

  return (
    <div className="top-services">
      {ranked.map((s, i) => (
        <div key={s.name} className="top-services__row">
          <span className="top-services__rank">{i + 1}</span>
          <div className="top-services__info">
            <span className="top-services__name">{s.name}</span>
            <div className="top-services__bar-wrap">
              <div
                className="top-services__bar"
                style={{ width: `${(s.count / max) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="top-services__stats">
            <span className="top-services__count">{s.count} appts</span>
            <span className="top-services__rev">{formatGHS(s.revenue)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const today = todayISO();
  const thirtyAgo = thirtyDaysAgo();
  const sixtyAgo = previousThirtyDaysAgo();

  // Data fetching
  const { data: appointments, isLoading: apptLoading } = useAppointments();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: currentRevData, isLoading: revLoading } = useRevenueReport({
    startDate: thirtyAgo,
    endDate: today,
  });
  const { data: prevRevData } = useRevenueReport({
    startDate: sixtyAgo,
    endDate: thirtyAgo,
  });
  const { data: notifications } = useNotifications();

  // ── Derived metrics ──

  const todayAppts = useMemo(
    () =>
      (appointments ?? []).filter((a: Appointment) =>
        a.date.startsWith(today)
      ).sort((a: Appointment, b: Appointment) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [appointments, today]
  );

  const pendingCount = useMemo(
    () => (appointments ?? []).filter((a: Appointment) => a.status === 'PENDING').length,
    [appointments]
  );

  const cancelRate = useMemo(() => {
    const all = (appointments ?? []).length;
    if (all === 0) return 0;
    const cancelled = (appointments ?? []).filter((a: Appointment) => a.status === 'CANCELLED').length;
    return Math.round((cancelled / all) * 100);
  }, [appointments]);

  const currentRevenue: number = currentRevData?.totalRevenue ?? 0;
  const previousRevenue: number = prevRevData?.totalRevenue ?? 0;
  const revChange = pctChange(currentRevenue, previousRevenue);

  const currentClients = clients?.length ?? 0;

  const unreadCount = useMemo(
    () => (notifications ?? []).filter((n: any) => !n.isRead).length,
    [notifications]
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Admin';

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__greeting">
            {greeting}, {firstName}
          </h1>
          <p className="dashboard__date">
            {new Date().toLocaleDateString('en-GH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {unreadCount > 0 && (
              <span className="dashboard__notif-pill" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount} new
              </span>
            )}
          </p>
        </div>

        <div className="dashboard__header-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/appointments/new')}
            className="btn btn--primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New appointment
          </button>
        </div>
      </header>

      {/* ── Stats row ── */}
      <section className="dashboard__stats" aria-label="Key metrics">
        <StatsCard
          title="Revenue (30 days)"
          value={revLoading ? '…' : formatGHS(currentRevenue)}
          subtitle="vs prior 30 days"
          change={revChange.label}
          trend={revChange.direction}
          icon={<RevenueIcon />}
          isLoading={revLoading}
        />
        <StatsCard
          title="Today's appointments"
          value={apptLoading ? '…' : todayAppts.length}
          subtitle={pendingCount > 0 ? `${pendingCount} pending confirmation` : 'All confirmed'}
          change={pendingCount > 0 ? `${pendingCount} pending` : undefined}
          trend={pendingCount > 0 ? 'neutral' : undefined}
          icon={<AppointmentIcon />}
          isLoading={apptLoading}
          onClick={() => navigate('/admin/appointments')}
        />
        <StatsCard
          title="Total clients"
          value={clientsLoading ? '…' : currentClients}
          icon={<ClientIcon />}
          isLoading={clientsLoading}
          onClick={() => navigate('/admin/clients')}
        />
        <StatsCard
          title="Cancellation rate"
          value={apptLoading ? '…' : `${cancelRate}%`}
          subtitle="All time"
          icon={<CancellationIcon />}
          positiveIsGood={false}
          isLoading={apptLoading}
        />
      </section>

      {/* ── Main content grid ── */}
      <div className="dashboard__grid">
        {/* Revenue chart — full width */}
        <section className="dashboard__card dashboard__card--full" aria-label="Revenue chart">
          <RevenueChart />
        </section>

        {/* Today's schedule */}
        <section className="dashboard__card dashboard__card--wide" aria-label="Today's schedule">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">Today's schedule</h2>
            <span className="dashboard__section-count">{todayAppts.length} appointments</span>
          </div>
          {apptLoading ? (
            <div className="dashboard__skeleton-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="dashboard__skeleton-row" />
              ))}
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="dashboard__empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p>No appointments scheduled for today.</p>
            </div>
          ) : (
            <div className="today-schedule">
              {todayAppts.map((appt: Appointment) => (
                <TodayRow key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </section>

        {/* Top services */}
        <section className="dashboard__card" aria-label="Top services">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">Top services</h2>
            <span className="dashboard__section-count">30 days</span>
          </div>
          {apptLoading ? (
            <div className="dashboard__skeleton-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="dashboard__skeleton-row dashboard__skeleton-row--sm" />
              ))}
            </div>
          ) : (
            <TopServicesWidget appointments={appointments ?? []} />
          )}
        </section>

        {/* Quick actions */}
        <section className="dashboard__card" aria-label="Quick actions">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">Quick actions</h2>
          </div>
          <div className="quick-actions">
            <QuickAction
              label="Book appointment"
              description="Schedule for a walk-in or call-in client"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
                </svg>
              }
              onClick={() => navigate('/admin/appointments/new')}
              accent
            />
            <QuickAction
              label="Add client"
              description="Register a new client profile"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/>
                </svg>
              }
              onClick={() => navigate('/admin/clients/new')}
            />
            <QuickAction
              label="Manage services"
              description="Update prices, durations and categories"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              }
              onClick={() => navigate('/admin/services')}
            />
            <QuickAction
              label="View reports"
              description="Revenue, bookings and staff performance"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              }
              onClick={() => navigate('/admin/reports')}
            />
            <QuickAction
              label="Promo codes"
              description="Create or manage discount codes"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              }
              onClick={() => navigate('/admin/promo-codes')}
            />
            <QuickAction
              label="Staff schedule"
              description="View and manage stylist rosters"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
              onClick={() => navigate('/admin/staff')}
            />
          </div>
        </section>

        {/* Recent appointments table — full width */}
        <section className="dashboard__card dashboard__card--full" aria-label="Recent appointments">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">Recent appointments</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/appointments')}
              className="dashboard__see-all"
            >
              See all →
            </button>
          </div>
          <AppointmentTable limit={8} />
        </section>
      </div>

     
    </div>
  );
}