# ADR-001: Use Optimistic Updates Instead of Real-Time

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

The application needs to provide responsive UI feedback when users perform actions (create reservations, approve requests, etc.). We need to decide how to handle UI updates when data changes.

## Decision

Use optimistic updates with background sync instead of real-time infrastructure.

## Options Considered

### Option 1: Azure Web PubSub for Real-Time Updates
- **Pros:**
  - Immediate updates across all clients
  - No stale data issues
- **Cons:**
  - Adds ~$50+/month cost
  - Additional infrastructure complexity
  - Overkill for expected traffic (8-50 users)

### Option 2: Polling for Updates
- **Pros:**
  - Simple to implement
  - No additional infrastructure
- **Cons:**
  - Delayed updates
  - Unnecessary server load
  - Poor user experience with visible delays

### Option 3: Optimistic Updates with Background Sync (Selected)
- **Pros:**
  - Instant UI feedback
  - No additional infrastructure cost
  - Simpler architecture
  - Works well for low-traffic scenarios
- **Cons:**
  - Rare edge case conflicts possible
  - Must handle rollback on server rejection

## Consequences

### Positive
- Lower monthly cost (no Web PubSub)
- Simpler architecture to maintain
- Instant UI feedback for users
- Appropriate for expected traffic levels

### Negative
- Two users could theoretically request same dates simultaneously
- UI must handle rollback gracefully if server rejects

### Risks
- Low: Conflict likelihood is very low for 8-user group
- Mitigated: Server validates all reservations for conflicts before confirming
- Mitigated: Reservation requests go through approval workflow anyway

## Compliance Impact

N/A - No healthcare data or compliance requirements affected.

## Related

- [Functional Spec: Non-Functional Requirements](../../functional-spec.md#21-performance)
