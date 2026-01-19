import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  NOTIFICATIONS_QUERY_KEY,
  UNREAD_COUNT_QUERY_KEY,
} from '../useNotifications';
import { createHookWrapper, createTestQueryClient } from '../../test/utils';
import { notificationApi, NotificationListResponse, Notification } from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  notificationApi: {
    list: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

describe('useNotifications hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: 'reservation_request',
      title: 'New Reservation Request',
      message: 'John wants to borrow your drill',
      relatedId: 'res-1',
      isRead: false,
      createdAt: '2025-01-18T10:00:00Z',
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'reservation_approved',
      title: 'Reservation Approved',
      message: 'Your request was approved',
      relatedId: 'res-2',
      isRead: true,
      createdAt: '2025-01-17T10:00:00Z',
    },
  ];

  const mockNotificationListResponse: NotificationListResponse = {
    items: mockNotifications,
    unreadCount: 1,
  };

  describe('useNotifications', () => {
    it('should fetch notifications successfully', async () => {
      vi.mocked(notificationApi.list).mockResolvedValue(mockNotificationListResponse);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useNotifications(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockNotificationListResponse);
      expect(notificationApi.list).toHaveBeenCalledWith(undefined);
    });

    it('should fetch notifications with limit', async () => {
      vi.mocked(notificationApi.list).mockResolvedValue(mockNotificationListResponse);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useNotifications(10), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(notificationApi.list).toHaveBeenCalledWith(10);
    });

    it('should handle error when fetching notifications', async () => {
      vi.mocked(notificationApi.list).mockRejectedValue(new Error('Network error'));

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useNotifications(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useNotifications(undefined, { enabled: false }), {
        wrapper: Wrapper,
      });

      expect(notificationApi.list).not.toHaveBeenCalled();
    });
  });

  describe('useUnreadCount', () => {
    it('should fetch unread count successfully', async () => {
      vi.mocked(notificationApi.getUnreadCount).mockResolvedValue({ count: 5 });

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ count: 5 });
    });

    it('should handle error when fetching unread count', async () => {
      vi.mocked(notificationApi.getUnreadCount).mockRejectedValue(
        new Error('Network error')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useUnreadCount({ enabled: false }), {
        wrapper: Wrapper,
      });

      expect(notificationApi.getUnreadCount).not.toHaveBeenCalled();
    });
  });

  describe('useMarkAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const updatedNotification: Notification = {
        ...mockNotifications[0],
        isRead: true,
      };
      vi.mocked(notificationApi.markAsRead).mockResolvedValue(updatedNotification);

      const queryClient = createTestQueryClient();
      queryClient.setQueryData([...NOTIFICATIONS_QUERY_KEY, { limit: undefined }], mockNotificationListResponse);

      const { Wrapper } = createHookWrapper({ queryClient });
      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: Wrapper,
      });

      result.current.mutate('notif-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(notificationApi.markAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should handle error when marking as read', async () => {
      vi.mocked(notificationApi.markAsRead).mockRejectedValue(
        new Error('Failed to mark as read')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: Wrapper,
      });

      result.current.mutate('notif-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useMarkAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({ success: true });

      const queryClient = createTestQueryClient();
      queryClient.setQueryData([...NOTIFICATIONS_QUERY_KEY, { limit: undefined }], mockNotificationListResponse);

      const { Wrapper } = createHookWrapper({ queryClient });
      const { result } = renderHook(() => useMarkAllAsRead(), {
        wrapper: Wrapper,
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(notificationApi.markAllAsRead).toHaveBeenCalled();
    });

    it('should handle error when marking all as read', async () => {
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(
        new Error('Failed to mark all as read')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useMarkAllAsRead(), {
        wrapper: Wrapper,
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Query keys', () => {
    it('should have correct NOTIFICATIONS_QUERY_KEY', () => {
      expect(NOTIFICATIONS_QUERY_KEY).toEqual(['notifications']);
    });

    it('should have correct UNREAD_COUNT_QUERY_KEY', () => {
      expect(UNREAD_COUNT_QUERY_KEY).toEqual(['notifications', 'unreadCount']);
    });
  });
});
