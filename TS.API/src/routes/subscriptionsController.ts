import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  Security,
  Request,
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../middleware/auth';
import Stripe from 'stripe';
import { config } from '../config/env';

const stripe = config.STRIPE_SECRET_KEY
  ? new Stripe(config.STRIPE_SECRET_KEY)
  : null;

interface CheckoutResponse {
  checkoutUrl: string;
}

interface PortalResponse {
  portalUrl: string;
}

@Route('api/subscriptions')
@Tags('Subscriptions')
export class SubscriptionsController extends Controller {
  @Post('/checkout')
  @Security('Bearer')
  public async createCheckout(
    @Request() request: ExpressRequest
  ): Promise<CheckoutResponse> {
    const user = request.user as AuthenticatedUser;

    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    // TODO: Get or create Stripe customer for user
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: config.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${config.CORS_ORIGIN}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.CORS_ORIGIN}/profile`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    return {
      checkoutUrl: session.url || '',
    };
  }

  @Get('/portal')
  @Security('Bearer')
  public async getPortal(
    @Request() request: ExpressRequest
  ): Promise<PortalResponse> {
    const user = request.user as AuthenticatedUser;

    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    // TODO: Get Stripe customer ID from user record
    const customerId = ''; // Placeholder

    if (!customerId) {
      throw new Error('No subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${config.CORS_ORIGIN}/profile`,
    });

    console.log('Portal session for user:', user.id);

    return {
      portalUrl: session.url,
    };
  }
}
