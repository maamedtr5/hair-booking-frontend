import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../api/notifications';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

export const notificationKeys = {
  all: ['notifications'] as const,
  byUser: (userId: number) => ['notifications', 'user', userId] as const,
};

/** Fetch notifications for the current user — polls every 30 seconds */
export function useNotifications(userId: number) {
  return useQuery({
    queryKey: notificationKeys.byUser(userId),
    queryFn: () => notificationsApi.getNotificationsByUser(userId),
    enabled: !!userId,
    refetchInterval: 30_000, // Poll every 30 seconds for new notifications
    staleTime: 15_000,
  });
}

export function useUnreadCount(userId: number) {
  const { data: notifications } = useNotifications(userId);
  return notifications?.filter((n) => !n.read).length ?? 0;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useBulkMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => notificationsApi.bulkMarkRead(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => notificationsApi.markAllReadForUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('All notifications marked as read');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}