// components/dashboard/AppointmentTable.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../../hooks/useAppointments';
import { useUpdateAppointment } from '../../hooks/useAppointments';
import { StatusBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { ConfirmModal } from '../ui/Modal';
import { useUIStore } from '../../stores/uiStore';
import type { Appointment, AppointmentStatus } from '../../types';
import './styles/layout/DashboardStyles/AppointmentTable.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatGHS(value: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
  }).format(value);
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

interface RowActionsProps {
  appointment: Appointment;
  onConfirm: (id: number) => void;
  onComplete: (id: number) => void;
  onCancel: (id: number) => void;
  onView: (id: number) => void;
}

function RowActions({ appointment, onConfirm, onComplete, onCancel, onView }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const isPending = appointment.status === 'PENDING';
  const isConfirmed = appointment.status === 'CONFIRMED';
  const isFinal = ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status);

  return (
    <div className="appt-table__actions" onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for appointment ${appointment.id}`}
        className="appt-table__action-trigger"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div className="appt-table__action-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { onView(appointment.id); setOpen(false); }} className="appt-table__menu-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View details
          </button>
          {isPending && (
            <button type="button" role="menuitem" onClick={() => { onConfirm(appointment.id); setOpen(false); }} className="appt-table__menu-item appt-table__menu-item--confirm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Confirm
            </button>
          )}
          {isConfirmed && (
            <button type="button" role="menuitem" onClick={() => { onComplete(appointment.id); setOpen(false); }} className="appt-table__menu-item appt-table__menu-item--complete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Mark complete
            </button>
          )}
          {!isFinal && (
            <button type="button" role="menuitem" onClick={() => { onCancel(appointment.id); setOpen(false); }} className="appt-table__menu-item appt-table__menu-item--danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: AppointmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No-show' },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface AppointmentTableProps {
  /** Limit rows shown — for dashboard preview pass a small number, omit for full list */
  limit?: number;
}

export function AppointmentTable({ limit }: AppointmentTableProps) {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    type: 'confirm' | 'complete' | 'cancel';
  } | null>(null);

  const { data: appointments, isLoading, isError } = useAppointments();
  const updateMutation = useUpdateAppointment();

  const filtered = useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter((a: Appointment) => {
        const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
        const matchSearch =
          !search ||
          a.client?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.staff?.user?.name?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      })
      .slice(0, limit ?? appointments.length);
  }, [appointments, statusFilter, search, limit]);

  async function handleStatusChange(id: number, newStatus: AppointmentStatus) {
    try {
      await updateMutation.mutateAsync({ id, data: { status: newStatus } });
      addToast({
        type: 'success',
        message: `Appointment ${newStatus.toLowerCase().replace('_', '-')}.`,
      });
    } catch {
      addToast({ type: 'error', message: 'Failed to update appointment. Please try again.' });
    }
    setPendingAction(null);
  }

  const actionLabels: Record<string, { title: string; body: string; status: AppointmentStatus }> = {
    confirm: {
      title: 'Confirm appointment',
      body: 'Mark this appointment as confirmed and notify the client?',
      status: 'CONFIRMED',
    },
    complete: {
      title: 'Mark as completed',
      body: 'Mark this appointment as completed?',
      status: 'COMPLETED',
    },
    cancel: {
      title: 'Cancel appointment',
      body: 'Are you sure you want to cancel this appointment? The client will be notified.',
      status: 'CANCELLED',
    },
  };

  if (isLoading) {
    return (
      <div className="appt-table__state">
        <Spinner size="lg" />
        <p>Loading appointments…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="appt-table__state">
        <p>Unable to load appointments. Please refresh.</p>
      </div>
    );
  }

  return (
    <>
      <div className="appt-table">
        {/* Toolbar — hide if limit preview */}
        {!limit && (
          <div className="appt-table__toolbar">
            <div className="appt-table__search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search client, service, stylist…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search appointments"
                className="appt-table__search"
              />
            </div>

            <div className="appt-table__filters" role="tablist" aria-label="Filter by status">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`appt-table__filter-btn ${statusFilter === f.value ? 'appt-table__filter-btn--active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="appt-table__scroll" role="region" aria-label="Appointments">
          {filtered.length === 0 ? (
            <div className="appt-table__empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p>No appointments found.</p>
            </div>
          ) : (
            <table className="appt-table__table">
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Service</th>
                  <th scope="col">Stylist</th>
                  <th scope="col">Date &amp; Time</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt: Appointment) => (
                  <tr key={appt.id} className="appt-table__row">
                    <td className="appt-table__cell appt-table__cell--client">
                      <span className="appt-table__client-avatar" aria-hidden="true">
                        {appt.client?.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                      <span>{appt.client?.user?.name ?? '—'}</span>
                    </td>
                    <td className="appt-table__cell">{appt.service?.name ?? '—'}</td>
                    <td className="appt-table__cell">{appt.staff?.user?.name ?? 'Unassigned'}</td>
                    <td className="appt-table__cell appt-table__cell--date">
                      <span>{formatDate(appt.date)}</span>
                      <span className="appt-table__time">{formatTime(appt.date)}</span>
                    </td>
                    <td className="appt-table__cell">
                      {appt.service?.price != null ? formatGHS(appt.service.price) : '—'}
                    </td>
                    <td className="appt-table__cell">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="appt-table__cell appt-table__cell--actions">
                      <RowActions
                        appointment={appt}
                        onView={(id) => navigate(`/admin/appointments/${id}`)}
                        onConfirm={(id) => setPendingAction({ id, type: 'confirm' })}
                        onComplete={(id) => setPendingAction({ id, type: 'complete' })}
                        onCancel={(id) => setPendingAction({ id, type: 'cancel' })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {limit && (appointments?.length ?? 0) > limit && (
          <div className="appt-table__view-all">
            <button
              type="button"
              onClick={() => navigate('/admin/appointments')}
              className="btn btn--ghost btn--sm"
            >
              View all appointments →
            </button>
          </div>
        )}
      </div>

      {/* Confirm action modal */}
      {pendingAction && (
        <ConfirmModal
          isOpen
          title={actionLabels[pendingAction.type].title}
          message={actionLabels[pendingAction.type].body}
          confirmLabel={
            pendingAction.type === 'cancel'
              ? 'Cancel appointment'
              : pendingAction.type === 'confirm'
              ? 'Confirm'
              : 'Mark complete'
          }
          variant={pendingAction.type === 'cancel' ? 'danger' : 'primary'}
          isLoading={updateMutation.isPending}
          onConfirm={() =>
            handleStatusChange(pendingAction.id, actionLabels[pendingAction.type].status)
          }
          onClose={() => setPendingAction(null)}
        />
      )}

    
    </>
  );
}