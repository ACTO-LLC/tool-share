import {
  Controller,
  Get,
  Put,
  Body,
  Path,
  Route,
  Tags,
  Security,
  Request,
  SuccessResponse,
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../middleware/auth';
import {
  getUserByExternalId,
  getUserById,
  getOrCreateUser,
  updateUser,
  getPublicUserProfile,
  getUserLendingHistory,
  getUserBorrowingHistory,
  getUserHistoryStats,
  getReviewsForUser,
} from '../services/dabService';

/**
 * User profile response
 */
interface UserProfileResponse {
  id: string;
  externalId: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  reputationScore: number;
  notifyEmail: boolean;
  subscriptionStatus: string;
  subscriptionEndsAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Update user profile request
 */
interface UpdateProfileRequest {
  /** User's display name */
  displayName?: string;
  /** Phone number (optional) */
  phone?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** User bio (max 500 characters) */
  bio?: string;
  /** Street address for tool pickup */
  streetAddress?: string;
  /** City */
  city?: string;
  /** State */
  state?: string;
  /** ZIP code */
  zipCode?: string;
  /** Email notification preference */
  notifyEmail?: boolean;
}

/**
 * Public user profile response (no sensitive info)
 */
interface PublicUserProfileResponse {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  state?: string;
  reputationScore: number;
  memberSince: string;
}

/**
 * History item response
 */
interface HistoryItemResponse {
  id: string;
  toolId: string;
  toolName: string;
  toolCategory: string;
  startDate: string;
  endDate: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  hasReview: boolean;
}

/**
 * User history response with stats
 */
interface UserHistoryResponse {
  lendingHistory: HistoryItemResponse[];
  borrowingHistory: HistoryItemResponse[];
  stats: {
    totalLoans: number;
    totalLends: number;
    memberSince: string;
  };
}

/**
 * Review response
 */
interface UserReviewResponse {
  id: string;
  reservationId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  reviewee?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

@Route('api/users')
@Tags('Users')
export class UsersController extends Controller {
  /**
   * Get the current user's profile
   *
   * Returns the authenticated user's profile information.
   * If this is the user's first login, a new user record will be created.
   */
  @Get('/me')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getCurrentUser(
    @Request() request: ExpressRequest
  ): Promise<UserProfileResponse> {
    const authUser = request.user as AuthenticatedUser;

    // Get the auth token from the request to pass to DAB
    const authToken = request.headers.authorization?.substring(7);

    // Get or create user - handles first login user sync
    const user = await getOrCreateUser(
      authUser.id,
      {
        displayName: authUser.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
      },
      authToken
    );

    return {
      id: user.id,
      externalId: user.externalId,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      streetAddress: user.streetAddress,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      reputationScore: user.reputationScore,
      notifyEmail: user.notifyEmail ?? true,
      subscriptionStatus: user.subscriptionStatus || 'trial',
      subscriptionEndsAt: user.subscriptionEndsAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update the current user's profile
   *
   * Updates the authenticated user's profile information.
   * Only fields provided in the request body will be updated.
   */
  @Put('/me')
  @Security('Bearer')
  @SuccessResponse(200, 'Profile updated successfully')
  public async updateCurrentUser(
    @Request() request: ExpressRequest,
    @Body() body: UpdateProfileRequest
  ): Promise<UserProfileResponse> {
    const authUser = request.user as AuthenticatedUser;

    // Get the auth token from the request to pass to DAB
    const authToken = request.headers.authorization?.substring(7);

    // First get the user to ensure they exist and get their internal ID
    const existingUser = await getUserByExternalId(authUser.id, authToken);

    if (!existingUser) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    // Validate bio length
    if (body.bio && body.bio.length > 500) {
      this.setStatus(400);
      throw new Error('Bio must be 500 characters or less');
    }

    // Validate display name
    if (body.displayName !== undefined && body.displayName.trim() === '') {
      this.setStatus(400);
      throw new Error('Display name cannot be empty');
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.displayName !== undefined) updateData.displayName = body.displayName.trim();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.streetAddress !== undefined) updateData.streetAddress = body.streetAddress;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode;
    if (body.notifyEmail !== undefined) updateData.notifyEmail = body.notifyEmail;

    // Update the user
    const updatedUser = await updateUser(
      existingUser.id,
      updateData as {
        displayName?: string;
        phone?: string;
        avatarUrl?: string;
        bio?: string;
        streetAddress?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        notifyEmail?: boolean;
      },
      authToken
    );

    return {
      id: updatedUser.id,
      externalId: updatedUser.externalId,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      streetAddress: updatedUser.streetAddress,
      city: updatedUser.city,
      state: updatedUser.state,
      zipCode: updatedUser.zipCode,
      reputationScore: updatedUser.reputationScore,
      notifyEmail: updatedUser.notifyEmail ?? true,
      subscriptionStatus: updatedUser.subscriptionStatus || 'trial',
      subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * Get a user's public profile
   *
   * Returns public profile information for a user.
   * Sensitive info (email, phone, address) is not included.
   */
  @Get('/{userId}')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getPublicProfile(
    @Path() userId: string,
    @Request() request: ExpressRequest
  ): Promise<PublicUserProfileResponse> {
    const authToken = request.headers.authorization?.substring(7);

    const profile = await getPublicUserProfile(userId, authToken);

    if (!profile) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    return {
      id: profile.id,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      city: profile.city,
      state: profile.state,
      reputationScore: profile.reputationScore,
      memberSince: profile.createdAt,
    };
  }

  /**
   * Get the current user's history
   *
   * Returns the authenticated user's lending and borrowing history.
   */
  @Get('/me/history')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getMyHistory(
    @Request() request: ExpressRequest
  ): Promise<UserHistoryResponse> {
    const authUser = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Get user to get their internal ID
    const user = await getUserByExternalId(authUser.id, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const [lendingHistory, borrowingHistory, stats] = await Promise.all([
      getUserLendingHistory(user.id, authToken),
      getUserBorrowingHistory(user.id, authToken),
      getUserHistoryStats(user.id, authToken),
    ]);

    return {
      lendingHistory,
      borrowingHistory,
      stats,
    };
  }

  /**
   * Get a user's public history
   *
   * Returns public lending and borrowing history for a user.
   */
  @Get('/{userId}/history')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getUserHistory(
    @Path() userId: string,
    @Request() request: ExpressRequest
  ): Promise<UserHistoryResponse> {
    const authToken = request.headers.authorization?.substring(7);

    // Verify user exists
    const user = await getUserById(userId, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const [lendingHistory, borrowingHistory, stats] = await Promise.all([
      getUserLendingHistory(userId, authToken),
      getUserBorrowingHistory(userId, authToken),
      getUserHistoryStats(userId, authToken),
    ]);

    return {
      lendingHistory,
      borrowingHistory,
      stats,
    };
  }

  /**
   * Get the current user's reviews
   *
   * Returns reviews received by the authenticated user.
   */
  @Get('/me/reviews')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getMyReviews(
    @Request() request: ExpressRequest
  ): Promise<UserReviewResponse[]> {
    const authUser = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Get user to get their internal ID
    const user = await getUserByExternalId(authUser.id, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const reviews = await getReviewsForUser(user.id, authToken);

    return reviews.map((review) => ({
      id: review.id,
      reservationId: review.reservationId,
      reviewerId: review.reviewerId,
      revieweeId: review.revieweeId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: review.reviewer,
      reviewee: review.reviewee,
    }));
  }

  /**
   * Get a user's reviews
   *
   * Returns reviews received by a user.
   */
  @Get('/{userId}/reviews')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getUserReviews(
    @Path() userId: string,
    @Request() request: ExpressRequest
  ): Promise<UserReviewResponse[]> {
    const authToken = request.headers.authorization?.substring(7);

    // Verify user exists
    const user = await getUserById(userId, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const reviews = await getReviewsForUser(userId, authToken);

    return reviews.map((review) => ({
      id: review.id,
      reservationId: review.reservationId,
      reviewerId: review.reviewerId,
      revieweeId: review.revieweeId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: review.reviewer,
      reviewee: review.reviewee,
    }));
  }
}
