/**
 * Unit tests for reservationsController
 * Tests reservation lifecycle operations
 */

import { ReservationsController, NotificationsController } from '../../routes/reservationsController';
import * as dabService from '../../services/dabService';
import * as notificationService from '../../services/notificationService';
import { Request as ExpressRequest } from 'express';

// Mock dependencies
jest.mock('../../services/dabService');
jest.mock('../../services/notificationService');
jest.mock('../../services/blobStorageService');

const mockedDabService = dabService as jest.Mocked<typeof dabService>;
const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>;

// Helper to create mock request
function createMockRequest(overrides: Partial<ExpressRequest> = {}): ExpressRequest {
  return {
    user: {
      id: 'ext-user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    headers: {
      authorization: 'Bearer mock-token',
    },
    ...overrides,
  } as unknown as ExpressRequest;
}

// Mock user factory
function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    externalId: 'ext-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    reputationScore: 4.0,
    subscriptionStatus: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock tool factory
function createMockTool(overrides = {}) {
  return {
    id: 'tool-123',
    ownerId: 'owner-123',
    name: 'Power Drill',
    category: 'Power Tools',
    status: 'available' as const,
    advanceNoticeDays: 1,
    maxLoanDays: 14,
    createdAt: '2024-01-01T00:00:00Z',
    owner: {
      id: 'owner-123',
      externalId: 'ext-owner',
      displayName: 'Tool Owner',
      email: 'owner@example.com',
      subscriptionStatus: 'active',
      reputationScore: 4.0,
      createdAt: '2024-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

// Mock reservation factory
function createMockReservation(overrides = {}) {
  return {
    id: 'res-123',
    toolId: 'tool-123',
    borrowerId: 'borrower-123',
    status: 'pending',
    startDate: '2024-06-20',
    endDate: '2024-06-25',
    createdAt: '2024-06-15T12:00:00Z',
    tool: createMockTool(),
    borrower: { id: 'borrower-123', displayName: 'Borrower' },
    ...overrides,
  };
}

describe('ReservationsController', () => {
  let controller: ReservationsController;

  beforeEach(() => {
    controller = new ReservationsController();
    jest.clearAllMocks();
    // Mock current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createReservation', () => {
    it('should create reservation successfully', async () => {
      const mockUser = createMockUser({ id: 'borrower-123' });
      const mockTool = createMockTool();
      const mockReservation = createMockReservation();

      mockedDabService.getToolById.mockResolvedValueOnce(mockTool as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);
      mockedDabService.checkDateConflicts.mockResolvedValueOnce(false);
      mockedDabService.createReservation.mockResolvedValueOnce(mockReservation as any);
      mockedNotificationService.notifyReservationRequest.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      const result = await controller.createReservation(request, {
        toolId: 'tool-123',
        startDate: '2024-06-20',
        endDate: '2024-06-25',
      });

      expect(result.id).toBe('res-123');
      expect(result.status).toBe('pending');
      expect(mockedNotificationService.notifyReservationRequest).toHaveBeenCalled();
    });

    it('should reject past start date', async () => {
      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'tool-123',
          startDate: '2024-06-10', // Past date
          endDate: '2024-06-15',
        })
      ).rejects.toThrow('Start date cannot be in the past');
    });

    it('should reject end date before start date', async () => {
      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'tool-123',
          startDate: '2024-06-25',
          endDate: '2024-06-20',
        })
      ).rejects.toThrow('End date must be after start date');
    });

    it('should reject tool not found', async () => {
      mockedDabService.getToolById.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'nonexistent',
          startDate: '2024-06-20',
          endDate: '2024-06-25',
        })
      ).rejects.toThrow('Tool not found');
    });

    it('should reject unavailable tool', async () => {
      const mockTool = createMockTool({ status: 'unavailable' as const });
      mockedDabService.getToolById.mockResolvedValueOnce(mockTool as any);

      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'tool-123',
          startDate: '2024-06-20',
          endDate: '2024-06-25',
        })
      ).rejects.toThrow('Tool is not available');
    });

    it('should reject reserving own tool', async () => {
      const mockUser = createMockUser({ id: 'owner-123' }); // Same as tool owner
      const mockTool = createMockTool();

      mockedDabService.getToolById.mockResolvedValueOnce(mockTool as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'tool-123',
          startDate: '2024-06-20',
          endDate: '2024-06-25',
        })
      ).rejects.toThrow('You cannot reserve your own tool');
    });

    it('should enforce advance notice requirement', async () => {
      const mockUser = createMockUser({ id: 'borrower-123' });
      const mockTool = createMockTool({ advanceNoticeDays: 7 }); // Requires 7 days notice

      mockedDabService.getToolById.mockResolvedValueOnce(mockTool as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'tool-123',
          startDate: '2024-06-18', // Only 3 days away
          endDate: '2024-06-25',
        })
      ).rejects.toThrow('at least 7 day(s) advance notice');
    });

    it('should enforce max loan duration', async () => {
      const mockUser = createMockUser({ id: 'borrower-123' });
      const mockTool = createMockTool({ maxLoanDays: 7 }); // Max 7 days

      mockedDabService.getToolById.mockResolvedValueOnce(mockTool as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'tool-123',
          startDate: '2024-06-20',
          endDate: '2024-07-05', // 16 days
        })
      ).rejects.toThrow('Maximum loan duration');
    });

    it('should reject conflicting dates', async () => {
      const mockUser = createMockUser({ id: 'borrower-123' });
      const mockTool = createMockTool();

      mockedDabService.getToolById.mockResolvedValueOnce(mockTool as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);
      mockedDabService.checkDateConflicts.mockResolvedValueOnce(true);

      const request = createMockRequest();

      await expect(
        controller.createReservation(request, {
          toolId: 'tool-123',
          startDate: '2024-06-20',
          endDate: '2024-06-25',
        })
      ).rejects.toThrow('conflict with an existing reservation');
    });
  });

  describe('getReservations', () => {
    it('should return user reservations', async () => {
      const mockUser = createMockUser();
      const mockReservations = [createMockReservation()];

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);
      mockedDabService.getReservationsByBorrower.mockResolvedValueOnce(mockReservations as any);
      mockedDabService.getReservationsForOwner.mockResolvedValueOnce([]);

      const request = createMockRequest();
      const result = await controller.getReservations(request);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getReservation', () => {
    it('should return reservation for borrower', async () => {
      const mockUser = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation();

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getReservation(request, 'res-123');

      expect(result.id).toBe('res-123');
    });

    it('should return reservation for tool owner', async () => {
      const mockUser = createMockUser({ id: 'owner-123' });
      const mockReservation = createMockReservation({
        tool: { ...createMockTool(), ownerId: 'owner-123' },
      });

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getReservation(request, 'res-123');

      expect(result.id).toBe('res-123');
    });

    it('should reject unauthorized access', async () => {
      const mockUser = createMockUser({ id: 'other-user' });
      const mockReservation = createMockReservation();

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();

      await expect(
        controller.getReservation(request, 'res-123')
      ).rejects.toThrow('Not authorized to view');
    });
  });

  describe('approveReservation', () => {
    it('should approve pending reservation', async () => {
      const mockOwner = createMockUser({ id: 'owner-123' });
      const mockReservation = createMockReservation({
        tool: { ...createMockTool(), ownerId: 'owner-123' },
      });
      const updatedReservation = { ...mockReservation, status: 'confirmed' };

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockOwner as any);
      mockedDabService.checkDateConflicts.mockResolvedValueOnce(false);
      mockedDabService.updateReservation.mockResolvedValueOnce(updatedReservation as any);
      mockedNotificationService.notifyReservationApproved.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      const result = await controller.approveReservation(request, 'res-123');

      expect(result.status).toBe('confirmed');
      expect(mockedNotificationService.notifyReservationApproved).toHaveBeenCalled();
    });

    it('should reject non-owner approval', async () => {
      const mockUser = createMockUser({ id: 'not-owner' });
      const mockReservation = createMockReservation({
        tool: { ...createMockTool(), ownerId: 'owner-123' },
      });

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();

      await expect(
        controller.approveReservation(request, 'res-123')
      ).rejects.toThrow('Only the tool owner can approve');
    });

    it('should reject non-pending reservation', async () => {
      const mockOwner = createMockUser({ id: 'owner-123' });
      const mockReservation = createMockReservation({
        status: 'confirmed',
        tool: { ...createMockTool(), ownerId: 'owner-123' },
      });

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockOwner as any);

      const request = createMockRequest();

      await expect(
        controller.approveReservation(request, 'res-123')
      ).rejects.toThrow('Cannot approve a reservation with status');
    });
  });

  describe('declineReservation', () => {
    it('should decline pending reservation', async () => {
      const mockOwner = createMockUser({ id: 'owner-123' });
      const mockReservation = createMockReservation({
        tool: { ...createMockTool(), ownerId: 'owner-123' },
      });
      const updatedReservation = { ...mockReservation, status: 'declined' };

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockOwner as any);
      mockedDabService.updateReservation.mockResolvedValueOnce(updatedReservation as any);
      mockedNotificationService.notifyReservationDeclined.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      const result = await controller.declineReservation(request, 'res-123', {
        reason: 'Not available',
      });

      expect(result.status).toBe('declined');
      expect(mockedNotificationService.notifyReservationDeclined).toHaveBeenCalled();
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation by borrower', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation();
      const updatedReservation = { ...mockReservation, status: 'cancelled' };

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);
      mockedDabService.updateReservation.mockResolvedValueOnce(updatedReservation as any);

      const request = createMockRequest();
      const result = await controller.cancelReservation(request, 'res-123');

      expect(result.status).toBe('cancelled');
    });

    it('should reject cancelling completed reservation', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation({ status: 'completed' });

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);

      const request = createMockRequest();

      await expect(
        controller.cancelReservation(request, 'res-123')
      ).rejects.toThrow('Cannot cancel a reservation with status');
    });
  });

  describe('confirmPickup', () => {
    it('should confirm pickup with before photos', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation({
        status: 'confirmed',
        tool: { ...createMockTool(), owner: { id: 'owner-123', displayName: 'Owner' } },
      });
      const updatedReservation = { ...mockReservation, status: 'active' };

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);
      mockedDabService.getLoanPhotosByType.mockResolvedValueOnce([
        { id: 'photo-1', type: 'before', url: 'http://example.com/photo.jpg' },
      ] as any);
      mockedDabService.updateReservation.mockResolvedValueOnce(updatedReservation as any);
      mockedNotificationService.notifyLoanStarted.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      const result = await controller.confirmPickup(request, 'res-123');

      expect(result.status).toBe('active');
      expect(mockedNotificationService.notifyLoanStarted).toHaveBeenCalled();
    });

    it('should reject pickup without before photos', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation({ status: 'confirmed' });

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);
      mockedDabService.getLoanPhotosByType.mockResolvedValueOnce([]);

      const request = createMockRequest();

      await expect(
        controller.confirmPickup(request, 'res-123')
      ).rejects.toThrow('At least one "before" photo is required');
    });
  });

  describe('confirmReturn', () => {
    it('should confirm return with after photos', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation({
        status: 'active',
        tool: { ...createMockTool(), owner: { id: 'owner-123', displayName: 'Owner' } },
      });
      const updatedReservation = { ...mockReservation, status: 'completed' };

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);
      mockedDabService.getLoanPhotosByType.mockResolvedValueOnce([
        { id: 'photo-1', type: 'after', url: 'http://example.com/photo.jpg' },
      ] as any);
      mockedDabService.updateReservation.mockResolvedValueOnce(updatedReservation as any);
      mockedNotificationService.notifyLoanCompleted.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      const result = await controller.confirmReturn(request, 'res-123');

      expect(result.status).toBe('completed');
      expect(mockedNotificationService.notifyLoanCompleted).toHaveBeenCalled();
    });
  });

  describe('createReview', () => {
    it('should create review for completed reservation', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation({
        status: 'completed',
        tool: { ...createMockTool(), ownerId: 'owner-123' },
      });
      const mockReview = {
        id: 'review-123',
        reservationId: 'res-123',
        reviewerId: 'borrower-123',
        revieweeId: 'owner-123',
        rating: 5,
        comment: 'Great tool!',
        createdAt: '2024-06-25T00:00:00Z',
      };

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);
      mockedDabService.getReviewForReservation.mockResolvedValueOnce(null);
      mockedDabService.createReview.mockResolvedValueOnce(mockReview as any);
      mockedDabService.updateUserReputationScore.mockResolvedValueOnce(undefined as any);
      mockedDabService.getUserById.mockResolvedValueOnce(mockBorrower as any);
      mockedNotificationService.notifyReviewReceived.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      const result = await controller.createReview(request, 'res-123', {
        rating: 5,
        comment: 'Great tool!',
      });

      expect(result.rating).toBe(5);
      expect(mockedDabService.updateUserReputationScore).toHaveBeenCalledWith('owner-123', 'mock-token');
    });

    it('should reject invalid rating', async () => {
      const request = createMockRequest();

      await expect(
        controller.createReview(request, 'res-123', {
          rating: 6, // Invalid
        })
      ).rejects.toThrow('Rating must be an integer between 1 and 5');
    });

    it('should reject review for non-completed reservation', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation({ status: 'active' });

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);

      const request = createMockRequest();

      await expect(
        controller.createReview(request, 'res-123', { rating: 5 })
      ).rejects.toThrow('Reviews can only be submitted for completed reservations');
    });

    it('should reject duplicate review', async () => {
      const mockBorrower = createMockUser({ id: 'borrower-123' });
      const mockReservation = createMockReservation({
        status: 'completed',
        tool: { ...createMockTool(), ownerId: 'owner-123' },
      });
      const existingReview = {
        id: 'review-existing',
        reservationId: 'res-123',
        reviewerId: 'borrower-123',
        revieweeId: 'owner-123',
        rating: 4,
        createdAt: '2024-06-24T00:00:00Z',
      };

      mockedDabService.getReservationById.mockResolvedValueOnce(mockReservation as any);
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockBorrower as any);
      mockedDabService.getReviewForReservation.mockResolvedValueOnce(existingReview as any);

      const request = createMockRequest();

      await expect(
        controller.createReview(request, 'res-123', { rating: 5 })
      ).rejects.toThrow('You have already submitted a review');
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockUser = createMockUser();
      const mockStats = {
        toolsListed: 5,
        activeLoans: 2,
        pendingRequests: 3,
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);
      mockedDabService.getDashboardStats.mockResolvedValueOnce(mockStats);

      const request = createMockRequest();
      const result = await controller.getDashboardStats(request);

      expect(result.toolsListed).toBe(5);
      expect(result.activeLoans).toBe(2);
      expect(result.pendingRequests).toBe(3);
    });

    it('should return zeros when user not found', async () => {
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const result = await controller.getDashboardStats(request);

      expect(result).toEqual({
        toolsListed: 0,
        activeLoans: 0,
        pendingRequests: 0,
      });
    });
  });
});

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(() => {
    controller = new NotificationsController();
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const mockUser = createMockUser();
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-123',
          type: 'reservation_request',
          title: 'New Request',
          message: 'Someone wants to borrow your tool',
          isRead: false,
          createdAt: '2024-06-15T00:00:00Z',
        },
      ];

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);
      mockedDabService.getNotificationsForUser.mockResolvedValueOnce(mockNotifications as any);
      mockedDabService.getUnreadNotificationCount.mockResolvedValueOnce(1);

      const request = createMockRequest();
      const result = await controller.getNotifications(request);

      expect(result.items).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const mockUser = createMockUser();

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);
      mockedDabService.getUnreadNotificationCount.mockResolvedValueOnce(5);

      const request = createMockRequest();
      const result = await controller.getUnreadCount(request);

      expect(result.count).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = {
        id: 'notif-1',
        userId: 'user-123',
        type: 'reservation_request',
        title: 'Test',
        message: 'Test',
        isRead: true,
        createdAt: '2024-06-15T00:00:00Z',
      };

      mockedDabService.markNotificationAsRead.mockResolvedValueOnce(updatedNotification as any);

      const request = createMockRequest();
      const result = await controller.markAsRead(request, 'notif-1');

      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockUser = createMockUser();

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);
      mockedDabService.markAllNotificationsAsRead.mockResolvedValueOnce(undefined as any);

      const request = createMockRequest();
      const result = await controller.markAllAsRead(request);

      expect(result.success).toBe(true);
    });
  });
});
