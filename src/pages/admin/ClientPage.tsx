// pages/admin/ClientsPage.tsx
import { useState, useMemo } from 'react';
import { useClients, useDeleteClient } from '../../hooks/useClients';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { IntakeForm } from '../../components/forms/IntakeForm';
import { useUIStore } from '../../store/uiStore';
import type { Client } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ClientDetailModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [tab, setTab] = useState<'profile' | 'intake' | 'history'>('profile');

  return (
    <Modal open title={client.user?.name ?? 'Client'} onClose={onClose} size="lg">
      <div className="cl-detail">
        {/* Tabs */}
        <div className="cl-detail__tabs" role="tablist">
          {(['profile', 'intake', 'history'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`cl-detail__tab ${tab === t ? 'cl-detail__tab--active' : ''}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="cl-detail__section">
            <div className="cl-detail__row"><span className="cl-detail__key">Email</span><span>{client.user?.email ?? '—'}</span></div>
            <div className="cl-detail__row"><span className="cl-detail__key">Phone</span><span>{client.phone ?? '—'}</span></div>
            <div className="cl-detail__row"><span className="cl-detail__key">Member since</span><span>{client.createdAt ? formatDate(client.createdAt) : '—'}</span></div>
          </div>
        )}

        {tab === 'intake' && (
          <IntakeForm clientId={client.id} defaultValues={{}} onSuccess={onClose} />
        )}

        {tab === 'history' && (
          <div className="cl-detail__history">
            {(!client.bookings || client.bookings.length === 0) ? (
              <p className="cl-detail__empty">No appointment history.</p>
            ) : client.bookings
                ?.map((b) => b.appointment)
                .filter(Boolean)
                .map((a) => (
                  <div key={a!.id} className="cl-detail__hist-row">
                    <span className="cl-detail__hist-service">{a!.service?.name ?? '—'}</span>
                    <span className="cl-detail__hist-date">{formatDate(a!.date)}</span>
                    <span className={`cl-detail__hist-status cl-detail__hist-status--${a!.status.toLowerCase()}`}>{a!.status}</span>
                  </div>
                ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function ClientsPage() {
  const { addToast } = useUIStore();
  const { data: clients, isLoading } = useClients();
  const deleteMutation = useDeleteClient();

  const [search, setSearch] = useState('');
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!clients) return [];
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter((c: Client) =>
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="search"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="cl-page__search"
          aria-label="Search clients"
        />
      </div>

      {isLoading ? (
        <div className="cl-page__state"><Spinner size="lg" /></div>
      ) : (
        <div className="cl-page__grid">
          {filtered.length === 0 ? (
            <p className="cl-page__empty">No clients found.</p>
          ) : filtered.map((c: Client) => {
            const initials = c.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
            return (
              <div key={c.id} className="cl-card">
                <div className="cl-card__avatar">{initials}</div>
                <div className="cl-card__info">
                  <div className="cl-card__name">{c.user?.name ?? '—'}</div>
                  <div className="cl-card__email">{c.user?.email ?? '—'}</div>
                  {c.phone && <div className="cl-card__phone">{c.phone}</div>}
                </div>
                <div className="cl-card__actions">
                  <button type="button" onClick={() => setViewClient(c)} className="btn btn--ghost btn--sm">View</button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(c.id)}
                    className="btn btn--ghost btn--sm cl-card__del-btn"
                    aria-label="Delete client"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewClient && (
        <ClientDetailModal
          client={viewClient}
          onClose={() => setViewClient(null)}
        />
      )}

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
      <style>{`
        .cl-page { display:flex;flex-direction:column;gap:1.5rem;padding:1.75rem 2rem;max-width:1400px;margin:0 auto; }
        .cl-page__header { display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
        .cl-page__title { font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.75rem;font-weight:600;color:var(--color-espresso,#2c1a0e);margin:0; }
        .cl-page__sub { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;color:var(--color-text-muted,#9a8e82);margin:.25rem 0 0; }
        .cl-page__search-wrap { position:relative;display:flex;align-items:center;max-width:400px; }
        .cl-page__search-wrap svg { position:absolute;left:.75rem;color:var(--color-text-muted,#9ca3af);pointer-events:none; }
        .cl-page__search { width:100%;padding:.5625rem 1rem .5625rem 2.25rem;background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:8px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;color:var(--color-text,#1a1108);transition:border-color .15s; }
        .cl-page__search:focus { outline:none;border-color:var(--color-gold,#c9a96e); }
        .cl-page__state { display:flex;justify-content:center;padding:4rem; }
        .cl-page__empty { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9375rem;color:var(--color-text-muted,#9a8e82);text-align:center;padding:3rem; }
        .cl-page__grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem; }
        .cl-card { display:flex;align-items:center;gap:.875rem;padding:1rem 1.25rem;background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:12px;transition:box-shadow .15s; }
        .cl-card:hover { box-shadow:0 4px 16px color-mix(in srgb,var(--color-espresso,#2c1a0e) 7%,transparent); }
        .cl-card__avatar { flex-shrink:0;width:44px;height:44px;border-radius:50%;background:color-mix(in srgb,var(--color-gold,#c9a96e) 18%,var(--color-surface,#faf8f5));display:flex;align-items:center;justify-content:center;font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1rem;font-weight:700;color:var(--color-espresso,#2c1a0e);border:1.5px solid var(--color-border,#e5e0d8); }
        .cl-card__info { flex:1;min-width:0;display:flex;flex-direction:column;gap:.15rem; }
        .cl-card__name { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9375rem;font-weight:600;color:var(--color-espresso,#2c1a0e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .cl-card__email,.cl-card__phone { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;color:var(--color-text-muted,#9a8e82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .cl-card__tag { display:inline-block;margin-top:.25rem;padding:.15rem .5rem;background:color-mix(in srgb,var(--color-gold,#c9a96e) 12%,transparent);border-radius:999px;font-size:.75rem;font-weight:600;color:var(--color-espresso,#2c1a0e); }
        .cl-card__actions { display:flex;gap:.375rem;flex-shrink:0; }
        .cl-card__del-btn { color:#dc2626 !important; }
        /* Detail modal */
        .cl-detail { display:flex;flex-direction:column;gap:1rem; }
        .cl-detail__tabs { display:flex;gap:.25rem;border-bottom:1px solid var(--color-border,#e5e0d8);padding-bottom:0; }
        .cl-detail__tab { padding:.5rem .875rem;border:none;background:transparent;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;font-weight:600;color:var(--color-text-muted,#9a8e82);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s; }
        .cl-detail__tab--active { color:var(--color-espresso,#2c1a0e);border-bottom-color:var(--color-gold,#c9a96e); }
        .cl-detail__section { display:flex;flex-direction:column;gap:.625rem; }
        .cl-detail__row { display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--color-border,#e5e0d8);font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;color:var(--color-text,#1a1108); }
        .cl-detail__key { font-weight:600;color:var(--color-text-muted,#9a8e82); }
        .cl-detail__notes { display:flex;flex-direction:column;gap:.25rem;padding:.625rem 0; }
        .cl-detail__notes p { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;color:var(--color-text,#1a1108);margin:0;line-height:1.5; }
        .cl-detail__empty { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;color:var(--color-text-muted,#9a8e82);text-align:center;padding:2rem; }
        .cl-detail__history { display:flex;flex-direction:column;gap:.5rem; }
        .cl-detail__hist-row { display:flex;align-items:center;justify-content:space-between;padding:.625rem .875rem;background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:8px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem; }
        .cl-detail__hist-service { font-weight:600;color:var(--color-espresso,#2c1a0e); }
        .cl-detail__hist-date { color:var(--color-text-muted,#9a8e82); }
        .cl-detail__hist-status { padding:.2rem .5rem;border-radius:999px;font-size:.75rem;font-weight:600; }
        .cl-detail__hist-status--confirmed { background:color-mix(in srgb,#22c55e 15%,transparent);color:#16a34a; }
        .cl-detail__hist-status--completed { background:color-mix(in srgb,#3b82f6 15%,transparent);color:#1d4ed8; }
        .cl-detail__hist-status--cancelled { background:color-mix(in srgb,#ef4444 15%,transparent);color:#dc2626; }
        .cl-detail__hist-status--pending { background:color-mix(in srgb,#f59e0b 15%,transparent);color:#d97706; }
        .btn { display:inline-flex;align-items:center;gap:.5rem;padding:.6875rem 1.25rem;border-radius:10px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;font-weight:600;cursor:pointer;transition:all .18s;border:none;white-space:nowrap; }
        .btn--ghost { background:transparent;border:1px solid var(--color-border,#e5e0d8);color:var(--color-espresso,#2c1a0e); }
        .btn--ghost:hover { background:var(--color-border,#e5e0d8); }
        .btn--sm { padding:.4375rem .875rem;font-size:.8125rem; }
        @media(max-width:780px){ .cl-page{padding:1.25rem 1rem;} }
      `}</style>
    </div>
  );
}
   
  
