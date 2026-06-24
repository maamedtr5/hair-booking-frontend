// pages/admin/NotificationsPage.tsx
import { useMemo } from 'react';
import { useNotifications, useMarkAllRead, useBulkMarkRead, useDeleteNotification } from '../../hooks/useNotifications';
import { useAuthContext } from '../../hooks/useAuthcontext';
import { Spinner } from '../../components/ui/Spinner';
import { useUIStore } from '../../store/uiStore';
import type { AppNotification } from '../../types/models';


function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' });
}

const TYPE_ICONS: Record<string, string> = {
  APPOINTMENT_REMINDER: '📅',
  APPOINTMENT_CONFIRMED: '✅',
  APPOINTMENT_CANCELLED: '❌',
  PAYMENT_RECEIVED: '💳',
  NEW_BOOKING: '🆕',
};

export default function NotificationsPage() {
  const { user } = useAuthContext();
  const { addToast } = useUIStore();
  const { data: notifications, isLoading } =useNotifications(user?.id ?? 0);
  const markAllRead = useMarkAllRead();
  const bulkMarkRead = useBulkMarkRead();
  const deleteNotif = useDeleteNotification();

  const unreadIds = useMemo(
    () => (notifications ?? [])
  .filter((n) => !n.read)
  .map((n) => n.id),
[notifications]
  )
  async function handleMarkAll() {
    try {
      await markAllRead.mutateAsync(user!.id);
      addToast({ type: 'success', message: 'All notifications marked as read.' });
    } catch { addToast({ type: 'error', message: 'Failed to mark all read.' }); }
  }

  async function handleDelete(id: number) {
    try { await deleteNotif.mutateAsync(id); }
    catch { addToast({ type: 'error', message: 'Delete failed.' }); }
  }

  return (
    <div className="notif-page">
      <div className="notif-page__header">
        <div>
          <h1 className="notif-page__title">Notifications</h1>
          <p className="notif-page__sub">{unreadIds.length} unread</p>
        </div>
        {unreadIds.length > 0 && (
          <button type="button" onClick={handleMarkAll} disabled={markAllRead.isPending} className="btn btn--ghost btn--sm">
            {markAllRead.isPending ? <Spinner size="sm" /> : null} Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="notif-page__state"><Spinner size="lg" /></div>
      ) : (notifications ?? []).length === 0 ? (
        <div className="notif-page__empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <p>You're all caught up.</p>
        </div>
      ) : (


    <div className="notif-list">
  {(notifications ?? []).map((n) => (
    <div
      key={n.id}
      className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}
    >
    <span className="notif-item__icon" aria-hidden="true">
  {TYPE_ICONS[(n as AppNotification).type] ?? '🔔'}
</span>
<div className="notif-item__body">
  <p className="notif-item__message">{n.message}</p>
  <span className="notif-item__time">{timeAgo((n as AppNotification).createdAt)}</span>
</div>


      {!n.read && (
        <button
          type="button"
          onClick={() => bulkMarkRead.mutateAsync([n.id])}
          className="notif-item__read-btn"
          aria-label="Mark as read"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={() => handleDelete(n.id)}
        className="notif-item__del-btn"
        aria-label="Delete notification"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  ))}
    </div>
      )}

      <style>{`
        .notif-page{display:flex;flex-direction:column;gap:1.5rem;padding:1.75rem 2rem;max-width:700px;margin:0 auto}
        .notif-page__header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem}
        .notif-page__title{font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.75rem;font-weight:600;color:var(--color-espresso,#2c1a0e);margin:0}
        .notif-page__sub{font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;color:var(--color-text-muted,#9a8e82);margin:.25rem 0 0}
        .notif-page__state,.notif-page__empty{display:flex;flex-direction:column;align-items:center;gap:.75rem;padding:4rem;color:var(--color-text-muted,#9a8e82);font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9375rem}
        .notif-list{display:flex;flex-direction:column;gap:.5rem}
        .notif-item{display:flex;align-items:flex-start;gap:.875rem;padding:1rem 1.25rem;background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:12px;transition:background .12s}
        .notif-item--unread{border-left:3px solid var(--color-gold,#c9a96e);background:color-mix(in srgb,var(--color-gold,#c9a96e) 4%,var(--color-surface,#faf8f5))}
        .notif-item__icon{font-size:1.25rem;flex-shrink:0;margin-top:.1rem}
        .notif-item__body{flex:1;min-width:0;display:flex;flex-direction:column;gap:.25rem}
        .notif-item__message{font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;color:var(--color-text,#1a1108);margin:0;line-height:1.5}
        .notif-item--unread .notif-item__message{font-weight:500}
        .notif-item__time{font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;color:var(--color-text-muted,#9a8e82)}
        .notif-item__read-btn,.notif-item__del-btn{flex-shrink:0;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;border-radius:6px;cursor:pointer;color:var(--color-text-muted,#9a8e82);transition:background .12s,color .12s}
        .notif-item__read-btn:hover{background:color-mix(in srgb,#22c55e 15%,transparent);color:#16a34a}
        .notif-item__del-btn:hover{background:color-mix(in srgb,#ef4444 15%,transparent);color:#dc2626}
        .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.6875rem 1.25rem;border-radius:10px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;font-weight:600;cursor:pointer;transition:all .18s;border:none;white-space:nowrap}
        .btn--ghost{background:transparent;border:1px solid var(--color-border,#e5e0d8);color:var(--color-espresso,#2c1a0e)}
        .btn--ghost:hover{background:var(--color-border,#e5e0d8)}
        .btn--sm{padding:.4375rem .875rem;font-size:.8125rem}
        @media(max-width:780px){.notif-page{padding:1.25rem 1rem}}
      `}</style>
    </div>
  );
}