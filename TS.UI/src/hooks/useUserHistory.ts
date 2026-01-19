import { useQuery } from '@tanstack/react-query';
import { userProfileApi, reviewsApi } from '../services/api';

/**
 * Query key for user history
 */
export const USER_HISTORY_QUERY_KEY = ['user', 'history'] as const;

/**
 * Query key for user reviews
 */
export const USER_REVIEWS_QUERY_KEY = ['user', 'reviews'] as const;

/**
 * Hook to fetch the current user's history
 */
export function useMyHistory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...USER_HISTORY_QUERY_KEY, 'me'],
    queryFn: userProfileApi.getMyHistory,
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a user's public history
 */
export function useUserHistory(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...USER_HISTORY_QUERY_KEY, userId],
    queryFn: () => userProfileApi.getUserHistory(userId),
    enabled: options?.enabled ?? !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch the current user's reviews
 */
export function useMyReviews(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...USER_REVIEWS_QUERY_KEY, 'me'],
    queryFn: userProfileApi.getMyReviews,
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a user's reviews
 */
export function useUserReviews(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...USER_REVIEWS_QUERY_KEY, userId],
    queryFn: () => reviewsApi.getUserReviews(userId),
    enabled: options?.enabled ?? !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
