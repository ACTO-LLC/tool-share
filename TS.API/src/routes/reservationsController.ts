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
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../middleware/auth';
import * as dabService from '../services/dabService';

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
   * @summary Confirm pickup (borrower only)
   */
  @Post('/{id}/pickup')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(400, 'Reservation is not in confirmed status')
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

    const updated = await dabService.updateReservation(
      id,
      {
        status: 'active',
        pickupConfirmedAt: new Date().toISOString(),
        ownerNote: body?.note,
      },
      authToken
    );

    return updated as ReservationResponse;
  }

  /**
   * Confirm tool return
   * @summary Confirm return (borrower only)
   */
  @Post('/{id}/return')
  @Security('Bearer')
  @Response<ReservationErrorResponse>(400, 'Reservation is not in active status')
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

    const updated = await dabService.updateReservation(
      id,
      {
        status: 'completed',
        returnConfirmedAt: new Date().toISOString(),
        ownerNote: body?.note,
      },
      authToken
    );

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
}
