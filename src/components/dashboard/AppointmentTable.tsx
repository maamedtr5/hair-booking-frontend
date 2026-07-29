import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments, useUpdateAppointment } from '../../hooks/useAppointments';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../ui/Pagination';
import { StatusBadge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { ConfirmModal } from '../ui/Modal';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { useUiStore } from '../../store/uiStore';
import type { Appointment, AppointmentStatus } from '../../types';
 
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatGHS(value: number): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
}

interface RowActionsProps {
  appointment: Appointment;
  onConfirm: (id: number) => void;
  onComplete: (id: number) => void;
  onCancel: (id: number) => void;
  onView: (id: number) => void;
}

function RowActions({ appointment, onConfirm, onComplete, onCancel, onView }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const isPending   = appointment.status === 'PENDING';
  const isConfirmed = appointment.status === 'CONFIRMED';
  // RESCHEDULED is valid — treat same as confirmed for action purposes
  const isFinal = appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED';

  return (
    <div className="appt-table__actions" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        aria-label={`Actions for appointment ${appointment.id}`} className="appt-table__action-trigger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="appt-table__action-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { onView(appointment.id); setOpen(false); }} className="appt-table__menu-item">
            View details
          </button>
          {isPending && (
            <button type="button" role="menuitem" onClick={() => { onConfirm(appointment.id); setOpen(false); }} className="appt-table__menu-item appt-table__menu-item--confirm">
              Confirm
            </button>
          )}
          {(isConfirmed || appointment.status === 'RESCHEDULED') && (
            <button type="button" role="menuitem" onClick={() => { onComplete(appointment.id); setOpen(false); }} className="appt-table__menu-item appt-table__menu-item--complete">
              Mark complete
            </button>
          )}
          {!isFinal && (
            <button type="button" role="menuitem" onClick={() => { onCancel(appointment.id); setOpen(false); }} className="appt-table__menu-item appt-table__menu-item--danger">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// NO_SHOW removed — does not exist in schema
const STATUS_FILTERS: { value: AppointmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'All' },
  { value: 'PENDING',     label: 'Pending' },
  { value: 'CONFIRMED',   label: 'Confirmed' },
  { value: 'COMPLETED',   label: 'Completed' },
  { value: 'CANCELLED',   label: 'Cancelled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
];

interface AppointmentTableProps { limit?: number; }

export function AppointmentTable({ limit }: AppointmentTableProps) {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState<{ id: number; type: 'confirm' | 'complete' | 'cancel' } | null>(null);
  const [viewAppointmentId, setViewAppointmentId] = useState<number | null>(null);

  const { data: appointments, isLoading, isError } = useAppointments();
  const updateMutation = useUpdateAppointment();

  // Always look the viewed appointment up in the live query data by id,
  // rather than holding onto the row object captured at click-time. A
  // snapshotted object goes stale the moment a mutation (status change,
  // manual payment) invalidates and refetches the list — the modal would
  // keep showing the old status/payment even though the save worked.
  const viewAppointment = viewAppointmentId != null
    ? appointments?.find((a: Appointment) => a.id === viewAppointmentId) ?? null
    : null;

  const filtered = useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter((a: Appointment) => {
        const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
        // Client is on appointment.booking.client (not directly on appointment)
        const clientName = a.booking?.client?.user?.name?.toLowerCase() ?? '';
        const matchSearch =
          !search ||
          clientName.includes(search.toLowerCase()) ||
          a.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.staff?.user?.name?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      })
      .slice(0, limit ?? appointments.length);
  }, [appointments, statusFilter, search, limit]);

  const pagination = usePagination(filtered, 10);
  // The dashboard widget passes `limit` and renders every filtered row
  // directly (it's already a short "recent appointments" list); only the
  // full admin table (no `limit`) actually paginates.
  const rows = limit ? filtered : pagination.pageItems;

  async function handleStatusChange(id: number, newStatus: AppointmentStatus) {
    try {
      await updateMutation.mutateAsync({ id, payload: { status: newStatus } });
      addToast({ type: 'success', message: `Appointment ${newStatus.toLowerCase()}.` });
    } catch {
      addToast({ type: 'error', message: 'Failed to update appointment.' });
    }
    setPendingAction(null);
  }

  const actionLabels: Record<string, { title: string; body: string; status: AppointmentStatus }> = {
    confirm:  { title: 'Confirm appointment',  body: 'Mark this appointment as confirmed?',                                             status: 'CONFIRMED' },
    complete: { title: 'Mark as completed',    body: 'Mark this appointment as completed?',                                             status: 'COMPLETED' },
    cancel:   { title: 'Cancel appointment',   body: 'Are you sure you want to cancel? The client will be notified.', status: 'CANCELLED' },
  };

  if (isLoading) return <div className="appt-table__state"><Spinner size="lg" /><p>Loading appointments…</p></div>;
  if (isError)   return <div className="appt-table__state"><p>Unable to load appointments. Please refresh.</p></div>;

  return (
    <>
      <div className="appt-table">
        {!limit && (
          <div className="appt-table__toolbar">
            <div className="appt-table__search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="search" placeholder="Search client, service, stylist…" value={search}
                onChange={(e) => setSearch(e.target.value)} aria-label="Search appointments" className="appt-table__search" />
            </div>
            <div className="appt-table__filters" role="tablist" aria-label="Filter by status">
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} type="button" role="tab" aria-selected={statusFilter === f.value}
                  onClick={() => setStatusFilter(f.value as AppointmentStatus | 'ALL')}
                  className={`appt-table__filter-btn ${statusFilter === f.value ? 'appt-table__filter-btn--active' : ''}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="appt-table__scroll" role="region" aria-label="Appointments">
          {filtered.length === 0 ? (
            <div className="appt-table__empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
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
                {rows.map((appt: Appointment) => {
                  // Client lives at appointment.booking.client
                  const clientName = appt.booking?.client?.user?.name;
                  return (
                    <tr key={appt.id} className="appt-table__row">
                      <td className="appt-table__cell appt-table__cell--client">
                        <span className="appt-table__client-avatar" aria-hidden="true">
                          {clientName?.charAt(0)?.toUpperCase() ?? '?'}
                        </span>
                        <span>{clientName ?? '—'}</span>
                      </td>
                      <td className="appt-table__cell">{appt.service?.name ?? '—'}</td>
                      <td className="appt-table__cell">
                        {appt.staff?.user?.name ?? (
                          appt.status === 'CONFIRMED'
                            ? <span className="appt-table__queued">Open to claim</span>
                            : 'Unassigned'
                        )}
                      </td>
                      <td className="appt-table__cell appt-table__cell--date">
                        <span>{formatDate(appt.date)}</span>
                        <span className="appt-table__time">{formatTime(appt.date)}</span>
                      </td>
                      <td className="appt-table__cell">
                        {appt.service?.price != null ? formatGHS(appt.service.price) : '—'}
                      </td>
                      <td className="appt-table__cell"><StatusBadge status={appt.status} /></td>
                      <td className="appt-table__cell appt-table__cell--actions">
                        <RowActions
                          appointment={appt}
                          onView={() => setViewAppointmentId(appt.id)}
                          onConfirm={(id) => setPendingAction({ id, type: 'confirm' })}
                          onComplete={(id) => setPendingAction({ id, type: 'complete' })}
                          onCancel={(id) => setPendingAction({ id, type: 'cancel' })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!limit && filtered.length > 0 && (
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={pagination.setPage}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
          />
        )}

        {limit && (appointments?.length ?? 0) > limit && (
          <div className="appt-table__view-all">
            <button type="button" onClick={() => navigate('/dashboard/appointments')} className="btn btn--ghost btn--sm">
              View all appointments →
            </button>
          </div>
        )}
      </div>

      {viewAppointment && (
        <AppointmentDetailModal appointment={viewAppointment} onClose={() => setViewAppointmentId(null)} />
      )}

      {pendingAction && (
        <ConfirmModal
          open
          title={actionLabels[pendingAction.type].title}
          message={actionLabels[pendingAction.type].body}
          confirmLabel={pendingAction.type === 'cancel' ? 'Cancel appointment' : pendingAction.type === 'confirm' ? 'Confirm' : 'Mark complete'}
          danger={pendingAction.type === 'cancel'}
          loading={updateMutation.isPending}
          onConfirm={() => handleStatusChange(pendingAction.id, actionLabels[pendingAction.type].status)}
          onClose={() => setPendingAction(null)}
        />
      )}
    </>
  );
}