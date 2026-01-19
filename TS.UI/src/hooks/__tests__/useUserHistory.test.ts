import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useMyHistory,
  useUserHistory,
  useMyReviews,
  useUserReviews,
  USER_HISTORY_QUERY_KEY,
  USER_REVIEWS_QUERY_KEY,
} from '../useUserHistory';
import { createHookWrapper } from '../../test/utils';
import { userProfileApi, reviewsApi, UserHistoryResponse, Review } from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  userProfileApi: {
    getMyHistory: vi.fn(),
    getUserHistory: vi.fn(),
    getMyReviews: vi.fn(),
    getUserReviews: vi.fn(),
  },
  reviewsApi: {
    getUserReviews: vi.fn(),
  },
}));

describe('useUserHistory hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHistoryResponse: UserHistoryResponse = {
    lendingHistory: [
      {
        id: 'lending-1',
        toolId: 'tool-1',
        toolName: 'Power Drill',
        toolCategory: 'Power Tools',
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        otherUserId: 'user-2',
        otherUserName: 'John Doe',
        hasReview: true,
      },
    ],
    borrowingHistory: [
      {
        id: 'borrowing-1',
        toolId: 'tool-2',
        toolName: 'Circular Saw',
        toolCategory: 'Power Tools',
        startDate: '2025-01-10',
        endDate: '2025-01-15',
        otherUserId: 'user-3',
        otherUserName: 'Jane Smith',
        hasReview: false,
      },
    ],
    stats: {
      totalLoans: 5,
      totalLends: 10,
      memberSince: '2024-01-01',
    },
  };

  const mockReviews: Review[] = [
    {
      id: 'review-1',
      reservationId: 'res-1',
      reviewerId: 'user-2',
      revieweeId: 'user-1',
      rating: 5,
      comment: 'Great lender!',
      createdAt: '2025-01-15T00:00:00Z',
      reviewer: {
        id: 'user-2',
        displayName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    },
  ];

  describe('useMyHistory', () => {
    it('should fetch my history successfully', async () => {
      vi.mocked(userProfileApi.getMyHistory).mockResolvedValue(mockHistoryResponse);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useMyHistory(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistoryResponse);
      expect(userProfileApi.getMyHistory).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching my history', async () => {
      vi.mocked(userProfileApi.getMyHistory).mockRejectedValue(
        new Error('Network error')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useMyHistory(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useMyHistory({ enabled: false }), {
        wrapper: Wrapper,
      });

      expect(userProfileApi.getMyHistory).not.toHaveBeenCalled();
    });
  });

  describe('useUserHistory', () => {
    it('should fetch user history successfully', async () => {
      vi.mocked(userProfileApi.getUserHistory).mockResolvedValue(mockHistoryResponse);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useUserHistory('user-123'), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistoryResponse);
      expect(userProfileApi.getUserHistory).toHaveBeenCalledWith('user-123');
    });

    it('should not fetch when userId is empty', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useUserHistory(''), {
        wrapper: Wrapper,
      });

      expect(userProfileApi.getUserHistory).not.toHaveBeenCalled();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useUserHistory('user-123', { enabled: false }), {
        wrapper: Wrapper,
      });

      expect(userProfileApi.getUserHistory).not.toHaveBeenCalled();
    });
  });

  describe('useMyReviews', () => {
    it('should fetch my reviews successfully', async () => {
      vi.mocked(userProfileApi.getMyReviews).mockResolvedValue(mockReviews);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useMyReviews(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockReviews);
      expect(userProfileApi.getMyReviews).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching my reviews', async () => {
      vi.mocked(userProfileApi.getMyReviews).mockRejectedValue(
        new Error('Network error')
      );

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useMyReviews(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useMyReviews({ enabled: false }), {
        wrapper: Wrapper,
      });

      expect(userProfileApi.getMyReviews).not.toHaveBeenCalled();
    });
  });

  describe('useUserReviews', () => {
    it('should fetch user reviews successfully', async () => {
      const mockUserReviewsResponse = {
        reviews: mockReviews,
        averageRating: 4.5,
        totalReviews: 10,
      };
      vi.mocked(reviewsApi.getUserReviews).mockResolvedValue(mockUserReviewsResponse);

      const { Wrapper } = createHookWrapper();
      const { result } = renderHook(() => useUserReviews('user-123'), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserReviewsResponse);
      expect(reviewsApi.getUserReviews).toHaveBeenCalledWith('user-123');
    });

    it('should not fetch when userId is empty', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useUserReviews(''), {
        wrapper: Wrapper,
      });

      expect(reviewsApi.getUserReviews).not.toHaveBeenCalled();
    });

    it('should respect enabled option', () => {
      const { Wrapper } = createHookWrapper();
      renderHook(() => useUserReviews('user-123', { enabled: false }), {
        wrapper: Wrapper,
      });

      expect(reviewsApi.getUserReviews).not.toHaveBeenCalled();
    });
  });

  describe('Query keys', () => {
    it('should have correct USER_HISTORY_QUERY_KEY', () => {
      expect(USER_HISTORY_QUERY_KEY).toEqual(['user', 'history']);
    });

    it('should have correct USER_REVIEWS_QUERY_KEY', () => {
      expect(USER_REVIEWS_QUERY_KEY).toEqual(['user', 'reviews']);
    });
  });
});
