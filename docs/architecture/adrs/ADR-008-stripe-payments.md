# ADR-008: Stripe for Subscription Payments

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

Need payment processing for monthly subscriptions to cover infrastructure costs. Target: $8/user/month with 8 initial users.

## Decision

Use Stripe for subscription billing.

## Options Considered

### Option 1: Stripe (Selected)
- **Pros:**
  - Industry standard for SaaS subscriptions
  - Excellent developer experience
  - Built-in subscription management (Stripe Billing)
  - Customer portal for self-service
  - Handles failed payments, retries, dunning automatically
  - PCI compliant (we never handle card numbers)
  - Well-documented webhooks
- **Cons:**
  - 2.9% + $0.30 per transaction (~$0.53 per $8 subscription)
  - Adds integration complexity

### Option 2: PayPal
- **Pros:**
  - Widely recognized
  - User trust
- **Cons:**
  - Higher fees for subscriptions
  - Less developer-friendly
  - Poorer subscription management

### Option 3: Square
- **Pros:**
  - Good for small businesses
- **Cons:**
  - Less mature subscription product
  - More focused on in-person payments

### Option 4: Manual (Venmo/Zelle)
- **Pros:**
  - No transaction fees
  - Simple for small group
- **Cons:**
  - No automation
  - Manual tracking nightmare
  - No subscription management
  - Doesn't scale

## Consequences

### Positive
- Reliable, well-documented payment processing
- Handles subscription lifecycle automatically
- Customer self-service portal reduces support burden
- Automatic failed payment handling and dunning
- PCI compliance handled by Stripe

### Negative
- ~6.6% effective fee on $8 subscription (~$0.53)
- Adds integration complexity (webhooks, customer portal)

### Risks
- Low: Stripe is extremely reliable
- Mitigated: Test mode for development
- Mitigated: Webhook signature validation

## Implementation

1. **Stripe Checkout** - Payment collection during signup
2. **Stripe Billing** - Subscription management
3. **Customer Portal** - Self-service for payment method updates, cancellation
4. **Webhooks** - Sync subscription status to database
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Data Model Integration

```
User {
  stripeCustomerId: string      // Stripe customer ID
  subscriptionStatus: string    // 'trial' | 'active' | 'past_due' | 'cancelled'
  subscriptionEndsAt: DateTime  // When current period ends
}
```

## Cost Analysis

| Monthly | Subscription | Stripe Fee | Net Revenue |
|---------|-------------|------------|-------------|
| 8 users | $64 | ~$4.24 | ~$59.76 |
| 15 users | $120 | ~$7.95 | ~$112.05 |

## Compliance Impact

- PCI DSS: Handled by Stripe (we never see card numbers)
- CCPA: Stripe is CCPA compliant; we only store Stripe customer ID

## Related

- [Functional Spec: Subscription & Billing](../../functional-spec.md#18-subscription--billing)
- [Stripe Billing Documentation](https://stripe.com/docs/billing)
- [ADR-002: Azure AD B2C](./ADR-002-azure-ad-b2c.md)
