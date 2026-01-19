import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, Notification, NotificationListResponse } from '../services/api';

/**
 * Query key for notifications
 */
export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

/**
 * Query key for unread count
 */
export const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unreadCount'] as const;

/**
 * Hook to fetch notifications
 */
export function useNotifications(limit?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, { limit }],
    queryFn: () => notificationApi.list(limit),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: notificationApi.getUnreadCount,
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: (updatedNotification) => {
      // Optimistically update the notifications list
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n) =>
              n.id === updatedNotification.id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, old.unreadCount - 1),
          };
        }
      );
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      // Update all notifications to read
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: NOTIFICATIONS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          };
        }
      );
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
