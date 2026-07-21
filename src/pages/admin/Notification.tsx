// pages/admin/NotificationsPage.tsx
import { useMemo } from 'react';
import { useNotifications, useMarkAllRead, useMarkRead, useDeleteNotification } from '../../hooks/useNotifications';
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

// Matches the real NotificationType enum in schema.prisma
// (GENERAL | APPOINTMENT | PAYMENT | PROMOTION | SYSTEM).
const TYPE_ICONS: Record<string, string> = {
  APPOINTMENT: '📅',
  PAYMENT: '💳',
  PROMOTION: '🏷️',
  SYSTEM: '⚙️',
  GENERAL: '🔔',
};

export default function NotificationsPage() {
  const { user } = useAuthContext();
  const { addToast } = useUIStore();
  const { data: notifications, isLoading } = useNotifications(user?.id ?? 0);
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();
  const deleteNotif = useDeleteNotification();

  const unreadIds = useMemo(
    () => (notifications ?? [])
      .filter((n) => !n.read)
      .map((n) => n.id),
    [notifications]
  );

  async function handleMarkAll() {
    try {
      await markAllRead.mutateAsync(user!.id);
      addToast({ type: 'success', message: 'All notifications marked as read.' });
    } catch { addToast({ type: 'error', message: 'Failed to mark all read.' }); }
  }

  async function handleMarkRead(id: number) {
    try { await markRead.mutateAsync(id); }
    catch { addToast({ type: 'error', message: 'Failed to mark as read.' }); }
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
                  onClick={() => handleMarkRead(n.id)}
                  className="notif-item__read-btn"
                  aria-label="Mark as read"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}