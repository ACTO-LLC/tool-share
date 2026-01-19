import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useCircles,
  useCircleDetail,
  useCreateCircle,
  useJoinCircle,
  useLeaveCircle,
  useGetInvite,
  useRemoveMember,
  useUpdateMemberRole,
  CIRCLES_QUERY_KEY,
  CIRCLE_DETAIL_QUERY_KEY,
} from '../useCircles';
import { createHookWrapper, createTestQueryClient } from '../../test/utils';
import { circlesApi, Circle, CircleDetail } from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  circlesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    getInvite: vi.fn(),
    removeMember: vi.fn(),
    updateMemberRole: vi.fn(),
  },
}));

describe('useCircles hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCircles: Circle[] = [
    {
      id: 'circle-1',
      name: 'Neighborhood Tools',
      description: 'Share tools with neighbors',
      inviteCode: 'ABC123',
      isPublic: true,
      createdBy: 'user-1',
      createdAt: '2025-01-01T00:00:00Z',
      memberCount: 15,
      currentUserRole: 'admin',
    },
    {
      id: 'circle-2',
      name: 'Family Tools',
      description: 'Family tool sharing',
      inviteCode: 'XYZ789',
      isPublic: false,
      createdBy: 'user-2',
      createdAt: '2025-01-10T00:00:00Z',
      memberCount: 5,
      currentUserRole: 'member',
    },
  ];

  const mockCircleDetail: CircleDetail = {
    ...mockCircles[0],
    members: [
      {
        id: 'member-1',
        userId: 'user-1',
        role: 'owner',
        joinedAt: '2025-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          displayName: 'John Doe',
          email: 'john@example.com',
          reputationScore: 4.5,
        },
      },
    ],
    tools: [
      {
        id: 'tool-1',
        name: 'Power Drill',
        category: 'Power Tools',
        status: 'available',
      },
    ],
  };

  describe('useCircles', () => {
    it('should fetch circles successfully', async () => {
      vi.mocked(circlesApi.list).mockResolvedValue(mockCircles);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCircles(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCircles);
      expect(circlesApi.list).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching circles', async () => {
      vi.mocked(circlesApi.list).mockRejectedValue(new Error('Network error'));

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCircles(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useCircles({ enabled: false }), {
        wrapper: Wrapper,
      });

      expect(circlesApi.list).not.toHaveBeenCalled();
    });
  });

  describe('useCircleDetail', () => {
    it('should fetch circle detail successfully', async () => {
      vi.mocked(circlesApi.get).mockResolvedValue(mockCircleDetail);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCircleDetail('circle-1'), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCircleDetail);
      expect(circlesApi.get).toHaveBeenCalledWith('circle-1');
    });

    it('should not fetch when circleId is empty', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useCircleDetail(''), {
        wrapper: Wrapper,
      });

      expect(circlesApi.get).not.toHaveBeenCalled();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useCircleDetail('circle-1', { enabled: false }), {
        wrapper: Wrapper,
      });

      expect(circlesApi.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateCircle', () => {
    it('should create circle successfully', async () => {
      const newCircle: Circle = {
        id: 'circle-3',
        name: 'New Circle',
        description: 'A new circle',
        inviteCode: 'NEW123',
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 1,
        currentUserRole: 'owner',
      };
      vi.mocked(circlesApi.create).mockResolvedValue(newCircle);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCreateCircle(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ name: 'New Circle', description: 'A new circle' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(circlesApi.create).toHaveBeenCalledWith({
        name: 'New Circle',
        description: 'A new circle',
      });

      // Check that the mutation data is correct
      expect(result.current.data).toEqual(newCircle);
    });

    it('should handle error when creating circle', async () => {
      vi.mocked(circlesApi.create).mockRejectedValue(new Error('Failed to create'));

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useCreateCircle(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ name: 'New Circle' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useJoinCircle', () => {
    it('should join circle successfully', async () => {
      const joinedCircle: Circle = mockCircles[0];
      vi.mocked(circlesApi.join).mockResolvedValue(joinedCircle);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useJoinCircle(), {
        wrapper: Wrapper,
      });

      result.current.mutate('ABC123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(circlesApi.join).toHaveBeenCalledWith('ABC123');

      // Check that the mutation data is correct
      expect(result.current.data).toEqual(joinedCircle);
    });

    it('should handle error when joining circle', async () => {
      vi.mocked(circlesApi.join).mockRejectedValue(new Error('Invalid invite code'));

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useJoinCircle(), {
        wrapper: Wrapper,
      });

      result.current.mutate('INVALID');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useLeaveCircle', () => {
    it('should leave circle successfully', async () => {
      vi.mocked(circlesApi.leave).mockResolvedValue(undefined);

      const queryClient = createTestQueryClient();
      queryClient.setQueryData(CIRCLES_QUERY_KEY, mockCircles);

      const { Wrapper } = createHookWrapper({ queryClient });
      const { result } = renderHook(() => useLeaveCircle(), {
        wrapper: Wrapper,
      });

      result.current.mutate('circle-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(circlesApi.leave).toHaveBeenCalledWith('circle-1');

      // Check that the circle was removed from the cache
      const cachedCircles = queryClient.getQueryData<Circle[]>(CIRCLES_QUERY_KEY);
      expect(cachedCircles?.find((c) => c.id === 'circle-1')).toBeUndefined();
    });

    it('should handle error when leaving circle', async () => {
      vi.mocked(circlesApi.leave).mockRejectedValue(new Error('Cannot leave'));

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useLeaveCircle(), {
        wrapper: Wrapper,
      });

      result.current.mutate('circle-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useGetInvite', () => {
    it('should get invite successfully', async () => {
      const inviteResponse = {
        inviteCode: 'NEW_CODE',
        inviteUrl: 'https://app.example.com/join/NEW_CODE',
      };
      vi.mocked(circlesApi.getInvite).mockResolvedValue(inviteResponse);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useGetInvite(), {
        wrapper: Wrapper,
      });

      result.current.mutate('circle-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(inviteResponse);
      expect(circlesApi.getInvite).toHaveBeenCalledWith('circle-1');
    });
  });

  describe('useRemoveMember', () => {
    it('should remove member successfully', async () => {
      vi.mocked(circlesApi.removeMember).mockResolvedValue(undefined);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useRemoveMember(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ circleId: 'circle-1', userId: 'user-2' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(circlesApi.removeMember).toHaveBeenCalledWith('circle-1', 'user-2');
    });
  });

  describe('useUpdateMemberRole', () => {
    it('should update member role successfully', async () => {
      const updatedMember = {
        id: 'member-2',
        userId: 'user-2',
        role: 'admin' as const,
        joinedAt: '2025-01-05T00:00:00Z',
      };
      vi.mocked(circlesApi.updateMemberRole).mockResolvedValue(updatedMember);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useUpdateMemberRole(), {
        wrapper: Wrapper,
      });

      result.current.mutate({ circleId: 'circle-1', userId: 'user-2', role: 'admin' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(circlesApi.updateMemberRole).toHaveBeenCalledWith('circle-1', 'user-2', 'admin');
    });
  });

  describe('Query keys', () => {
    it('should have correct CIRCLES_QUERY_KEY', () => {
      expect(CIRCLES_QUERY_KEY).toEqual(['circles']);
    });

    it('should have correct CIRCLE_DETAIL_QUERY_KEY', () => {
      expect(CIRCLE_DETAIL_QUERY_KEY).toEqual(['circle']);
    });
  });
});
