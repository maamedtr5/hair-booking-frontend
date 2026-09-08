import apiClient from '../utils/apiClient';
import type { ApiResponse, AppNotification } from '../types/models';

export async function getNotificationsByUser(userId: number): Promise<AppNotification[]> {
  const { data } = await apiClient.get<ApiResponse<AppNotification[]>>(`/notifications/user/${userId}`);
  return data.data ?? [];
}

export async function getAllNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<ApiResponse<AppNotification[]>>('/notifications');
  return data.data ?? [];
}

/** PUT /notifications/:id — mark single notification read. Schema field is `read`, not `isRead`. */
export async function markNotificationRead(id: number): Promise<AppNotification> {
  const { data } = await apiClient.put<ApiResponse<AppNotification>>(`/notifications/${id}`, { read: true });
  return data.data!;
}

/** PUT /notifications/bulk-mark-read — backend expects `ids`, not `notificationIds`. */
export async function bulkMarkRead(notificationIds: number[]): Promise<void> {
  await apiClient.put('/notifications/bulk-mark-read', { ids: notificationIds });
}

export async function markAllReadForUser(userId: number): Promise<void> {
  await apiClient.put(`/notifications/user/${userId}/mark-all-read`);
}

export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}