import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circlesApi, Circle, CircleDetail, CreateCircleRequest } from '../services/api';

/**
 * Query key for circles list
 */
export const CIRCLES_QUERY_KEY = ['circles'] as const;

/**
 * Query key for circle detail
 */
export const CIRCLE_DETAIL_QUERY_KEY = ['circle'] as const;

/**
 * Hook to fetch all circles the user is a member of
 */
export function useCircles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: CIRCLES_QUERY_KEY,
    queryFn: circlesApi.list,
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a circle's details
 */
export function useCircleDetail(circleId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...CIRCLE_DETAIL_QUERY_KEY, circleId],
    queryFn: () => circlesApi.get(circleId),
    enabled: (options?.enabled ?? true) && !!circleId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new circle
 */
export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCircleRequest) => circlesApi.create(data),
    onSuccess: (newCircle) => {
      // Add the new circle to the list
      queryClient.setQueryData<Circle[]>(CIRCLES_QUERY_KEY, (old) => {
        if (!old) return [newCircle];
        return [...old, newCircle];
      });
    },
  });
}

/**
 * Hook to join a circle
 */
export function useJoinCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => circlesApi.join(inviteCode),
    onSuccess: (joinedCircle) => {
      // Add the joined circle to the list
      queryClient.setQueryData<Circle[]>(CIRCLES_QUERY_KEY, (old) => {
        if (!old) return [joinedCircle];
        return [...old, joinedCircle];
      });
    },
  });
}

/**
 * Hook to leave a circle
 */
export function useLeaveCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (circleId: string) => circlesApi.leave(circleId),
    onSuccess: (_data, circleId) => {
      // Remove the circle from the list
      queryClient.setQueryData<Circle[]>(CIRCLES_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== circleId);
      });
      // Invalidate the circle detail
      queryClient.invalidateQueries({ queryKey: [...CIRCLE_DETAIL_QUERY_KEY, circleId] });
    },
  });
}

/**
 * Hook to get invite code for a circle
 */
export function useGetInvite() {
  return useMutation({
    mutationFn: (circleId: string) => circlesApi.getInvite(circleId),
  });
}

/**
 * Hook to remove a member from a circle
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId, userId }: { circleId: string; userId: string }) =>
      circlesApi.removeMember(circleId, userId),
    onSuccess: (_data, { circleId }) => {
      // Invalidate the circle detail to refresh member list
      queryClient.invalidateQueries({ queryKey: [...CIRCLE_DETAIL_QUERY_KEY, circleId] });
    },
  });
}

/**
 * Hook to update a member's role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      circleId,
      userId,
      role,
    }: {
      circleId: string;
      userId: string;
      role: 'member' | 'admin';
    }) => circlesApi.updateMemberRole(circleId, userId, role),
    onSuccess: (_data, { circleId }) => {
      // Invalidate the circle detail to refresh member list
      queryClient.invalidateQueries({ queryKey: [...CIRCLE_DETAIL_QUERY_KEY, circleId] });
    },
  });
}
