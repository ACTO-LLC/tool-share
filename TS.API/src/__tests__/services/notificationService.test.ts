/**
 * Unit tests for notificationService
 * Tests notification creation and delivery
 */

import * as notificationService from '../../services/notificationService';
import * as dabService from '../../services/dabService';

// Mock dabService
jest.mock('../../services/dabService');
const mockedDabService = dabService as jest.Mocked<typeof dabService>;

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification in database', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'user-123',
        type: 'reservation_request',
        title: 'New Request',
        message: 'Someone wants to borrow your tool',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.createNotification({
        userId: 'user-123',
        type: 'reservation_request',
        title: 'New Request',
        message: 'Someone wants to borrow your tool',
      });

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'user-123',
          type: 'reservation_request',
          title: 'New Request',
          message: 'Someone wants to borrow your tool',
          relatedId: undefined,
        },
        undefined
      );
    });

    it('should include relatedId when provided', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'user-123',
        type: 'reservation_request',
        title: 'New Request',
        message: 'Test message',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.createNotification({
        userId: 'user-123',
        type: 'reservation_request',
        title: 'New Request',
        message: 'Test message',
        relatedId: 'res-456',
      });

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          relatedId: 'res-456',
        }),
        undefined
      );
    });

    it('should not throw when dabService fails', async () => {
      mockedDabService.createNotification.mockRejectedValueOnce(
        new Error('Database error')
      );

      // Should not throw
      await expect(
        notificationService.createNotification({
          userId: 'user-123',
          type: 'reservation_request',
          title: 'Test',
          message: 'Test message',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('notifyReservationRequest', () => {
    it('should create notification for reservation request', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'owner-123',
        type: 'reservation_request',
        title: 'New Reservation Request',
        message: 'John Doe wants to borrow your Power Drill from 2024-02-01 to 2024-02-05.',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.notifyReservationRequest(
        'owner-123',
        'John Doe',
        'Power Drill',
        'res-456',
        '2024-02-01',
        '2024-02-05'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'owner-123',
          type: 'reservation_request',
          title: 'New Reservation Request',
          message: 'John Doe wants to borrow your Power Drill from 2024-02-01 to 2024-02-05.',
          relatedId: 'res-456',
        },
        undefined
      );
    });
  });

  describe('notifyReservationApproved', () => {
    it('should create notification for approved reservation', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'borrower-123',
        type: 'reservation_approved',
        title: 'Reservation Approved',
        message: 'Jane Smith approved your request to borrow Power Drill. Pickup starts 2024-02-01.',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.notifyReservationApproved(
        'borrower-123',
        'Jane Smith',
        'Power Drill',
        'res-456',
        '2024-02-01'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'borrower-123',
          type: 'reservation_approved',
          title: 'Reservation Approved',
          message: 'Jane Smith approved your request to borrow Power Drill. Pickup starts 2024-02-01.',
          relatedId: 'res-456',
        },
        undefined
      );
    });
  });

  describe('notifyReservationDeclined', () => {
    it('should create notification for declined reservation with reason', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'borrower-123',
        type: 'reservation_declined',
        title: 'Reservation Declined',
        message: 'Jane Smith declined your request to borrow Power Drill. Reason: Tool under maintenance',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.notifyReservationDeclined(
        'borrower-123',
        'Jane Smith',
        'Power Drill',
        'res-456',
        'Tool under maintenance'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Jane Smith declined your request to borrow Power Drill. Reason: Tool under maintenance',
        }),
        undefined
      );
    });

    it('should create notification for declined reservation without reason', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'borrower-123',
        type: 'reservation_declined',
        title: 'Reservation Declined',
        message: 'Jane Smith declined your request to borrow Power Drill.',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.notifyReservationDeclined(
        'borrower-123',
        'Jane Smith',
        'Power Drill',
        'res-456'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Jane Smith declined your request to borrow Power Drill.',
        }),
        undefined
      );
    });
  });

  describe('notifyReservationCancelled', () => {
    it('should create notification for cancelled reservation with reason', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'user-123',
        type: 'reservation_cancelled',
        title: 'Reservation Cancelled',
        message: 'John Doe cancelled the reservation for Power Drill. Reason: Plans changed',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.notifyReservationCancelled(
        'user-123',
        'John Doe',
        'Power Drill',
        'res-456',
        'Plans changed'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reservation_cancelled',
          message: 'John Doe cancelled the reservation for Power Drill. Reason: Plans changed',
        }),
        undefined
      );
    });
  });

  describe('notifyPickupReminder', () => {
    it('should create pickup reminder notification', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'user-123',
        type: 'pickup_reminder',
        title: 'Pickup Reminder',
        message: 'Reminder: You are scheduled to pick up Power Drill tomorrow (2024-02-01).',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-01-31T00:00:00Z',
      });

      await notificationService.notifyPickupReminder(
        'user-123',
        'Power Drill',
        'res-456',
        '2024-02-01'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'user-123',
          type: 'pickup_reminder',
          title: 'Pickup Reminder',
          message: 'Reminder: You are scheduled to pick up Power Drill tomorrow (2024-02-01).',
          relatedId: 'res-456',
        },
        undefined
      );
    });
  });

  describe('notifyReturnReminder', () => {
    it('should create return reminder notification', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'user-123',
        type: 'return_reminder',
        title: 'Return Reminder',
        message: 'Reminder: Power Drill is due to be returned tomorrow (2024-02-05).',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-02-04T00:00:00Z',
      });

      await notificationService.notifyReturnReminder(
        'user-123',
        'Power Drill',
        'res-456',
        '2024-02-05'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'user-123',
          type: 'return_reminder',
          title: 'Return Reminder',
          message: 'Reminder: Power Drill is due to be returned tomorrow (2024-02-05).',
          relatedId: 'res-456',
        },
        undefined
      );
    });
  });

  describe('notifyLoanStarted', () => {
    it('should create loan started notification', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'owner-123',
        type: 'loan_started',
        title: 'Tool Picked Up',
        message: 'John Doe has picked up your Power Drill.',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-02-01T10:00:00Z',
      });

      await notificationService.notifyLoanStarted(
        'owner-123',
        'John Doe',
        'Power Drill',
        'res-456'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'owner-123',
          type: 'loan_started',
          title: 'Tool Picked Up',
          message: 'John Doe has picked up your Power Drill.',
          relatedId: 'res-456',
        },
        undefined
      );
    });
  });

  describe('notifyLoanCompleted', () => {
    it('should create loan completed notification', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'owner-123',
        type: 'loan_completed',
        title: 'Tool Returned',
        message: 'John Doe has returned your Power Drill. Please verify condition and leave a review.',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-02-05T16:00:00Z',
      });

      await notificationService.notifyLoanCompleted(
        'owner-123',
        'John Doe',
        'Power Drill',
        'res-456'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'owner-123',
          type: 'loan_completed',
          title: 'Tool Returned',
          message: 'John Doe has returned your Power Drill. Please verify condition and leave a review.',
          relatedId: 'res-456',
        },
        undefined
      );
    });
  });

  describe('notifyReviewReceived', () => {
    it('should create review received notification', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'user-123',
        type: 'review_received',
        title: 'New Review Received',
        message: 'Jane Smith left you a 5-star review.',
        relatedId: 'res-456',
        isRead: false,
        createdAt: '2024-02-06T10:00:00Z',
      });

      await notificationService.notifyReviewReceived(
        'user-123',
        'Jane Smith',
        5,
        'res-456'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        {
          userId: 'user-123',
          type: 'review_received',
          title: 'New Review Received',
          message: 'Jane Smith left you a 5-star review.',
          relatedId: 'res-456',
        },
        undefined
      );
    });
  });

  describe('auth token passing', () => {
    it('should pass auth token to dabService', async () => {
      mockedDabService.createNotification.mockResolvedValueOnce({
        id: 'notif-123',
        userId: 'user-123',
        type: 'reservation_request',
        title: 'Test',
        message: 'Test',
        isRead: false,
        createdAt: '2024-01-15T00:00:00Z',
      });

      await notificationService.notifyReservationRequest(
        'owner-123',
        'John',
        'Drill',
        'res-123',
        '2024-02-01',
        '2024-02-05',
        'auth-token-123'
      );

      expect(mockedDabService.createNotification).toHaveBeenCalledWith(
        expect.any(Object),
        'auth-token-123'
      );
    });
  });
});
