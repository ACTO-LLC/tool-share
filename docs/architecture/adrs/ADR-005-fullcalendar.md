# ADR-005: FullCalendar for Reservation UI

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

Need a calendar component for viewing tool availability and creating reservations. Must support date range selection and blocked time display.

## Decision

Use FullCalendar v6.

## Options Considered

### Option 1: FullCalendar (Selected)
- **Pros:**
  - Already used in reference project (patient-scheduling-solution)
  - Mature, well-documented library
  - Resource scheduling support
  - Good MUI integration available
  - Supports day, week, month views
  - Active development and community
- **Cons:**
  - Large bundle size
  - Commercial license required for some premium features (not needed for our use case)

### Option 2: React Big Calendar
- **Pros:**
  - Lighter weight
  - Free and open source
- **Cons:**
  - Less feature-rich
  - No team familiarity
  - Less active maintenance

### Option 3: Custom Calendar Component
- **Pros:**
  - Exactly what we need, nothing more
  - No external dependency
- **Cons:**
  - Significant development effort
  - Edge cases (timezones, DST) are complex
  - Maintenance burden

## Consequences

### Positive
- Proven solution from reference project
- Team already has familiarity
- Rich feature set for future enhancements
- Good documentation and examples

### Negative
- Adds to bundle size (~150KB gzipped for core)
- Must be careful not to accidentally use premium features

### Risks
- Low: Well-established library
- Mitigated: Only using standard (free) features

## Compliance Impact

N/A

## Related

- [Functional Spec: Reservations & Booking](../../functional-spec.md#15-reservations--booking)
- [Patient Scheduling Solution Reference](../../../reference/patient-scheduling-solution)
