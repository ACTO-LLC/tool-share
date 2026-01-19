import {
  Controller,
  Get,
  Put,
  Body,
  Route,
  Tags,
  Security,
  Request,
  SuccessResponse,
  Path,
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
 * Public user profile response (limited fields)
 */
interface PublicProfileResponse {
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
 * Lending history item
 */
interface LendingHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  borrowerName: string;
  borrowerAvatarUrl?: string;
  status: string;
  startDate: string;
  endDate: string;
  completedAt?: string;
}

/**
 * Borrowing history item
 */
interface BorrowingHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  ownerName: string;
  ownerAvatarUrl?: string;
  status: string;
  startDate: string;
  endDate: string;
  completedAt?: string;
}

/**
 * User history response
 */
interface UserHistoryResponse {
  lending: LendingHistoryItem[];
  borrowing: BorrowingHistoryItem[];
  stats: {
    totalLends: number;
    totalBorrows: number;
    activeLends: number;
    activeBorrows: number;
  };
}

/**
 * Review item for display
 */
interface ReviewItem {
  id: string;
  reservationId: string;
  rating: number;
  comment?: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  createdAt: string;
}

/**
 * User reviews response
 */
interface UserReviewsResponse {
  reviews: ReviewItem[];
  averageRating: number;
  totalReviews: number;
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
   * Returns limited public profile information for a user.
   * Does not include private details like email, phone, or address.
   */
  @Get('/{userId}')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getPublicProfile(
    @Path() userId: string,
    @Request() request: ExpressRequest
  ): Promise<PublicProfileResponse> {
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
   * Get current user's lending and borrowing history
   *
   * Returns the authenticated user's complete lending and borrowing history
   * including active and completed transactions.
   */
  @Get('/me/history')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getCurrentUserHistory(
    @Request() request: ExpressRequest
  ): Promise<UserHistoryResponse> {
    const authUser = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Get the user to get their internal ID
    const user = await getUserByExternalId(authUser.id, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const [lending, borrowing, stats] = await Promise.all([
      getUserLendingHistory(user.id, authToken),
      getUserBorrowingHistory(user.id, authToken),
      getUserHistoryStats(user.id, authToken),
    ]);

    return {
      lending,
      borrowing,
      stats,
    };
  }

  /**
   * Get a user's public history
   *
   * Returns public lending and borrowing history for a user.
   * Only shows completed transactions.
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
    const profile = await getPublicUserProfile(userId, authToken);
    if (!profile) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const [lending, borrowing, stats] = await Promise.all([
      getUserLendingHistory(userId, authToken),
      getUserBorrowingHistory(userId, authToken),
      getUserHistoryStats(userId, authToken),
    ]);

    // For public view, only show completed transactions
    return {
      lending: lending.filter(l => l.status === 'completed'),
      borrowing: borrowing.filter(b => b.status === 'completed'),
      stats: {
        totalLends: stats.totalLends,
        totalBorrows: stats.totalBorrows,
        activeLends: 0, // Don't expose active counts for other users
        activeBorrows: 0,
      },
    };
  }

  /**
   * Get reviews received by current user
   *
   * Returns all reviews received by the authenticated user.
   */
  @Get('/me/reviews')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getCurrentUserReviews(
    @Request() request: ExpressRequest
  ): Promise<UserReviewsResponse> {
    const authUser = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Get the user to get their internal ID
    const user = await getUserByExternalId(authUser.id, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const reviews = await getReviewsForUser(user.id, authToken);

    const reviewItems: ReviewItem[] = reviews.map(r => ({
      id: r.id,
      reservationId: r.reservationId,
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.reviewer?.displayName || 'Unknown',
      reviewerAvatarUrl: r.reviewer?.avatarUrl,
      createdAt: r.createdAt,
    }));

    const totalReviews = reviewItems.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviewItems.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    return {
      reviews: reviewItems,
      averageRating,
      totalReviews,
    };
  }

  /**
   * Get reviews received by a user
   *
   * Returns all reviews received by the specified user.
   */
  @Get('/{userId}/reviews')
  @Security('Bearer')
  @SuccessResponse(200, 'Success')
  public async getUserReviews(
    @Path() userId: string,
    @Request() request: ExpressRequest
  ): Promise<UserReviewsResponse> {
    const authToken = request.headers.authorization?.substring(7);

    // Verify user exists
    const profile = await getPublicUserProfile(userId, authToken);
    if (!profile) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const reviews = await getReviewsForUser(userId, authToken);

    const reviewItems: ReviewItem[] = reviews.map(r => ({
      id: r.id,
      reservationId: r.reservationId,
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.reviewer?.displayName || 'Unknown',
      reviewerAvatarUrl: r.reviewer?.avatarUrl,
      createdAt: r.createdAt,
    }));

    const totalReviews = reviewItems.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviewItems.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    return {
      reviews: reviewItems,
      averageRating,
      totalReviews,
    };
  }
}
