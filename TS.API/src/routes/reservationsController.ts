import {
  Controller,
  Get,
  Post,
  Path,
  Body,
  Query,
  Route,
  Tags,
  Security,
  Request,
  SuccessResponse,
  Response,
  UploadedFile,
  FormField,
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../middleware/auth';
import * as dabService from '../services/dabService';
import * as notificationService from '../services/notificationService';
import { blobStorageService } from '../services/blobStorageService';

// Request/Response interfaces
interface CreateReservationRequest {
  toolId: string;
  startDate: string;
  endDate: string;
  note?: string;
}

interface ActionRequest {
  note?: string;
}

interface DeclineRequest {
  reason: string;
}

interface ReservationResponse {
  id: string;
  toolId: string;
  borrowerId: string;
  status: string;
  startDate: string;
  endDate: string;
  note?: string;
  ownerNote?: string;
  pickupConfirmedAt?: string;
  returnConfirmedAt?: string;
  createdAt: string;
  updatedAt?: string;
  tool?: ReservationToolInfo;
  borrower?: ReservationUserInfo;
}

interface ReservationToolInfo {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  status: string;
  owner?: ReservationUserInfo;
  photos?: ReservationPhotoInfo[];
}

interface ReservationUserInfo {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  reputationScore?: number;
}

interface ReservationPhotoInfo {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ReservationListResponse {
  items: ReservationResponse[];
  total: number;
}

interface DashboardStatsResponse {
  toolsListed: number;
  activeLoans: number;
  pendingRequests: number;
}

interface ReservationErrorResponse {
  message: string;
  code?: string;
}

// Loan Photo interfaces
interface LoanPhotoResponse {
  id: string;
  reservationId: string;
  type: 'before' | 'after';
  url: string;
  uploadedBy: string;
  notes?: string;
  uploadedAt: string;
}

// Review interfaces
interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

interface ReviewResponse {
  id: string;
  reservationId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: ReviewUserInfo;
  reviewee?: ReviewUserInfo;
}

interface ReviewUserInfo {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

interface UserReviewsResponse {
  reviews: ReviewResponse[];
  averageRating: number;
  totalReviews: number;
}

// Notification interfaces
interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationListResponse {
  items: NotificationResponse[];
  unreadCount: number;
}

@Route('api/reservations')
@Tags('Reservations')
export class ReservationsController extends Controller {
  /**
   * Create a new reservation request
   * @summary Request to borrow a tool
   */
  @Post('/')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  @Response<ReservationErrorResponse>(400, 'Bad Request - Invalid dates or tool not available')
  @Response<ReservationErrorResponse>(404, 'Tool not found')
  @Response<ReservationErrorResponse>(409, 'Conflict - Dates overlap with existing reservation')
  public async createReservation(
    @Request() request: ExpressRequest,
    @Body() body: CreateReservationRequest
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      this.setStatus(400);
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }

    if (startDate < today) {
      this.setStatus(400);
      throw new Error('Start date cannot be in the past.');
    }

    if (endDate < startDate) {
      this.setStatus(400);
      throw new Error('End date must be after start date.');
    }

    // Get the tool to validate it exists and check availability
    const tool = await dabService.getToolById(body.toolId, authToken);
    if (!tool) {
      this.setStatus(404);
      throw new Error('Tool not found.');
    }

    if (tool.status !== 'available') {
      this.setStatus(400);
      throw new Error('Tool is not available for reservations.');
    }

    // Get the user's internal ID
    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(400);
      throw new Error('User not found. Please complete your profile first.');
    }

    // Cannot reserve your own tool
    if (tool.ownerId === dbUser.id) {
      this.setStatus(400);
      throw new Error('You cannot reserve your own tool.');
    }

    // Check if borrower shares a circle with the tool
    const sharesCircle = await dabService.userSharesCircleWithTool(dbUser.id, body.toolId, authToken);
    if (!sharesCircle) {
      this.setStatus(403);
      throw new Error('You can only request tools from circles you are a member of.');
    }

    // Check advance notice requirement
    const daysDifference = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference < tool.advanceNoticeDays) {
      this.setStatus(400);
      throw new Error(`This tool requires at least ${tool.advanceNoticeDays} day(s) advance notice.`);
    }

    // Check max loan duration
    const loanDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (loanDays > tool.maxLoanDays) {
      this.setStatus(400);
      throw new Error(`Maximum loan duration for this tool is ${tool.maxLoanDays} days.`);
    }

    // Check for date conflicts
    const hasConflict = await dabService.checkDateConflicts(
      body.toolId,
      body.startDate,
      body.endDate,
      undefined,
      authToken
    );

    if (hasConflict) {
      this.setStatus(409);
      throw new Error('The requested dates conflict with an existing reservation.');
    }

    // Create the reservation
    const reservation = await dabService.createReservation(
      {
        toolId: body.toolId,
        borrowerId: dbUser.id,
        startDate: body.startDate,
        endDate: body.endDate,
        note: body.note,
      },
      authToken
    );

    // Send notification to tool owner
    if (tool.owner) {
      await notificationService.notifyReservationRequest(
        tool.ownerId,
        dbUser.displayName,
        tool.name,
        reservation.id,
        body.startDate,
        body.endDate,
        authToken
      );
    }

    this.setStatus(201);
    return reservation as ReservationResponse;
  }

  /**
   * Get all reservations for the current user
   * @summary List user's reservations (as borrower and/or lender)
   */
  @Get('/')
  @Security('Bearer')
  public async getReservations(
    @Request() request: ExpressRequest,
    @Query() role?: 'borrower' | 'lender' | 'all',
    @Query() status?: string
  ): Promise<ReservationListResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      return { items: [], total: 0 };
    }

    const effectiveRole = role || 'all';
    let reservations: ReservationResponse[] = [];

    if (effectiveRole === 'borrower' || effectiveRole === 'all') {
      const borrowerReservations = await dabService.getReservationsByBorrower(dbUser.id, authToken);
      reservations = [...reservations, ...borrowerReservations];
    }

    if (effectiveRole === 'lender' || effectiveRole === 'all') {
      const lenderReservations = await dabService.getReservationsForOwner(dbUser.id, authToken);
      // Avoid duplicates if user is both borrower and lender on same reservation
      const existingIds = new Set(reservations.map(r => r.id));
      for (const r of lenderReservations) {
        if (!existingIds.has(r.id)) {
          reservations.push(r);
        }
      }
    }

    // Filter by status if provided
    if (status) {
      const statuses = status.split(',').map(s => s.trim().toLowerCase());
      reservations = reservations.filter(r => statuses.includes(r.status.toLowerCase()));
    }

    // Sort by start date descending
    reservations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return {
      items: reservations,
      total: reservations.length,
    };
  }

  /**
   * Get a specific reservation by ID
   * @summary Get reservation details
   */
  @Get('/{id}')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  @Response<ReservationErrorResponse>(403, 'Not authorized to view this reservation')
  public async getReservation(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    // Check if user has access (is borrower or tool owner)
    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(403);
      throw new Error('Not authorized to view this reservation.');
    }

    const isBorrower = reservation.borrowerId === dbUser.id;
    const isOwner = reservation.tool?.ownerId === dbUser.id;

    if (!isBorrower && !isOwner) {
      this.setStatus(403);
      throw new Error('Not authorized to view this reservation.');
    }

    return reservation as ReservationResponse;
  }

  /**
   * Approve a pending reservation
   * @summary Approve reservation (owner only)
   */
  @Post('/{id}/approve')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(400, 'Reservation is not in pending status')
  @Response<ReservationErrorResponse>(403, 'Only the tool owner can approve reservations')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  @Response<ReservationErrorResponse>(409, 'Conflict - Dates now overlap with another reservation')
  public async approveReservation(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body?: ActionRequest
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    // Verify user is the tool owner
    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser || reservation.tool?.ownerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Only the tool owner can approve reservations.');
    }

    if (reservation.status !== 'pending') {
      this.setStatus(400);
      throw new Error(`Cannot approve a reservation with status "${reservation.status}".`);
    }

    // Re-check for conflicts (in case another reservation was approved in the meantime)
    const hasConflict = await dabService.checkDateConflicts(
      reservation.toolId,
      reservation.startDate,
      reservation.endDate,
      id,
      authToken
    );

    if (hasConflict) {
      this.setStatus(409);
      throw new Error('The dates now conflict with another reservation. Please decline this request.');
    }

    const updated = await dabService.updateReservation(
      id,
      {
        status: 'confirmed',
        ownerNote: body?.note,
      },
      authToken
    );

    // Send notification to borrower
    if (reservation.borrower && reservation.tool?.owner) {
      await notificationService.notifyReservationApproved(
        reservation.borrowerId,
        reservation.tool.owner.displayName,
        reservation.tool.name,
        id,
        reservation.startDate,
        authToken
      );
    }

    return updated as ReservationResponse;
  }

  /**
   * Decline a pending reservation
   * @summary Decline reservation (owner only)
   */
  @Post('/{id}/decline')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(400, 'Reservation is not in pending status')
  @Response<ReservationErrorResponse>(403, 'Only the tool owner can decline reservations')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async declineReservation(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body: DeclineRequest
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser || reservation.tool?.ownerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Only the tool owner can decline reservations.');
    }

    if (reservation.status !== 'pending') {
      this.setStatus(400);
      throw new Error(`Cannot decline a reservation with status "${reservation.status}".`);
    }

    const updated = await dabService.updateReservation(
      id,
      {
        status: 'declined',
        ownerNote: body.reason,
      },
      authToken
    );

    // Send notification to borrower
    if (reservation.borrower && reservation.tool?.owner) {
      await notificationService.notifyReservationDeclined(
        reservation.borrowerId,
        reservation.tool.owner.displayName,
        reservation.tool.name,
        id,
        body.reason,
        authToken
      );
    }

    return updated as ReservationResponse;
  }

  /**
   * Cancel a reservation
   * @summary Cancel reservation (borrower or owner)
   */
  @Post('/{id}/cancel')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(400, 'Reservation cannot be cancelled')
  @Response<ReservationErrorResponse>(403, 'Not authorized to cancel this reservation')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async cancelReservation(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body?: ActionRequest
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(403);
      throw new Error('Not authorized to cancel this reservation.');
    }

    const isBorrower = reservation.borrowerId === dbUser.id;
    const isOwner = reservation.tool?.ownerId === dbUser.id;

    if (!isBorrower && !isOwner) {
      this.setStatus(403);
      throw new Error('Not authorized to cancel this reservation.');
    }

    // Can only cancel pending, confirmed, or active reservations
    const cancellableStatuses = ['pending', 'confirmed', 'active'];
    if (!cancellableStatuses.includes(reservation.status)) {
      this.setStatus(400);
      throw new Error(`Cannot cancel a reservation with status "${reservation.status}".`);
    }

    const updated = await dabService.updateReservation(
      id,
      {
        status: 'cancelled',
        ownerNote: body?.note || (isOwner ? 'Cancelled by owner' : 'Cancelled by borrower'),
      },
      authToken
    );

    return updated as ReservationResponse;
  }

  /**
   * Confirm tool pickup
   * @summary Confirm pickup (borrower only) - requires at least 1 before photo
   */
  @Post('/{id}/pickup')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(400, 'Reservation is not in confirmed status or missing before photo')
  @Response<ReservationErrorResponse>(403, 'Only the borrower can confirm pickup')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async confirmPickup(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body?: ActionRequest
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser || reservation.borrowerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Only the borrower can confirm pickup.');
    }

    if (reservation.status !== 'confirmed') {
      this.setStatus(400);
      throw new Error(`Cannot confirm pickup for a reservation with status "${reservation.status}".`);
    }

    // Check for at least one before photo
    const beforePhotos = await dabService.getLoanPhotosByType(id, 'before', authToken);
    if (beforePhotos.length === 0) {
      this.setStatus(400);
      throw new Error('At least one "before" photo is required to confirm pickup.');
    }

    const updated = await dabService.updateReservation(
      id,
      {
        status: 'active',
        pickupConfirmedAt: new Date().toISOString(),
        ownerNote: body?.note,
      },
      authToken
    );

    // Send notification to owner that loan has started
    if (reservation.tool?.owner && reservation.borrower) {
      await notificationService.notifyLoanStarted(
        reservation.tool.ownerId,
        reservation.borrower.displayName,
        reservation.tool.name,
        id,
        authToken
      );
    }

    return updated as ReservationResponse;
  }

  /**
   * Confirm tool return
   * @summary Confirm return (borrower only) - requires at least 1 after photo
   */
  @Post('/{id}/return')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(400, 'Reservation is not in active status or missing after photo')
  @Response<ReservationErrorResponse>(403, 'Only the borrower can confirm return')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async confirmReturn(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body?: ActionRequest
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser || reservation.borrowerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Only the borrower can confirm return.');
    }

    if (reservation.status !== 'active') {
      this.setStatus(400);
      throw new Error(`Cannot confirm return for a reservation with status "${reservation.status}".`);
    }

    // Check for at least one after photo
    const afterPhotos = await dabService.getLoanPhotosByType(id, 'after', authToken);
    if (afterPhotos.length === 0) {
      this.setStatus(400);
      throw new Error('At least one "after" photo is required to confirm return.');
    }

    const updated = await dabService.updateReservation(
      id,
      {
        status: 'completed',
        returnConfirmedAt: new Date().toISOString(),
        ownerNote: body?.note,
      },
      authToken
    );

    // Send notification to owner that loan has completed
    if (reservation.tool?.owner && reservation.borrower) {
      await notificationService.notifyLoanCompleted(
        reservation.tool.ownerId,
        reservation.borrower.displayName,
        reservation.tool.name,
        id,
        authToken
      );
    }

    return updated as ReservationResponse;
  }

  /**
   * Get dashboard statistics for the current user
   * @summary Get dashboard stats
   */
  @Get('/stats/dashboard')
  @Security('Bearer')
  public async getDashboardStats(
    @Request() request: ExpressRequest
  ): Promise<DashboardStatsResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      return {
        toolsListed: 0,
        activeLoans: 0,
        pendingRequests: 0,
      };
    }

    return dabService.getDashboardStats(dbUser.id, authToken);
  }

  // ============================================================================
  // Loan Photo Endpoints
  // ============================================================================

  /**
   * Upload a loan photo (before or after)
   * @summary Upload condition photo for a reservation
   */
  @Post('/{id}/photos')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  @Response<ReservationErrorResponse>(400, 'Bad Request - Invalid photo type')
  @Response<ReservationErrorResponse>(403, 'Not authorized to upload photos for this reservation')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async uploadLoanPhoto(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @UploadedFile() file: Express.Multer.File,
    @FormField() type: 'before' | 'after',
    @FormField() notes?: string
  ): Promise<LoanPhotoResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Validate photo type
    if (!['before', 'after'].includes(type)) {
      this.setStatus(400);
      throw new Error('Photo type must be "before" or "after".');
    }

    // Get the reservation
    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    // Get the current user
    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(403);
      throw new Error('User not found.');
    }

    // Only borrower or owner can upload photos
    const isBorrower = reservation.borrowerId === dbUser.id;
    const isOwner = reservation.tool?.ownerId === dbUser.id;

    if (!isBorrower && !isOwner) {
      this.setStatus(403);
      throw new Error('Only the borrower or tool owner can upload photos.');
    }

    // Validate based on reservation status and photo type
    if (type === 'before') {
      if (!['confirmed', 'active'].includes(reservation.status)) {
        this.setStatus(400);
        throw new Error('Before photos can only be uploaded for confirmed or active reservations.');
      }
    } else if (type === 'after') {
      if (reservation.status !== 'active') {
        this.setStatus(400);
        throw new Error('After photos can only be uploaded for active reservations.');
      }
    }

    // Upload file to blob storage
    const uploadResult = await blobStorageService.uploadFile(
      file.buffer,
      file.originalname,
      `loans/${id}/${type}`,
      file.mimetype
    );

    // Generate SAS URL for access
    const sasUrl = blobStorageService.generateSasUrl(uploadResult.blobName, 60 * 24 * 365); // 1 year expiry

    // Create loan photo record
    const loanPhoto = await dabService.createLoanPhoto(
      {
        reservationId: id,
        type,
        url: sasUrl.url,
        uploadedBy: dbUser.id,
        notes,
      },
      authToken
    );

    this.setStatus(201);
    return loanPhoto as LoanPhotoResponse;
  }

  /**
   * Get loan photos for a reservation
   * @summary Get condition photos for a reservation
   */
  @Get('/{id}/photos')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(403, 'Not authorized to view this reservation')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async getLoanPhotos(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Query() type?: 'before' | 'after'
  ): Promise<LoanPhotoResponse[]> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(403);
      throw new Error('Not authorized to view this reservation.');
    }

    const isBorrower = reservation.borrowerId === dbUser.id;
    const isOwner = reservation.tool?.ownerId === dbUser.id;

    if (!isBorrower && !isOwner) {
      this.setStatus(403);
      throw new Error('Not authorized to view this reservation.');
    }

    if (type) {
      return dabService.getLoanPhotosByType(id, type, authToken) as Promise<LoanPhotoResponse[]>;
    }

    return dabService.getLoanPhotos(id, authToken) as Promise<LoanPhotoResponse[]>;
  }

  // ============================================================================
  // Review Endpoints
  // ============================================================================

  /**
   * Submit a review for a completed reservation
   * @summary Leave a review after completing a reservation
   */
  @Post('/{id}/review')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  @Response<ReservationErrorResponse>(400, 'Bad Request - Reservation not completed or review already exists')
  @Response<ReservationErrorResponse>(403, 'Not authorized to review this reservation')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async createReview(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body: CreateReviewRequest
  ): Promise<ReviewResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Validate rating
    if (body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
      this.setStatus(400);
      throw new Error('Rating must be an integer between 1 and 5.');
    }

    // Get the reservation
    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    // Get the current user
    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(403);
      throw new Error('User not found.');
    }

    // Check if user is part of this reservation
    const isBorrower = reservation.borrowerId === dbUser.id;
    const isOwner = reservation.tool?.ownerId === dbUser.id;

    if (!isBorrower && !isOwner) {
      this.setStatus(403);
      throw new Error('Only participants in this reservation can leave reviews.');
    }

    // Only completed reservations can be reviewed
    if (reservation.status !== 'completed') {
      this.setStatus(400);
      throw new Error('Reviews can only be submitted for completed reservations.');
    }

    // Determine who is being reviewed
    // Borrower reviews the owner, owner reviews the borrower
    const revieweeId = isBorrower ? reservation.tool?.ownerId : reservation.borrowerId;
    if (!revieweeId) {
      this.setStatus(400);
      throw new Error('Unable to determine reviewee.');
    }

    // Check if user has already reviewed this reservation
    const existingReview = await dabService.getReviewForReservation(id, dbUser.id, authToken);
    if (existingReview) {
      this.setStatus(400);
      throw new Error('You have already submitted a review for this reservation.');
    }

    // Create the review
    const review = await dabService.createReview(
      {
        reservationId: id,
        reviewerId: dbUser.id,
        revieweeId,
        rating: body.rating,
        comment: body.comment,
      },
      authToken
    );

    // Update the reviewee's reputation score
    await dabService.updateUserReputationScore(revieweeId, authToken);

    // Send notification to reviewee
    const reviewerUser = await dabService.getUserById(dbUser.id, authToken);
    if (reviewerUser) {
      await notificationService.notifyReviewReceived(
        revieweeId,
        reviewerUser.displayName,
        body.rating,
        id,
        authToken
      );
    }

    this.setStatus(201);
    return review as ReviewResponse;
  }

  /**
   * Get reviews for a reservation
   * @summary Get all reviews for a reservation
   */
  @Get('/{id}/reviews')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(403, 'Not authorized to view this reservation')
  @Response<ReservationErrorResponse>(404, 'Reservation not found')
  public async getReservationReviews(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<ReviewResponse[]> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const reservation = await dabService.getReservationById(id, authToken);
    if (!reservation) {
      this.setStatus(404);
      throw new Error('Reservation not found.');
    }

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(403);
      throw new Error('Not authorized to view this reservation.');
    }

    const isBorrower = reservation.borrowerId === dbUser.id;
    const isOwner = reservation.tool?.ownerId === dbUser.id;

    if (!isBorrower && !isOwner) {
      this.setStatus(403);
      throw new Error('Not authorized to view this reservation.');
    }

    return dabService.getReviewsForReservation(id, authToken) as Promise<ReviewResponse[]>;
  }
}

/**
 * Notifications Controller
 * Handles notification endpoints
 */
@Route('api/notifications')
@Tags('Notifications')
export class NotificationsController extends Controller {
  /**
   * Get notifications for the current user
   * @summary Get user's notifications
   */
  @Get('/')
  @Security('Bearer')
  public async getNotifications(
    @Request() request: ExpressRequest,
    @Query() limit?: number
  ): Promise<NotificationListResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      return { items: [], unreadCount: 0 };
    }

    const notifications = await dabService.getNotificationsForUser(
      dbUser.id,
      limit || 50,
      authToken
    );
    const unreadCount = await dabService.getUnreadNotificationCount(dbUser.id, authToken);

    return {
      items: notifications as NotificationResponse[],
      unreadCount,
    };
  }

  /**
   * Get unread notification count
   * @summary Get count of unread notifications
   */
  @Get('/unread-count')
  @Security('Bearer')
  public async getUnreadCount(
    @Request() request: ExpressRequest
  ): Promise<{ count: number }> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      return { count: 0 };
    }

    const count = await dabService.getUnreadNotificationCount(dbUser.id, authToken);
    return { count };
  }

  /**
   * Mark a notification as read
   * @summary Mark notification as read
   */
  @Post('/{id}/read')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(404, 'Notification not found')
  public async markAsRead(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<NotificationResponse> {
    const authToken = request.headers.authorization?.substring(7);

    const notification = await dabService.markNotificationAsRead(id, authToken);
    return notification as NotificationResponse;
  }

  /**
   * Mark all notifications as read
   * @summary Mark all notifications as read
   */
  @Post('/read-all')
  @Security('Bearer')
  public async markAllAsRead(
    @Request() request: ExpressRequest
  ): Promise<{ success: boolean }> {
    const user = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    const dbUser = await dabService.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      return { success: false };
    }

    await dabService.markAllNotificationsAsRead(dbUser.id, authToken);
    return { success: true };
  }
}

/**
 * User Reviews Controller
 * Handles user review endpoints
 */
@Route('api/users')
@Tags('Users')
export class UserReviewsController extends Controller {
  /**
   * Get reviews for a user
   * @summary Get all reviews for a specific user
   */
  @Get('/{id}/reviews')
  @Security('Bearer')
  public async getUserReviews(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<UserReviewsResponse> {
    const authToken = request.headers.authorization?.substring(7);

    const reviews = await dabService.getReviewsForUser(id, authToken);

    const totalReviews = reviews.length;
    let averageRating = 0;

    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / totalReviews) * 10) / 10;
    }

    return {
      reviews: reviews as ReviewResponse[],
      averageRating,
      totalReviews,
    };
  }
}
