import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  Security,
  Request,
  SuccessResponse,
} from 'tsoa';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthenticatedUser } from '../middleware/auth';
import Stripe from 'stripe';
import { config } from '../config/env';
import {
  getUserByExternalId,
  updateUserSubscription,
} from '../services/dabService';

const stripe = config.STRIPE_SECRET_KEY
  ? new Stripe(config.STRIPE_SECRET_KEY)
  : null;

/**
 * Response for checkout session creation
 */
interface CheckoutResponse {
  checkoutUrl: string;
}

/**
 * Response for customer portal session
 */
interface PortalResponse {
  portalUrl: string;
}

/**
 * Subscription status response
 */
interface SubscriptionStatusResponse {
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'none';
  subscriptionEndsAt?: string;
  isInGracePeriod: boolean;
  canAccessFeatures: boolean;
  stripeCustomerId?: string;
}

/**
 * Grace period in days after subscription ends
 */
const GRACE_PERIOD_DAYS = 7;

/**
 * Check if user can access features based on subscription status
 */
function canAccessFeatures(
  status: string | undefined,
  subscriptionEndsAt: string | undefined
): boolean {
  // Trial and active users can always access
  if (status === 'trial' || status === 'active') {
    return true;
  }

  // Past due users can access during grace period
  if (status === 'past_due' && subscriptionEndsAt) {
    const endDate = new Date(subscriptionEndsAt);
    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
    return new Date() <= graceEndDate;
  }

  // Cancelled users can access until subscription ends + grace period
  if (status === 'cancelled' && subscriptionEndsAt) {
    const endDate = new Date(subscriptionEndsAt);
    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
    return new Date() <= graceEndDate;
  }

  return false;
}

/**
 * Check if user is in grace period
 */
function isInGracePeriod(
  status: string | undefined,
  subscriptionEndsAt: string | undefined
): boolean {
  if (!subscriptionEndsAt) return false;
  if (status !== 'past_due' && status !== 'cancelled') return false;

  const endDate = new Date(subscriptionEndsAt);
  const graceEndDate = new Date(endDate);
  graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
  const now = new Date();

  return now > endDate && now <= graceEndDate;
}

@Route('api/subscriptions')
@Tags('Subscriptions')
export class SubscriptionsController extends Controller {
  /**
   * Create a Stripe Checkout session for subscription
   *
   * Creates a new checkout session for the user to subscribe.
   * Redirects to Stripe Checkout page.
   */
  @Post('/checkout')
  @Security('Bearer')
  @SuccessResponse(200, 'Checkout session created')
  public async createCheckout(
    @Request() request: ExpressRequest
  ): Promise<CheckoutResponse> {
    const authUser = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    if (!stripe) {
      this.setStatus(503);
      throw new Error('Payment processing is not configured');
    }

    if (!config.STRIPE_PRICE_ID) {
      this.setStatus(503);
      throw new Error('Subscription price is not configured');
    }

    // Get user from database
    const user = await getUserByExternalId(authUser.id, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    // If user already has a Stripe customer ID, use it
    let customerId = user.stripeCustomerId;

    // Create or retrieve customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName,
        metadata: {
          userId: user.id,
          externalId: user.externalId,
        },
      });
      customerId = customer.id;

      // Save customer ID to user record
      await updateUserSubscription(
        user.id,
        { stripeCustomerId: customerId },
        authToken
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: config.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${config.CORS_ORIGIN}/profile?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.CORS_ORIGIN}/profile?subscription=cancelled`,
      metadata: {
        userId: user.id,
        externalId: user.externalId,
      },
    });

    if (!session.url) {
      this.setStatus(500);
      throw new Error('Failed to create checkout session');
    }

    return {
      checkoutUrl: session.url,
    };
  }

  /**
   * Get Stripe Customer Portal URL
   *
   * Returns a URL to the Stripe Customer Portal where users can
   * manage their subscription, update payment methods, and view invoices.
   */
  @Get('/portal')
  @Security('Bearer')
  @SuccessResponse(200, 'Portal session created')
  public async getPortal(
    @Request() request: ExpressRequest
  ): Promise<PortalResponse> {
    const authUser = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    if (!stripe) {
      this.setStatus(503);
      throw new Error('Payment processing is not configured');
    }

    // Get user from database
    const user = await getUserByExternalId(authUser.id, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    if (!user.stripeCustomerId) {
      this.setStatus(400);
      throw new Error('No subscription found. Please subscribe first.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${config.CORS_ORIGIN}/profile`,
    });

    return {
      portalUrl: session.url,
    };
  }

  /**
   * Get current subscription status
   *
   * Returns the user's current subscription status including
   * whether they can access features and if they're in grace period.
   */
  @Get('/status')
  @Security('Bearer')
  @SuccessResponse(200, 'Subscription status retrieved')
  public async getSubscriptionStatus(
    @Request() request: ExpressRequest
  ): Promise<SubscriptionStatusResponse> {
    const authUser = request.user as AuthenticatedUser;
    const authToken = request.headers.authorization?.substring(7);

    // Get user from database
    const user = await getUserByExternalId(authUser.id, authToken);
    if (!user) {
      this.setStatus(404);
      throw new Error('User not found');
    }

    const status = (user.subscriptionStatus as SubscriptionStatusResponse['status']) || 'trial';

    return {
      status,
      subscriptionEndsAt: user.subscriptionEndsAt,
      isInGracePeriod: isInGracePeriod(status, user.subscriptionEndsAt),
      canAccessFeatures: canAccessFeatures(status, user.subscriptionEndsAt),
      stripeCustomerId: user.stripeCustomerId,
    };
  }
}

/**
 * Stripe webhook handler (non-TSOA route)
 *
 * Handles Stripe webhook events for subscription status changes.
 * This is registered directly in app.ts with raw body parsing.
 */
export async function handleStripeWebhook(
  req: ExpressRequest,
  res: ExpressResponse
): Promise<void> {
  if (!stripe) {
    console.error('Stripe not configured');
    res.status(503).json({ error: 'Payment processing is not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  if (!stripe) return;

  // Get customer to find user ID
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error('Customer was deleted:', customerId);
    return;
  }

  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error('No userId in customer metadata:', customerId);
    return;
  }

  // Map Stripe status to our status
  let status: string;
  switch (subscription.status) {
    case 'active':
    case 'trialing':
      status = 'active';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      status = 'cancelled';
      break;
    default:
      status = subscription.status;
  }

  // Get subscription end date from first subscription item (Stripe v20+)
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  const subscriptionEndsAt = currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : undefined;

  console.log(`Updating subscription for user ${userId}: status=${status}, endsAt=${subscriptionEndsAt}`);

  // Update user in database (using system token - webhook has no auth)
  await updateUserSubscription(userId, {
    subscriptionStatus: status,
    subscriptionEndsAt,
    stripeCustomerId: customerId,
  });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  if (!stripe) return;

  // Get customer to find user ID
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error('Customer was deleted:', customerId);
    return;
  }

  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error('No userId in customer metadata:', customerId);
    return;
  }

  // Get subscription end date (when it was cancelled)
  const subscriptionEndsAt = subscription.ended_at
    ? new Date(subscription.ended_at * 1000).toISOString()
    : new Date().toISOString();

  console.log(`Subscription deleted for user ${userId}`);

  await updateUserSubscription(userId, {
    subscriptionStatus: 'cancelled',
    subscriptionEndsAt,
  });
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  if (!stripe || !customerId) return;

  // Get customer to find user ID
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error('Customer was deleted:', customerId);
    return;
  }

  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error('No userId in customer metadata:', customerId);
    return;
  }

  console.log(`Payment failed for user ${userId}`);

  // Update status to past_due
  await updateUserSubscription(userId, {
    subscriptionStatus: 'past_due',
  });
}
