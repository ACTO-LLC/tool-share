import { useQuery, useMutation } from '@tanstack/react-query';
import { subscriptionApi, SubscriptionStatusResponse } from '../services/api';

/**
 * Query key for subscription status
 */
export const SUBSCRIPTION_QUERY_KEY = ['subscription', 'status'] as const;

/**
 * Hook to fetch the current user's subscription status
 */
export function useSubscriptionStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: subscriptionApi.getStatus,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a checkout session for subscribing
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: subscriptionApi.createCheckout,
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      console.error('Failed to create checkout session:', error);
    },
  });
}

/**
 * Hook to get the Stripe Customer Portal URL
 */
export function useGetPortal() {
  return useMutation({
    mutationFn: subscriptionApi.getPortal,
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    },
    onError: (error) => {
      console.error('Failed to get portal URL:', error);
    },
  });
}

/**
 * Hook to check if user can access features
 */
export function useCanAccessFeatures(): boolean {
  const { data } = useSubscriptionStatus();
  return data?.canAccessFeatures ?? true; // Default to true during loading
}

/**
 * Get subscription status label for display
 */
export function getSubscriptionStatusLabel(status: SubscriptionStatusResponse['status']): string {
  switch (status) {
    case 'trial':
      return 'Trial';
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Past Due';
    case 'cancelled':
      return 'Cancelled';
    case 'none':
      return 'No Subscription';
    default:
      return 'Unknown';
  }
}

/**
 * Get subscription status color for MUI chips/badges
 */
export function getSubscriptionStatusColor(
  status: SubscriptionStatusResponse['status']
): 'success' | 'warning' | 'error' | 'default' | 'info' {
  switch (status) {
    case 'trial':
      return 'info';
    case 'active':
      return 'success';
    case 'past_due':
      return 'warning';
    case 'cancelled':
      return 'error';
    case 'none':
      return 'default';
    default:
      return 'default';
  }
}
