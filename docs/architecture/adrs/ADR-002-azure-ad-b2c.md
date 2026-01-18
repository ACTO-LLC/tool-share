# ADR-002: Azure AD B2C for Authentication

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

Need secure authentication for a consumer-facing application. Must support email/password and social login options while keeping costs low.

## Decision

Use Azure AD B2C for all authentication.

## Options Considered

### Option 1: Azure AD B2C (Selected)
- **Pros:**
  - 50,000 MAU free tier covers expected usage
  - Consistent with existing Azure stack
  - Built-in social login (Google, Microsoft, Facebook)
  - Handles password reset, MFA, account verification
  - MSAL-React library already proven in reference project
- **Cons:**
  - Azure AD B2C has learning curve
  - Less flexible than Auth0 for custom flows

### Option 2: Auth0
- **Pros:**
  - Developer-friendly
  - Highly customizable
- **Cons:**
  - Free tier limited to 7,000 MAU
  - Paid tiers start at $23/month
  - Different ecosystem from Azure

### Option 3: Firebase Auth
- **Pros:**
  - Generous free tier
  - Easy to implement
- **Cons:**
  - Google ecosystem, less Azure integration
  - Would need to manage multiple cloud providers

### Option 4: Custom Authentication
- **Pros:**
  - Full control
- **Cons:**
  - Security risk
  - Significant development effort
  - Must handle password storage, reset, MFA manually

## Consequences

### Positive
- Free for expected scale (8-50 users well under 50K MAU)
- Enterprise-grade security without enterprise cost
- Consistent with existing ACTO Azure stack
- Social login reduces friction for users

### Negative
- Azure AD B2C configuration can be complex
- Custom user flows require Azure Portal configuration

### Risks
- Low: B2C is mature and well-documented
- Mitigated: Team has experience from patient-scheduling-solution

## Compliance Impact

- CCPA: Azure AD B2C is CCPA compliant
- Data residency: Can configure to store data in US region

## Related

- [Functional Spec: User Authentication](../../functional-spec.md#us-003-user-authentication)
- [ADR-008: Stripe for Payments](./ADR-008-stripe-payments.md)
