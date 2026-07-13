import { useState, useMemo } from 'react';
import { useClients, useDeleteClient } from '../../hooks/useClients';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useUiStore } from '../../store/uiStore';
import type { Client } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ClientDetailModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [tab, setTab] = useState<'profile' | 'history'>('profile');

  return (
    <Modal open title={client.user?.name ?? 'Client'} onClose={onClose} size="lg">
      <div className="cl-detail">
        <div className="cl-detail__tabs" role="tablist">
          {(['profile', 'history'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`cl-detail__tab ${tab === t ? 'cl-detail__tab--active' : ''}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="cl-detail__section">
            <div className="cl-detail__row">
              <span className="cl-detail__key">Email</span>
              <span>{client.user?.email ?? '—'}</span>
            </div>
            {/* phone lives on Client, not User */}
            <div className="cl-detail__row">
              <span className="cl-detail__key">Phone</span>
              <span>{client.phone ?? '—'}</span>
            </div>
            <div className="cl-detail__row">
              <span className="cl-detail__key">Address</span>
              <span>{client.address ?? '—'}</span>
            </div>
            <div className="cl-detail__row">
              <span className="cl-detail__key">Member since</span>
              <span>{client.createdAt ? formatDate(client.createdAt) : '—'}</span>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="cl-detail__history">
            {/* History via bookings → appointment */}
            {(!client.bookings || client.bookings.length === 0) ? (
              <p className="cl-detail__empty">No appointment history.</p>
            ) : client.bookings.map((b) => (
              <div key={b.id} className="cl-detail__hist-row">
                <span className="cl-detail__hist-service">{b.appointment?.service?.name ?? '—'}</span>
                <span className="cl-detail__hist-date">{formatDate(b.createdAt)}</span>
                <span className={`cl-detail__hist-status cl-detail__hist-status--${b.status.toLowerCase()}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function ClientsPage() {
  const { addToast } = useUiStore();
  const { data: clients, isLoading } = useClients();
  const deleteMutation = useDeleteClient();

  const [search,      setSearch]      = useState('');
  const [viewClient,  setViewClient]  = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!clients) return [];
    if (!search) return clients as Client[];
    const q = search.toLowerCase();
    return (clients as Client[]).filter((c) =>
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      // phone is on Client directly
      c.phone?.includes(q),
    );
  }, [clients, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      addToast({ type: 'success', message: 'Client removed.' });
    } catch {
      addToast({ type: 'error', message: 'Delete failed.' });
    }
    setDeleteTarget(null);
  }

  return (
    <div className="cl-page">
      <div className="cl-page__header">
        <div>
          <h1 className="cl-page__title">Clients</h1>
          <p className="cl-page__sub">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="cl-page__search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="search" placeholder="Search by name, email or phone…" value={search}
          onChange={(e) => setSearch(e.target.value)} className="cl-page__search" aria-label="Search clients" />
      </div>

      {isLoading ? (
        <div className="cl-page__state"><Spinner size="lg" /></div>
      ) : (
        <div className="cl-page__grid">
          {filtered.length === 0 ? (
            <p className="cl-page__empty">No clients found.</p>
          ) : filtered.map((c) => {
            const initials = c.user?.name
              ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
            return (
              <div key={c.id} className="cl-card">
                <div className="cl-card__avatar">{initials}</div>
                <div className="cl-card__info">
                  <div className="cl-card__name">{c.user?.name ?? '—'}</div>
                  <div className="cl-card__email">{c.user?.email ?? '—'}</div>
                  {/* phone is on Client, not User */}
                  {c.phone && <div className="cl-card__phone">{c.phone}</div>}
                </div>
                <div className="cl-card__actions">
                  <button type="button" onClick={() => setViewClient(c)} className="btn btn--ghost btn--sm">View</button>
                  <button type="button" onClick={() => setDeleteTarget(c.id)} className="btn btn--ghost btn--sm cl-card__del-btn" aria-label="Delete client">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewClient && <ClientDetailModal client={viewClient} onClose={() => setViewClient(null)} />}

      {deleteTarget && (
        <ConfirmModal
          open
          title="Remove client"
          message="This will permanently delete the client and all associated data."
          confirmLabel="Delete client"
          danger
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
}