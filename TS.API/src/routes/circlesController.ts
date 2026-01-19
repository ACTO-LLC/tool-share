import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Body,
  Route,
  Tags,
  Security,
  Request,
  SuccessResponse,
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../middleware/auth';
import { dabClient } from '../services/dabClient';

// ==================== Request/Response Interfaces ====================

interface CreateCircleRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface UpdateCircleMemberRoleRequest {
  role: 'member' | 'admin';
}

interface JoinCircleRequest {
  inviteCode: string;
}

interface CircleMemberResponse {
  id: string;
  userId: string;
  role: 'member' | 'admin' | 'owner';
  joinedAt: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    reputationScore: number;
  };
}

interface CircleToolResponse {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  status: string;
  owner?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  primaryPhotoUrl?: string;
}

interface CircleResponse {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
  currentUserRole?: 'member' | 'admin' | 'owner';
}

interface CircleDetailResponse extends CircleResponse {
  members?: CircleMemberResponse[];
  tools?: CircleToolResponse[];
}

interface InviteResponse {
  inviteCode: string;
  inviteUrl: string;
}

// ==================== Helper Functions ====================

/**
 * Generate a unique 8-character alphanumeric invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing characters: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==================== Controller ====================

@Route('api/circles')
@Tags('Circles')
export class CirclesController extends Controller {
  // ==================== CIRCLE CRUD ====================

  /**
   * Create a new circle
   * The creator automatically becomes the owner
   */
  @Post('/')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  public async createCircle(
    @Request() request: ExpressRequest,
    @Body() body: CreateCircleRequest
  ): Promise<CircleResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Generate unique invite code
    const inviteCode = generateInviteCode();

    // Create the circle
    const circle = await dabClient.createCircle(
      {
        name: body.name,
        description: body.description,
        isPublic: body.isPublic ?? false,
        createdBy: dbUser.id,
        inviteCode,
      },
      authToken
    );

    // Add the creator as owner
    await dabClient.createCircleMember(
      {
        circleId: circle.id,
        userId: dbUser.id,
        role: 'owner',
      },
      authToken
    );

    this.setStatus(201);
    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      inviteCode: circle.inviteCode,
      isPublic: circle.isPublic,
      createdBy: circle.createdBy,
      createdAt: circle.createdAt,
      memberCount: 1,
      currentUserRole: 'owner',
    };
  }

  /**
   * Get all circles the current user is a member of
   */
  @Get('/')
  @Security('Bearer')
  public async getMyCircles(
    @Request() request: ExpressRequest
  ): Promise<CircleResponse[]> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      return [];
    }

    // Get circles the user is a member of
    const circles = await dabClient.getCirclesByUser(dbUser.id, authToken);

    return circles.map(circle => ({
      id: circle.id,
      name: circle.name,
      description: circle.description,
      inviteCode: circle.inviteCode,
      isPublic: circle.isPublic,
      createdBy: circle.createdBy,
      createdAt: circle.createdAt,
      memberCount: circle.memberCount,
      currentUserRole: circle.currentUserRole,
    }));
  }

  /**
   * Get circle details including members and shared tools
   */
  @Get('/{id}')
  @Security('Bearer')
  public async getCircle(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<CircleDetailResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Check if user is a member of this circle
    const membership = await dabClient.getCircleMembership(id, dbUser.id, authToken);
    if (!membership) {
      this.setStatus(403);
      throw new Error('Not a member of this circle');
    }

    // Get circle details
    const circle = await dabClient.getCircleById(id, authToken);
    if (!circle) {
      this.setStatus(404);
      throw new Error('Circle not found');
    }

    // Get members
    const members = await dabClient.getCircleMembers(id, authToken);

    // Get tools shared with this circle
    const tools = await dabClient.getCircleTools(id, authToken);

    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      inviteCode: circle.inviteCode,
      isPublic: circle.isPublic,
      createdBy: circle.createdBy,
      createdAt: circle.createdAt,
      memberCount: members.length,
      currentUserRole: membership.role,
      members: members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user
          ? {
              id: m.user.id,
              displayName: m.user.displayName,
              email: m.user.email,
              avatarUrl: m.user.avatarUrl,
              reputationScore: m.user.reputationScore,
            }
          : undefined,
      })),
      tools: tools.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        brand: t.brand,
        model: t.model,
        status: t.status,
        owner: t.owner
          ? {
              id: t.owner.id,
              displayName: t.owner.displayName,
              avatarUrl: t.owner.avatarUrl,
            }
          : undefined,
        primaryPhotoUrl: t.photos?.find(p => p.isPrimary)?.url || t.photos?.[0]?.url,
      })),
    };
  }

  // ==================== JOIN CIRCLE ====================

  /**
   * Join a circle using an invite code
   */
  @Post('/{id}/join')
  @Security('Bearer')
  public async joinCircle(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body: JoinCircleRequest
  ): Promise<CircleResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Get circle and verify invite code
    const circle = await dabClient.getCircleById(id, authToken);
    if (!circle) {
      this.setStatus(404);
      throw new Error('Circle not found');
    }

    if (circle.inviteCode !== body.inviteCode) {
      this.setStatus(400);
      throw new Error('Invalid invite code');
    }

    // Check if already a member
    const existingMembership = await dabClient.getCircleMembership(id, dbUser.id, authToken);
    if (existingMembership) {
      this.setStatus(400);
      throw new Error('Already a member of this circle');
    }

    // Add as member
    await dabClient.createCircleMember(
      {
        circleId: id,
        userId: dbUser.id,
        role: 'member',
      },
      authToken
    );

    // Get updated member count
    const members = await dabClient.getCircleMembers(id, authToken);

    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      inviteCode: circle.inviteCode,
      isPublic: circle.isPublic,
      createdBy: circle.createdBy,
      createdAt: circle.createdAt,
      memberCount: members.length,
      currentUserRole: 'member',
    };
  }

  /**
   * Join a circle by invite code (without knowing circle ID)
   */
  @Post('/join')
  @Security('Bearer')
  public async joinCircleByCode(
    @Request() request: ExpressRequest,
    @Body() body: JoinCircleRequest
  ): Promise<CircleResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Find circle by invite code
    const circle = await dabClient.getCircleByInviteCode(body.inviteCode, authToken);
    if (!circle) {
      this.setStatus(404);
      throw new Error('Invalid invite code');
    }

    // Check if already a member
    const existingMembership = await dabClient.getCircleMembership(circle.id, dbUser.id, authToken);
    if (existingMembership) {
      this.setStatus(400);
      throw new Error('Already a member of this circle');
    }

    // Add as member
    await dabClient.createCircleMember(
      {
        circleId: circle.id,
        userId: dbUser.id,
        role: 'member',
      },
      authToken
    );

    // Get updated member count
    const members = await dabClient.getCircleMembers(circle.id, authToken);

    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      inviteCode: circle.inviteCode,
      isPublic: circle.isPublic,
      createdBy: circle.createdBy,
      createdAt: circle.createdAt,
      memberCount: members.length,
      currentUserRole: 'member',
    };
  }

  // ==================== INVITE MANAGEMENT ====================

  /**
   * Generate/get invite code for a circle (admin only)
   */
  @Post('/{id}/invite')
  @Security('Bearer')
  public async getInvite(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<InviteResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Check if user is admin/owner of this circle
    const membership = await dabClient.getCircleMembership(id, dbUser.id, authToken);
    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      this.setStatus(403);
      throw new Error('Only admins can generate invites');
    }

    // Get circle
    const circle = await dabClient.getCircleById(id, authToken);
    if (!circle) {
      this.setStatus(404);
      throw new Error('Circle not found');
    }

    // Return the invite code (could also regenerate here if needed)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl = `${baseUrl}/circles/join?code=${circle.inviteCode}`;

    return {
      inviteCode: circle.inviteCode,
      inviteUrl,
    };
  }

  // ==================== MEMBER MANAGEMENT ====================

  /**
   * Remove a member from a circle (admin only)
   */
  @Delete('/{id}/members/{userId}')
  @Security('Bearer')
  @SuccessResponse(204, 'No Content')
  public async removeMember(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Path() userId: string
  ): Promise<void> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Check if user is admin/owner of this circle
    const membership = await dabClient.getCircleMembership(id, dbUser.id, authToken);
    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      this.setStatus(403);
      throw new Error('Only admins can remove members');
    }

    // Get the target member's membership
    const targetMembership = await dabClient.getCircleMembership(id, userId, authToken);
    if (!targetMembership) {
      this.setStatus(404);
      throw new Error('Member not found');
    }

    // Cannot remove the owner
    if (targetMembership.role === 'owner') {
      this.setStatus(400);
      throw new Error('Cannot remove the circle owner');
    }

    // Admins cannot remove other admins (only owners can)
    if (targetMembership.role === 'admin' && membership.role !== 'owner') {
      this.setStatus(403);
      throw new Error('Only owners can remove admins');
    }

    // Remove the member
    await dabClient.deleteCircleMember(targetMembership.id, authToken);

    this.setStatus(204);
  }

  /**
   * Update a member's role in a circle (admin only)
   */
  @Put('/{id}/members/{userId}')
  @Security('Bearer')
  public async updateMemberRole(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Path() userId: string,
    @Body() body: UpdateCircleMemberRoleRequest
  ): Promise<CircleMemberResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Check if user is admin/owner of this circle
    const membership = await dabClient.getCircleMembership(id, dbUser.id, authToken);
    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      this.setStatus(403);
      throw new Error('Only admins can change member roles');
    }

    // Get the target member's membership
    const targetMembership = await dabClient.getCircleMembership(id, userId, authToken);
    if (!targetMembership) {
      this.setStatus(404);
      throw new Error('Member not found');
    }

    // Cannot change owner's role
    if (targetMembership.role === 'owner') {
      this.setStatus(400);
      throw new Error('Cannot change owner role');
    }

    // Only owner can promote/demote admins
    if ((targetMembership.role === 'admin' || body.role === 'admin') && membership.role !== 'owner') {
      this.setStatus(403);
      throw new Error('Only owners can promote to or demote from admin');
    }

    // Update the role
    const updated = await dabClient.updateCircleMember(
      targetMembership.id,
      { role: body.role },
      authToken
    );

    // Get user details for response
    const memberUser = await dabClient.getUserById(userId, authToken);

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      joinedAt: updated.joinedAt,
      user: memberUser
        ? {
            id: memberUser.id,
            displayName: memberUser.displayName,
            email: memberUser.email,
            avatarUrl: memberUser.avatarUrl,
            reputationScore: memberUser.reputationScore,
          }
        : undefined,
    };
  }

  /**
   * Leave a circle (current user)
   */
  @Delete('/{id}/members/me')
  @Security('Bearer')
  @SuccessResponse(204, 'No Content')
  public async leaveCircle(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<void> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    // Get membership
    const membership = await dabClient.getCircleMembership(id, dbUser.id, authToken);
    if (!membership) {
      this.setStatus(404);
      throw new Error('Not a member of this circle');
    }

    // Owner cannot leave (must transfer ownership first)
    if (membership.role === 'owner') {
      this.setStatus(400);
      throw new Error('Owner cannot leave. Transfer ownership first.');
    }

    // Remove membership
    await dabClient.deleteCircleMember(membership.id, authToken);

    this.setStatus(204);
  }

  // ==================== HELPER METHODS ====================

  private getAuthToken(request: ExpressRequest): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return undefined;
  }
}
