/**
 * Unit tests for circlesController
 * Tests circle management operations
 */

import { CirclesController } from '../../routes/circlesController';
import { dabClient } from '../../services/dabClient';
import { Request as ExpressRequest } from 'express';

// Mock dabClient
jest.mock('../../services/dabClient');
const mockedDabClient = dabClient as jest.Mocked<typeof dabClient>;

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

// Mock user factory
function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    externalId: 'ext-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    reputationScore: 4.0,
    subscriptionStatus: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  } as any;
}

// Mock circle member factory
function createMockMember(overrides = {}) {
  return {
    id: 'member-123',
    circleId: 'circle-123',
    userId: 'user-123',
    role: 'member' as const,
    joinedAt: '2024-01-15T00:00:00Z',
    ...overrides,
  };
}

// Mock tool factory
function createMockToolWithPhotos(overrides = {}) {
  return {
    id: 'tool-1',
    ownerId: 'user-123',
    name: 'Drill',
    category: 'Power Tools',
    status: 'available' as const,
    advanceNoticeDays: 1,
    maxLoanDays: 7,
    createdAt: '2024-01-01T00:00:00Z',
    photos: [{ id: 'photo-1', url: 'http://example.com/photo.jpg', isPrimary: true, toolId: 'tool-1', uploadedAt: '2024-01-01T00:00:00Z' }],
    ...overrides,
  };
}

// Mock circle factory
function createMockCircle(overrides = {}) {
  return {
    id: 'circle-123',
    name: 'Neighborhood Tools',
    description: 'Share tools with neighbors',
    inviteCode: 'ABC12345',
    isPublic: false,
    createdBy: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('CirclesController', () => {
  let controller: CirclesController;

  beforeEach(() => {
    controller = new CirclesController();
    jest.clearAllMocks();
  });

  describe('createCircle', () => {
    it('should create a new circle', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.createCircle.mockResolvedValueOnce(mockCircle);
      mockedDabClient.createCircleMember.mockResolvedValueOnce({
        id: 'member-123',
        circleId: 'circle-123',
        userId: 'user-123',
        role: 'owner',
        joinedAt: '2024-06-15T00:00:00Z',
      });

      const request = createMockRequest();
      const result = await controller.createCircle(request, {
        name: 'Neighborhood Tools',
        description: 'Share tools with neighbors',
      });

      expect(result.name).toBe('Neighborhood Tools');
      expect(result.currentUserRole).toBe('owner');
      expect(result.memberCount).toBe(1);
      expect(mockedDabClient.createCircleMember).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'owner',
        }),
        'mock-token'
      );
    });

    it('should generate unique invite code', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.createCircle.mockResolvedValueOnce(mockCircle);
      mockedDabClient.createCircleMember.mockResolvedValueOnce({
        id: 'member-123',
        circleId: 'circle-123',
        userId: 'user-123',
        role: 'owner',
        joinedAt: '2024-06-15T00:00:00Z',
      });

      const request = createMockRequest();
      await controller.createCircle(request, {
        name: 'Test Circle',
      });

      expect(mockedDabClient.createCircle).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteCode: expect.stringMatching(/^[A-Z0-9]{8}$/),
        }),
        'mock-token'
      );
    });

    it('should throw error when user not found', async () => {
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.createCircle(request, { name: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('getMyCircles', () => {
    it('should return circles user is a member of', async () => {
      const mockUser = createMockUser();
      const mockCircles = [
        {
          ...createMockCircle(),
          memberCount: 5,
          currentUserRole: 'owner' as const,
        },
        {
          ...createMockCircle({ id: 'circle-456', name: 'Work Tools' }),
          memberCount: 10,
          currentUserRole: 'member' as const,
        },
      ];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles);

      const request = createMockRequest();
      const result = await controller.getMyCircles(request);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Neighborhood Tools');
      expect(result[0].currentUserRole).toBe('owner');
    });

    it('should return empty array when user not found', async () => {
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const result = await controller.getMyCircles(request);

      expect(result).toEqual([]);
    });
  });

  describe('getCircle', () => {
    it('should return circle details for member', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();
      const mockMembership = createMockMember();
      const mockMembers = [
        {
          ...mockMembership,
          user: createMockUser(),
        },
      ];
      const mockTools = [createMockToolWithPhotos()];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(mockMembership);
      mockedDabClient.getCircleById.mockResolvedValueOnce(mockCircle);
      mockedDabClient.getCircleMembers.mockResolvedValueOnce(mockMembers as any);
      mockedDabClient.getCircleTools.mockResolvedValueOnce(mockTools as any);

      const request = createMockRequest();
      const result = await controller.getCircle(request, 'circle-123');

      expect(result.name).toBe('Neighborhood Tools');
      expect(result.members).toHaveLength(1);
      expect(result.tools).toHaveLength(1);
      expect(result.currentUserRole).toBe('member');
    });

    it('should throw error when not a member', async () => {
      const mockUser = createMockUser();

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.getCircle(request, 'circle-123')
      ).rejects.toThrow('Not a member of this circle');
    });

    it('should throw error when circle not found', async () => {
      const mockUser = createMockUser();
      const mockMembership = {
        id: 'member-123',
        circleId: 'circle-123',
        userId: 'user-123',
        role: 'member' as const,
        joinedAt: '2024-01-15T00:00:00Z',
      };

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(mockMembership);
      mockedDabClient.getCircleById.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.getCircle(request, 'circle-123')
      ).rejects.toThrow('Circle not found');
    });
  });

  describe('joinCircle', () => {
    it('should join circle with valid invite code', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();
      const mockMembers = [
        createMockMember({ id: 'member-1', userId: 'user-456', role: 'owner' as const }),
        createMockMember({ id: 'member-2', userId: 'user-123', role: 'member' as const }),
      ];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleById.mockResolvedValueOnce(mockCircle);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(null); // Not already a member
      mockedDabClient.createCircleMember.mockResolvedValueOnce(
        createMockMember({ id: 'member-new', joinedAt: '2024-06-15T00:00:00Z' })
      );
      mockedDabClient.getCircleMembers.mockResolvedValueOnce(mockMembers as any);

      const request = createMockRequest();
      const result = await controller.joinCircle(request, 'circle-123', {
        inviteCode: 'ABC12345',
      });

      expect(result.name).toBe('Neighborhood Tools');
      expect(result.currentUserRole).toBe('member');
      expect(result.memberCount).toBe(2);
    });

    it('should reject invalid invite code', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleById.mockResolvedValueOnce(mockCircle);

      const request = createMockRequest();

      await expect(
        controller.joinCircle(request, 'circle-123', {
          inviteCode: 'WRONGCODE',
        })
      ).rejects.toThrow('Invalid invite code');
    });

    it('should reject if already a member', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();
      const existingMembership = createMockMember();

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleById.mockResolvedValueOnce(mockCircle);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(existingMembership);

      const request = createMockRequest();

      await expect(
        controller.joinCircle(request, 'circle-123', {
          inviteCode: 'ABC12345',
        })
      ).rejects.toThrow('Already a member of this circle');
    });
  });

  describe('joinCircleByCode', () => {
    it('should join circle by invite code without knowing circle ID', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();
      const mockMembers = [createMockMember()];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleByInviteCode.mockResolvedValueOnce(mockCircle);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(null);
      mockedDabClient.createCircleMember.mockResolvedValueOnce(
        createMockMember({ id: 'member-new', joinedAt: '2024-06-15T00:00:00Z' })
      );
      mockedDabClient.getCircleMembers.mockResolvedValueOnce(mockMembers as any);

      const request = createMockRequest();
      const result = await controller.joinCircleByCode(request, {
        inviteCode: 'ABC12345',
      });

      expect(result.name).toBe('Neighborhood Tools');
    });

    it('should throw error for invalid invite code', async () => {
      const mockUser = createMockUser();

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleByInviteCode.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.joinCircleByCode(request, { inviteCode: 'INVALID' })
      ).rejects.toThrow('Invalid invite code');
    });
  });

  describe('getInvite', () => {
    it('should return invite for admin', async () => {
      const mockUser = createMockUser();
      const mockCircle = createMockCircle();
      const adminMembership = createMockMember({ role: 'admin' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(adminMembership);
      mockedDabClient.getCircleById.mockResolvedValueOnce(mockCircle);

      const request = createMockRequest();
      const result = await controller.getInvite(request, 'circle-123');

      expect(result.inviteCode).toBe('ABC12345');
      expect(result.inviteUrl).toContain('ABC12345');
    });

    it('should reject non-admin', async () => {
      const mockUser = createMockUser();
      const memberMembership = createMockMember({ role: 'member' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(memberMembership);

      const request = createMockRequest();

      await expect(
        controller.getInvite(request, 'circle-123')
      ).rejects.toThrow('Only admins can generate invites');
    });
  });

  describe('removeMember', () => {
    it('should remove member as admin', async () => {
      const mockAdmin = createMockUser({ id: 'admin-123' });
      const adminMembership = createMockMember({ id: 'member-admin', userId: 'admin-123', role: 'admin' as const });
      const targetMembership = createMockMember({ id: 'member-target', userId: 'target-user', role: 'member' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockAdmin);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(adminMembership);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(targetMembership);
      mockedDabClient.deleteCircleMember.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      await controller.removeMember(request, 'circle-123', 'target-user');

      expect(mockedDabClient.deleteCircleMember).toHaveBeenCalledWith(
        'member-target',
        'mock-token'
      );
    });

    it('should not remove owner', async () => {
      const mockAdmin = createMockUser({ id: 'admin-123' });
      const adminMembership = createMockMember({ id: 'member-admin', userId: 'admin-123', role: 'admin' as const });
      const ownerMembership = createMockMember({ id: 'member-owner', userId: 'owner-user', role: 'owner' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockAdmin);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(adminMembership);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(ownerMembership);

      const request = createMockRequest();

      await expect(
        controller.removeMember(request, 'circle-123', 'owner-user')
      ).rejects.toThrow('Cannot remove the circle owner');
    });

    it('should not allow admin to remove another admin', async () => {
      const mockAdmin = createMockUser({ id: 'admin-123' });
      const adminMembership = createMockMember({ id: 'member-admin', userId: 'admin-123', role: 'admin' as const });
      const otherAdminMembership = createMockMember({ id: 'member-admin-2', userId: 'admin-2', role: 'admin' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockAdmin);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(adminMembership);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(otherAdminMembership);

      const request = createMockRequest();

      await expect(
        controller.removeMember(request, 'circle-123', 'admin-2')
      ).rejects.toThrow('Only owners can remove admins');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role as owner', async () => {
      const mockOwner = createMockUser({ id: 'owner-123' });
      const ownerMembership = createMockMember({ id: 'member-owner', userId: 'owner-123', role: 'owner' as const });
      const targetMembership = createMockMember({ id: 'member-target', userId: 'target-user', role: 'member' as const });
      const updatedMembership = createMockMember({ ...targetMembership, role: 'admin' as const });
      const targetUser = createMockUser({ id: 'target-user', displayName: 'Target User' });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockOwner);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(ownerMembership);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(targetMembership);
      mockedDabClient.updateCircleMember.mockResolvedValueOnce(updatedMembership);
      mockedDabClient.getUserById.mockResolvedValueOnce(targetUser);

      const request = createMockRequest();
      const result = await controller.updateMemberRole(request, 'circle-123', 'target-user', {
        role: 'admin',
      });

      expect(result.role).toBe('admin');
    });

    it('should not change owner role', async () => {
      const mockOwner = createMockUser({ id: 'owner-123' });
      const ownerMembership = createMockMember({ id: 'member-owner', userId: 'owner-123', role: 'owner' as const });
      const targetOwnerMembership = createMockMember({ id: 'member-target', userId: 'other-owner', role: 'owner' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockOwner);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(ownerMembership);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(targetOwnerMembership);

      const request = createMockRequest();

      await expect(
        controller.updateMemberRole(request, 'circle-123', 'other-owner', {
          role: 'member',
        })
      ).rejects.toThrow('Cannot change owner role');
    });
  });

  describe('leaveCircle', () => {
    it('should allow member to leave circle', async () => {
      const mockUser = createMockUser();
      const memberMembership = createMockMember({ role: 'member' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(memberMembership);
      mockedDabClient.deleteCircleMember.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      await controller.leaveCircle(request, 'circle-123');

      expect(mockedDabClient.deleteCircleMember).toHaveBeenCalledWith(
        'member-123',
        'mock-token'
      );
    });

    it('should not allow owner to leave', async () => {
      const mockUser = createMockUser();
      const ownerMembership = createMockMember({ role: 'owner' as const });

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockUser);
      mockedDabClient.getCircleMembership.mockResolvedValueOnce(ownerMembership);

      const request = createMockRequest();

      await expect(
        controller.leaveCircle(request, 'circle-123')
      ).rejects.toThrow('Owner cannot leave. Transfer ownership first.');
    });
  });
});
