/**
 * Unit tests for dabService
 * Tests GraphQL query builders and response parsing
 */

import axios from 'axios';
import * as dabService from '../../services/dabService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('dabService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByExternalId', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        externalId: 'ext-123',
        displayName: 'John Doe',
        email: 'john@example.com',
        reputationScore: 4.5,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            users: {
              items: [mockUser],
            },
          },
        },
      });

      const result = await dabService.getUserByExternalId('ext-123');

      expect(result).toEqual(mockUser);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          query: expect.stringContaining('GetUserByExternalId'),
          variables: { filter: { externalId: { eq: 'ext-123' } } },
        }),
        expect.any(Object)
      );
    });

    it('should return null when user not found', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            users: {
              items: [],
            },
          },
        },
      });

      const result = await dabService.getUserByExternalId('nonexistent');

      expect(result).toBeNull();
    });

    it('should include auth token in headers when provided', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            users: {
              items: [],
            },
          },
        },
      });

      await dabService.getUserByExternalId('ext-123', 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        externalId: 'ext-123',
        displayName: 'John Doe',
        email: 'john@example.com',
        reputationScore: 4.5,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            user_by_pk: mockUser,
          },
        },
      });

      const result = await dabService.getUserById('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            user_by_pk: null,
          },
        },
      });

      const result = await dabService.getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and return new user', async () => {
      const mockUser = {
        id: expect.any(String),
        externalId: 'ext-new',
        displayName: 'New User',
        email: 'new@example.com',
        reputationScore: 0,
        createdAt: expect.any(String),
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            createUser: mockUser,
          },
        },
      });

      const result = await dabService.createUser({
        externalId: 'ext-new',
        displayName: 'New User',
        email: 'new@example.com',
      });

      expect(result).toEqual(mockUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          query: expect.stringContaining('CreateUser'),
          variables: expect.objectContaining({
            item: expect.objectContaining({
              externalId: 'ext-new',
              displayName: 'New User',
              email: 'new@example.com',
            }),
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        externalId: 'ext-123',
        displayName: 'Updated Name',
        email: 'john@example.com',
        bio: 'New bio',
        reputationScore: 4.5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: expect.any(String),
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            updateUser: mockUpdatedUser,
          },
        },
      });

      const result = await dabService.updateUser('user-123', {
        displayName: 'Updated Name',
        bio: 'New bio',
      });

      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('getOrCreateUser', () => {
    it('should return existing user', async () => {
      const existingUser = {
        id: 'user-123',
        externalId: 'ext-123',
        displayName: 'Existing User',
        email: 'existing@example.com',
        reputationScore: 4.5,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            users: {
              items: [existingUser],
            },
          },
        },
      });

      const result = await dabService.getOrCreateUser('ext-123', {
        displayName: 'Default Name',
        email: 'default@example.com',
      });

      expect(result).toEqual(existingUser);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should create new user when not found', async () => {
      const newUser = {
        id: 'new-user-123',
        externalId: 'ext-new',
        displayName: 'New User',
        email: 'new@example.com',
        reputationScore: 0,
        createdAt: expect.any(String),
      };

      // First call returns empty (user not found)
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            users: {
              items: [],
            },
          },
        },
      });

      // Second call creates user
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            createUser: newUser,
          },
        },
      });

      const result = await dabService.getOrCreateUser('ext-new', {
        displayName: 'New User',
        email: 'new@example.com',
      });

      expect(result).toEqual(newUser);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('getToolById', () => {
    it('should return tool with owner and photos', async () => {
      const mockTool = {
        id: 'tool-123',
        ownerId: 'user-123',
        name: 'Power Drill',
        category: 'Power Tools',
        status: 'available',
        advanceNoticeDays: 1,
        maxLoanDays: 7,
        createdAt: '2024-01-01T00:00:00Z',
        owner: {
          id: 'user-123',
          displayName: 'John Doe',
        },
        photos: {
          items: [
            { id: 'photo-1', url: 'http://example.com/photo.jpg', isPrimary: true },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            tool_by_pk: mockTool,
          },
        },
      });

      const result = await dabService.getToolById('tool-123');

      expect(result).toEqual(mockTool);
    });

    it('should return null when tool not found', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            tool_by_pk: null,
          },
        },
      });

      const result = await dabService.getToolById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('checkDateConflicts', () => {
    it('should return true when dates conflict', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            reservations: {
              items: [
                {
                  id: 'res-1',
                  startDate: '2024-01-15',
                  endDate: '2024-01-20',
                  status: 'confirmed',
                },
              ],
            },
          },
        },
      });

      const result = await dabService.checkDateConflicts(
        'tool-123',
        '2024-01-18',
        '2024-01-25'
      );

      expect(result).toBe(true);
    });

    it('should return false when no conflicts', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            reservations: {
              items: [
                {
                  id: 'res-1',
                  startDate: '2024-01-15',
                  endDate: '2024-01-20',
                  status: 'confirmed',
                },
              ],
            },
          },
        },
      });

      const result = await dabService.checkDateConflicts(
        'tool-123',
        '2024-01-25',
        '2024-01-30'
      );

      expect(result).toBe(false);
    });

    it('should exclude specified reservation from conflict check', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            reservations: {
              items: [
                {
                  id: 'res-to-exclude',
                  startDate: '2024-01-15',
                  endDate: '2024-01-20',
                  status: 'confirmed',
                },
              ],
            },
          },
        },
      });

      const result = await dabService.checkDateConflicts(
        'tool-123',
        '2024-01-18',
        '2024-01-25',
        'res-to-exclude'
      );

      expect(result).toBe(false);
    });
  });

  describe('createReservation', () => {
    it('should create reservation with pending status', async () => {
      const mockReservation = {
        id: expect.any(String),
        toolId: 'tool-123',
        borrowerId: 'user-456',
        status: 'pending',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        createdAt: expect.any(String),
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            createReservation: mockReservation,
          },
        },
      });

      const result = await dabService.createReservation({
        toolId: 'tool-123',
        borrowerId: 'user-456',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
      });

      expect(result).toEqual(mockReservation);
      expect(result.status).toBe('pending');
    });
  });

  describe('updateReservation', () => {
    it('should update reservation status', async () => {
      const mockReservation = {
        id: 'res-123',
        toolId: 'tool-123',
        borrowerId: 'user-456',
        status: 'confirmed',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        updatedAt: expect.any(String),
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            updateReservation: mockReservation,
          },
        },
      });

      const result = await dabService.updateReservation('res-123', {
        status: 'confirmed',
      });

      expect(result.status).toBe('confirmed');
    });
  });

  describe('createNotification', () => {
    it('should create notification', async () => {
      const mockNotification = {
        id: expect.any(String),
        userId: 'user-123',
        type: 'reservation_request',
        title: 'New Request',
        message: 'Someone wants to borrow your tool',
        isRead: false,
        createdAt: expect.any(String),
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            createNotification: mockNotification,
          },
        },
      });

      const result = await dabService.createNotification({
        userId: 'user-123',
        type: 'reservation_request',
        title: 'New Request',
        message: 'Someone wants to borrow your tool',
      });

      expect(result).toEqual(mockNotification);
      expect(result.isRead).toBe(false);
    });
  });

  describe('getReviewsForUser', () => {
    it('should return user reviews', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          reservationId: 'res-1',
          reviewerId: 'user-1',
          revieweeId: 'user-2',
          rating: 5,
          comment: 'Great experience!',
          createdAt: '2024-01-15T00:00:00Z',
        },
        {
          id: 'review-2',
          reservationId: 'res-2',
          reviewerId: 'user-3',
          revieweeId: 'user-2',
          rating: 4,
          comment: 'Good',
          createdAt: '2024-01-10T00:00:00Z',
        },
      ];

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            reviews: {
              items: mockReviews,
            },
          },
        },
      });

      const result = await dabService.getReviewsForUser('user-2');

      expect(result).toEqual(mockReviews);
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateUserReputationScore', () => {
    it('should calculate average rating from reviews', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            reviews: {
              items: [
                { id: 'r1', rating: 5 },
                { id: 'r2', rating: 4 },
                { id: 'r3', rating: 5 },
              ],
            },
          },
        },
      });

      const result = await dabService.calculateUserReputationScore('user-123');

      expect(result).toBe(4.7); // (5+4+5)/3 = 4.67, rounded to 4.7
    });

    it('should return 0 when no reviews', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            reviews: {
              items: [],
            },
          },
        },
      });

      const result = await dabService.calculateUserReputationScore('user-123');

      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw error on GraphQL errors', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          errors: [{ message: 'GraphQL validation error' }],
        },
      });

      await expect(dabService.getUserById('user-123')).rejects.toThrow(
        'GraphQL Error: GraphQL validation error'
      );
    });

    it('should throw error on network failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      await expect(dabService.getUserById('user-123')).rejects.toThrow();
    });
  });
});
