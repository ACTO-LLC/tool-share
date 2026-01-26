/**
 * Unit tests for usersController
 * Tests user profile endpoints
 */

import { UsersController } from '../../routes/usersController';
import * as dabService from '../../services/dabService';
import { Request as ExpressRequest } from 'express';

// Mock dabService
jest.mock('../../services/dabService');
const mockedDabService = dabService as jest.Mocked<typeof dabService>;

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

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(() => {
    controller = new UsersController();
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return existing user profile', async () => {
      const mockUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        phone: '555-1234',
        avatarUrl: 'http://example.com/avatar.jpg',
        bio: 'Test bio',
        streetAddress: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        reputationScore: 4.5,
        notifyEmail: true,
        subscriptionStatus: 'active',
        subscriptionEndsAt: '2025-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
      };

      mockedDabService.getOrCreateUser.mockResolvedValueOnce(mockUser);

      const request = createMockRequest();
      const result = await controller.getCurrentUser(request);

      expect(result.id).toBe('user-123');
      expect(result.displayName).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(result.reputationScore).toBe(4.5);
      expect(result.subscriptionStatus).toBe('active');
    });

    it('should create new user on first login', async () => {
      const newUser = {
        id: 'new-user-123',
        externalId: 'ext-new',
        displayName: 'New User',
        email: 'new@example.com',
        reputationScore: 0,
        notifyEmail: true,
        subscriptionStatus: 'trial',
        createdAt: '2024-06-15T00:00:00Z',
      };

      mockedDabService.getOrCreateUser.mockResolvedValueOnce(newUser);

      const request = createMockRequest({
        user: {
          id: 'ext-new',
          email: 'new@example.com',
          name: 'New User',
        },
      } as Partial<ExpressRequest>);

      const result = await controller.getCurrentUser(request);

      expect(result.id).toBe('new-user-123');
      expect(result.subscriptionStatus).toBe('trial');
      expect(mockedDabService.getOrCreateUser).toHaveBeenCalledWith(
        'ext-new',
        expect.objectContaining({
          displayName: 'New User',
          email: 'new@example.com',
        }),
        'mock-token'
      );
    });

    it('should use email prefix as display name when name not provided', async () => {
      const newUser = {
        id: 'user-123',
        externalId: 'ext-123',
        displayName: 'john',
        email: 'john@example.com',
        reputationScore: 0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getOrCreateUser.mockResolvedValueOnce(newUser);

      const request = createMockRequest({
        user: {
          id: 'ext-123',
          email: 'john@example.com',
          name: '',
        },
      } as Partial<ExpressRequest>);

      await controller.getCurrentUser(request);

      expect(mockedDabService.getOrCreateUser).toHaveBeenCalledWith(
        'ext-123',
        expect.objectContaining({
          displayName: 'john',
        }),
        expect.any(String)
      );
    });
  });

  describe('updateCurrentUser', () => {
    it('should update user profile', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Old Name',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const updatedUser = {
        ...existingUser,
        displayName: 'New Name',
        bio: 'Updated bio',
        city: 'Portland',
        state: 'OR',
        updatedAt: '2024-06-15T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);
      mockedDabService.updateUser.mockResolvedValueOnce(updatedUser);

      const request = createMockRequest();
      const result = await controller.updateCurrentUser(request, {
        displayName: 'New Name',
        bio: 'Updated bio',
        city: 'Portland',
        state: 'OR',
      });

      expect(result.displayName).toBe('New Name');
      expect(result.bio).toBe('Updated bio');
      expect(result.city).toBe('Portland');
    });

    it('should throw error when user not found', async () => {
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.updateCurrentUser(request, { displayName: 'New Name' })
      ).rejects.toThrow('User not found');
    });

    it('should validate bio length', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();
      const longBio = 'a'.repeat(501);

      await expect(
        controller.updateCurrentUser(request, { bio: longBio })
      ).rejects.toThrow('Bio must be 500 characters or less');
    });

    it('should validate display name is not empty', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();

      await expect(
        controller.updateCurrentUser(request, { displayName: '   ' })
      ).rejects.toThrow('Display name cannot be empty');
    });

    it('should trim display name whitespace', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Old Name',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const updatedUser = {
        ...existingUser,
        displayName: 'Trimmed Name',
        updatedAt: '2024-06-15T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);
      mockedDabService.updateUser.mockResolvedValueOnce(updatedUser);

      const request = createMockRequest();
      await controller.updateCurrentUser(request, {
        displayName: '  Trimmed Name  ',
      });

      expect(mockedDabService.updateUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          displayName: 'Trimmed Name',
        }),
        'mock-token'
      );
    });

    it('should validate display name length', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();
      const longName = 'a'.repeat(101);

      await expect(
        controller.updateCurrentUser(request, { displayName: longName })
      ).rejects.toThrow('Display name must be 100 characters or less');
    });

    it('should validate phone length', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();
      const longPhone = '1'.repeat(21);

      await expect(
        controller.updateCurrentUser(request, { phone: longPhone })
      ).rejects.toThrow('Phone number must be 20 characters or less');
    });

    it('should validate street address length', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();
      const longAddress = 'a'.repeat(201);

      await expect(
        controller.updateCurrentUser(request, { streetAddress: longAddress })
      ).rejects.toThrow('Street address must be 200 characters or less');
    });

    it('should validate city length', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();
      const longCity = 'a'.repeat(101);

      await expect(
        controller.updateCurrentUser(request, { city: longCity })
      ).rejects.toThrow('City must be 100 characters or less');
    });

    it('should validate state length', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();
      const longState = 'a'.repeat(51);

      await expect(
        controller.updateCurrentUser(request, { state: longState })
      ).rejects.toThrow('State must be 50 characters or less');
    });

    it('should validate zipCode length', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(existingUser);

      const request = createMockRequest();
      const longZip = '1'.repeat(21);

      await expect(
        controller.updateCurrentUser(request, { zipCode: longZip })
      ).rejects.toThrow('ZIP code must be 20 characters or less');
    });
  });

  describe('getPublicProfile', () => {
    it('should return public profile without sensitive info', async () => {
      const publicProfile = {
        id: 'user-123',
        displayName: 'John Doe',
        avatarUrl: 'http://example.com/avatar.jpg',
        bio: 'Tool enthusiast',
        city: 'Seattle',
        state: 'WA',
        reputationScore: 4.8,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getPublicUserProfile.mockResolvedValueOnce(publicProfile);

      const request = createMockRequest();
      const result = await controller.getPublicProfile('user-123', request);

      expect(result.id).toBe('user-123');
      expect(result.displayName).toBe('John Doe');
      expect(result.reputationScore).toBe(4.8);
      expect(result.memberSince).toBe('2024-01-01T00:00:00Z');
      // Should not include sensitive fields
      expect((result as unknown as Record<string, unknown>).email).toBeUndefined();
      expect((result as unknown as Record<string, unknown>).phone).toBeUndefined();
      expect((result as unknown as Record<string, unknown>).streetAddress).toBeUndefined();
    });

    it('should throw error when user not found', async () => {
      mockedDabService.getPublicUserProfile.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.getPublicProfile('nonexistent', request)
      ).rejects.toThrow('User not found');
    });
  });

  describe('getMyHistory', () => {
    it('should return lending and borrowing history', async () => {
      const mockUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const lendingHistory = [
        {
          id: 'res-1',
          toolId: 'tool-1',
          toolName: 'Drill',
          toolCategory: 'Power Tools',
          startDate: '2024-05-01',
          endDate: '2024-05-05',
          otherUserId: 'user-2',
          otherUserName: 'Borrower',
          hasReview: true,
        },
      ];

      const borrowingHistory = [
        {
          id: 'res-2',
          toolId: 'tool-2',
          toolName: 'Saw',
          toolCategory: 'Power Tools',
          startDate: '2024-04-01',
          endDate: '2024-04-03',
          otherUserId: 'user-3',
          otherUserName: 'Owner',
          hasReview: false,
        },
      ];

      const stats = {
        totalLoans: 5,
        totalLends: 10,
        memberSince: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabService.getUserLendingHistory.mockResolvedValueOnce(lendingHistory);
      mockedDabService.getUserBorrowingHistory.mockResolvedValueOnce(borrowingHistory);
      mockedDabService.getUserHistoryStats.mockResolvedValueOnce(stats);

      const request = createMockRequest();
      const result = await controller.getMyHistory(request);

      expect(result.lendingHistory).toHaveLength(1);
      expect(result.borrowingHistory).toHaveLength(1);
      expect(result.stats.totalLoans).toBe(5);
      expect(result.stats.totalLends).toBe(10);
    });

    it('should throw error when user not found', async () => {
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(controller.getMyHistory(request)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getMyReviews', () => {
    it('should return user reviews', async () => {
      const mockUser = {
        id: 'user-123',
        externalId: 'ext-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        reputationScore: 4.0,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const reviews = [
        {
          id: 'review-1',
          reservationId: 'res-1',
          reviewerId: 'user-2',
          revieweeId: 'user-123',
          rating: 5,
          comment: 'Great experience!',
          createdAt: '2024-05-10T00:00:00Z',
          reviewer: {
            id: 'user-2',
            displayName: 'Reviewer',
            avatarUrl: 'http://example.com/avatar2.jpg',
          },
        },
      ];

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabService.getReviewsForUser.mockResolvedValueOnce(reviews as any);

      const request = createMockRequest();
      const result = await controller.getMyReviews(request);

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBe(5);
      expect(result[0].reviewer?.displayName).toBe('Reviewer');
    });
  });

  describe('getUserHistory', () => {
    it('should return public user history', async () => {
      const mockUser = {
        id: 'user-456',
        externalId: 'ext-456',
        displayName: 'Other User',
        email: 'other@example.com',
        reputationScore: 4.5,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedDabService.getUserById.mockResolvedValueOnce(mockUser);
      mockedDabService.getUserLendingHistory.mockResolvedValueOnce([]);
      mockedDabService.getUserBorrowingHistory.mockResolvedValueOnce([]);
      mockedDabService.getUserHistoryStats.mockResolvedValueOnce({
        totalLoans: 0,
        totalLends: 0,
        memberSince: '2024-01-01T00:00:00Z',
      });

      const request = createMockRequest();
      const result = await controller.getUserHistory('user-456', request);

      expect(result.lendingHistory).toEqual([]);
      expect(result.borrowingHistory).toEqual([]);
    });

    it('should throw error when user not found', async () => {
      mockedDabService.getUserById.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.getUserHistory('nonexistent', request)
      ).rejects.toThrow('User not found');
    });
  });

  describe('getUserReviews', () => {
    it('should return public user reviews', async () => {
      const mockUser = {
        id: 'user-456',
        externalId: 'ext-456',
        displayName: 'Other User',
        email: 'other@example.com',
        reputationScore: 4.5,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const reviews = [
        {
          id: 'review-1',
          reservationId: 'res-1',
          reviewerId: 'user-123',
          revieweeId: 'user-456',
          rating: 4,
          comment: 'Good',
          createdAt: '2024-05-10T00:00:00Z',
        },
      ];

      mockedDabService.getUserById.mockResolvedValueOnce(mockUser);
      mockedDabService.getReviewsForUser.mockResolvedValueOnce(reviews);

      const request = createMockRequest();
      const result = await controller.getUserReviews('user-456', request);

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBe(4);
    });
  });
});
