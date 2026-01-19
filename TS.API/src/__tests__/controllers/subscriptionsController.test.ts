/**
 * Unit tests for subscriptionsController
 * Tests Stripe integration (with Stripe mocked)
 */

import { SubscriptionsController } from '../../routes/subscriptionsController';
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
    body: {},
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
    subscriptionStatus: 'trial',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;

  beforeEach(() => {
    controller = new SubscriptionsController();
    jest.clearAllMocks();
    // Reset the date
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getSubscriptionStatus', () => {
    it('should return trial status for new user', async () => {
      const mockUser = createMockUser({ subscriptionStatus: 'trial' });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.status).toBe('trial');
      expect(result.canAccessFeatures).toBe(true);
      expect(result.isInGracePeriod).toBe(false);
    });

    it('should return active status', async () => {
      const mockUser = createMockUser({
        subscriptionStatus: 'active',
        subscriptionEndsAt: '2025-06-15T00:00:00Z',
        stripeCustomerId: 'cus_123',
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.status).toBe('active');
      expect(result.canAccessFeatures).toBe(true);
      expect(result.stripeCustomerId).toBe('cus_123');
    });

    it('should detect grace period for past_due status', async () => {
      const mockUser = createMockUser({
        subscriptionStatus: 'past_due',
        subscriptionEndsAt: '2024-06-10T00:00:00Z', // 5 days ago (within 7-day grace)
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.status).toBe('past_due');
      expect(result.isInGracePeriod).toBe(true);
      expect(result.canAccessFeatures).toBe(true);
    });

    it('should deny access after grace period', async () => {
      const mockUser = createMockUser({
        subscriptionStatus: 'past_due',
        subscriptionEndsAt: '2024-06-01T00:00:00Z', // 14 days ago (beyond 7-day grace)
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.status).toBe('past_due');
      expect(result.canAccessFeatures).toBe(false);
    });

    it('should allow cancelled users during grace period', async () => {
      const mockUser = createMockUser({
        subscriptionStatus: 'cancelled',
        subscriptionEndsAt: '2024-06-12T00:00:00Z', // 3 days ago (within grace)
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.status).toBe('cancelled');
      expect(result.canAccessFeatures).toBe(true);
    });

    it('should throw error when user not found', async () => {
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.getSubscriptionStatus(request)
      ).rejects.toThrow('User not found');
    });
  });

  describe('createCheckout', () => {
    it('should throw error when user not found', async () => {
      mockedDabService.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(controller.createCheckout(request)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getPortal', () => {
    it('should throw error when no subscription exists', async () => {
      const mockUser = createMockUser({
        stripeCustomerId: undefined,
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();

      await expect(controller.getPortal(request)).rejects.toThrow(
        'No subscription found'
      );
    });
  });
});

describe('Subscription access logic', () => {
  describe('canAccessFeatures', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow trial users', async () => {
      const controller = new SubscriptionsController();
      const mockUser = createMockUser({ subscriptionStatus: 'trial' });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.canAccessFeatures).toBe(true);
    });

    it('should allow active users', async () => {
      const controller = new SubscriptionsController();
      const mockUser = createMockUser({ subscriptionStatus: 'active' });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.canAccessFeatures).toBe(true);
    });

    it('should deny access for none status', async () => {
      const controller = new SubscriptionsController();
      const mockUser = createMockUser({ subscriptionStatus: 'none' });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.canAccessFeatures).toBe(false);
    });
  });

  describe('isInGracePeriod', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true when within 7-day grace period', async () => {
      const controller = new SubscriptionsController();
      // Subscription ended 3 days ago
      const mockUser = createMockUser({
        subscriptionStatus: 'past_due',
        subscriptionEndsAt: '2024-06-12T00:00:00Z',
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.isInGracePeriod).toBe(true);
    });

    it('should return false when beyond grace period', async () => {
      const controller = new SubscriptionsController();
      // Subscription ended 10 days ago
      const mockUser = createMockUser({
        subscriptionStatus: 'past_due',
        subscriptionEndsAt: '2024-06-05T00:00:00Z',
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.isInGracePeriod).toBe(false);
    });

    it('should return false for active subscriptions', async () => {
      const controller = new SubscriptionsController();
      const mockUser = createMockUser({
        subscriptionStatus: 'active',
        subscriptionEndsAt: '2024-07-15T00:00:00Z',
      });

      mockedDabService.getUserByExternalId.mockResolvedValueOnce(mockUser as any);

      const request = createMockRequest();
      const result = await controller.getSubscriptionStatus(request);

      expect(result.isInGracePeriod).toBe(false);
    });
  });
});
