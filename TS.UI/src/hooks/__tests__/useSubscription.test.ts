import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useSubscriptionStatus,
  useCreateCheckout,
  useGetPortal,
  useCanAccessFeatures,
  getSubscriptionStatusLabel,
  getSubscriptionStatusColor,
  SUBSCRIPTION_QUERY_KEY,
} from '../useSubscription';
import { createHookWrapper } from '../../test/utils';
import { subscriptionApi, SubscriptionStatusResponse } from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  subscriptionApi: {
    getStatus: vi.fn(),
    createCheckout: vi.fn(),
    getPortal: vi.fn(),
  },
}));

// Mock window.location.href
const originalLocation = window.location;
beforeEach(() => {
  delete (window as { location?: Location }).location;
  window.location = { ...originalLocation, href: '' } as Location;
});

describe('useSubscription hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSubscriptionStatus', () => {
    it('should fetch subscription status successfully', async () => {
      const mockStatus: SubscriptionStatusResponse = {
        status: 'active',
        canAccessFeatures: true,
        isInGracePeriod: false,
        subscriptionEndsAt: '2025-12-31T00:00:00Z',
      };

      vi.mocked(subscriptionApi.getStatus).mockResolvedValue(mockStatus);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStatus);
      expect(subscriptionApi.getStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching subscription status', async () => {
      vi.mocked(subscriptionApi.getStatus).mockRejectedValue(
        new Error('Network error')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useSubscriptionStatus({ enabled: false }), {
        wrapper: Wrapper,
      });

      expect(subscriptionApi.getStatus).not.toHaveBeenCalled();
    });
  });

  describe('useCreateCheckout', () => {
    it('should create checkout and redirect on success', async () => {
      const mockCheckoutResponse = {
        checkoutUrl: 'https://checkout.stripe.com/test-session',
      };

      vi.mocked(subscriptionApi.createCheckout).mockResolvedValue(
        mockCheckoutResponse
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCreateCheckout(), {
        wrapper: Wrapper,
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(window.location.href).toBe(mockCheckoutResponse.checkoutUrl);
    });

    it('should handle checkout error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(subscriptionApi.createCheckout).mockRejectedValue(
        new Error('Checkout failed')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCreateCheckout(), {
        wrapper: Wrapper,
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create checkout session:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('useGetPortal', () => {
    it('should get portal URL and redirect on success', async () => {
      const mockPortalResponse = {
        portalUrl: 'https://billing.stripe.com/test-portal',
      };

      vi.mocked(subscriptionApi.getPortal).mockResolvedValue(mockPortalResponse);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useGetPortal(), {
        wrapper: Wrapper,
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(window.location.href).toBe(mockPortalResponse.portalUrl);
    });

    it('should handle portal error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(subscriptionApi.getPortal).mockRejectedValue(
        new Error('Portal failed')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useGetPortal(), {
        wrapper: Wrapper,
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get portal URL:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('useCanAccessFeatures', () => {
    it('should return true when canAccessFeatures is true', async () => {
      const mockStatus: SubscriptionStatusResponse = {
        status: 'active',
        canAccessFeatures: true,
        isInGracePeriod: false,
      };

      vi.mocked(subscriptionApi.getStatus).mockResolvedValue(mockStatus);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCanAccessFeatures(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should return true during loading (default)', async () => {
      // Don't resolve the promise to keep it in loading state
      vi.mocked(subscriptionApi.getStatus).mockReturnValue(
        new Promise(() => {})
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCanAccessFeatures(), {
        wrapper: Wrapper,
      });

      // During loading, should default to true
      expect(result.current).toBe(true);
    });
  });

  describe('getSubscriptionStatusLabel', () => {
    it('should return correct label for trial', () => {
      expect(getSubscriptionStatusLabel('trial')).toBe('Trial');
    });

    it('should return correct label for active', () => {
      expect(getSubscriptionStatusLabel('active')).toBe('Active');
    });

    it('should return correct label for past_due', () => {
      expect(getSubscriptionStatusLabel('past_due')).toBe('Past Due');
    });

    it('should return correct label for cancelled', () => {
      expect(getSubscriptionStatusLabel('cancelled')).toBe('Cancelled');
    });

    it('should return correct label for none', () => {
      expect(getSubscriptionStatusLabel('none')).toBe('No Subscription');
    });

    it('should return Unknown for unknown status', () => {
      expect(getSubscriptionStatusLabel('unknown' as SubscriptionStatusResponse['status'])).toBe('Unknown');
    });
  });

  describe('getSubscriptionStatusColor', () => {
    it('should return info for trial', () => {
      expect(getSubscriptionStatusColor('trial')).toBe('info');
    });

    it('should return success for active', () => {
      expect(getSubscriptionStatusColor('active')).toBe('success');
    });

    it('should return warning for past_due', () => {
      expect(getSubscriptionStatusColor('past_due')).toBe('warning');
    });

    it('should return error for cancelled', () => {
      expect(getSubscriptionStatusColor('cancelled')).toBe('error');
    });

    it('should return default for none', () => {
      expect(getSubscriptionStatusColor('none')).toBe('default');
    });

    it('should return default for unknown status', () => {
      expect(getSubscriptionStatusColor('unknown' as SubscriptionStatusResponse['status'])).toBe('default');
    });
  });

  describe('SUBSCRIPTION_QUERY_KEY', () => {
    it('should have correct query key', () => {
      expect(SUBSCRIPTION_QUERY_KEY).toEqual(['subscription', 'status']);
    });
  });
});
