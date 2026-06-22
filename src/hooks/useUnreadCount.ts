import { useNotifications } from './useNotifications';
import type { AppNotification } from '../types/models';

/**
 * Custom hook to compute unread notifications count for a user.
 * @param userId number - the current user's ID
 * @returns number - unread notifications count
 */
export function useUnreadCount(userId: number) {
  const { data: notifications } = useNotifications(userId);

  return notifications?.filter((n: AppNotification) => !n.read).length ?? 0;
}
