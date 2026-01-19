import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, UserProfile, UpdateProfileRequest } from '../services/api';

/**
 * Query key for user profile
 */
export const USER_QUERY_KEY = ['user', 'me'] as const;

/**
 * Hook to fetch the current user's profile
 *
 * @param options.enabled - Whether to enable the query (default: true)
 * @returns Query result with user profile data
 */
export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: userApi.getCurrentUser,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update the current user's profile
 *
 * @returns Mutation function and state
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update the cache with the new user data
      queryClient.setQueryData<UserProfile>(USER_QUERY_KEY, updatedUser);
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
}

/**
 * Hook to prefetch the current user's profile
 *
 * @returns Prefetch function
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: USER_QUERY_KEY,
      queryFn: userApi.getCurrentUser,
    });
  };
}
