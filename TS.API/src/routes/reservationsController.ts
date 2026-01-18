import {
  Controller,
  Get,
  Post,
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

interface CreateReservationRequest {
  toolId: string;
  startDate: string;
  endDate: string;
  note?: string;
}

interface ReservationResponse {
  id: string;
  toolId: string;
  borrowerId: string;
  status: string;
  startDate: string;
  endDate: string;
  note?: string;
  createdAt: string;
}

@Route('api/reservations')
@Tags('Reservations')
export class ReservationsController extends Controller {
  @Post('/')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  public async createReservation(
    @Request() request: ExpressRequest,
    @Body() body: CreateReservationRequest
  ): Promise<ReservationResponse> {
    const user = request.user as AuthenticatedUser;

    // TODO: Implement conflict checking
    // TODO: Save to database via DAB

    this.setStatus(201);
    return {
      id: crypto.randomUUID(),
      toolId: body.toolId,
      borrowerId: user.id,
      status: 'pending',
      startDate: body.startDate,
      endDate: body.endDate,
      note: body.note,
      createdAt: new Date().toISOString(),
    };
  }

  @Get('/{id}')
  @Security('Bearer')
  public async getReservation(@Path() id: string): Promise<ReservationResponse | null> {
    // TODO: Fetch from database via DAB
    console.log('Getting reservation:', id);
    return null;
  }

  @Post('/{id}/approve')
  @Security('Bearer')
  public async approveReservation(
    @Request() _request: ExpressRequest,
    @Path() id: string
  ): Promise<ReservationResponse | null> {
    // TODO: Validate owner, update status
    console.log('Approving reservation:', id);
    return null;
  }

  @Post('/{id}/decline')
  @Security('Bearer')
  public async declineReservation(
    @Request() _request: ExpressRequest,
    @Path() id: string,
    @Body() body: { reason: string }
  ): Promise<ReservationResponse | null> {
    // TODO: Validate owner, update status
    console.log('Declining reservation:', id, body.reason);
    return null;
  }

  @Post('/{id}/cancel')
  @Security('Bearer')
  public async cancelReservation(
    @Request() _request: ExpressRequest,
    @Path() id: string
  ): Promise<ReservationResponse | null> {
    // TODO: Validate borrower or owner, update status
    console.log('Cancelling reservation:', id);
    return null;
  }

  @Post('/{id}/pickup')
  @Security('Bearer')
  public async confirmPickup(
    @Request() _request: ExpressRequest,
    @Path() id: string
  ): Promise<ReservationResponse | null> {
    // TODO: Validate borrower, update status
    console.log('Confirming pickup:', id);
    return null;
  }

  @Post('/{id}/return')
  @Security('Bearer')
  public async confirmReturn(
    @Request() _request: ExpressRequest,
    @Path() id: string
  ): Promise<ReservationResponse | null> {
    // TODO: Validate borrower, update status
    console.log('Confirming return:', id);
    return null;
  }
}
