# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Tool Share project. ADRs document significant technical decisions made during the project.

## What is an ADR?

An Architecture Decision Record captures a significant architectural decision along with its context and consequences. They help teams:

- Understand why decisions were made
- Onboard new team members
- Revisit decisions when context changes
- Maintain consistency across the project

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./ADR-001-optimistic-updates.md) | Use Optimistic Updates Instead of Real-Time | Accepted | 2026-01-18 |
| [ADR-002](./ADR-002-azure-ad-b2c.md) | Azure AD B2C for Authentication | Accepted | 2026-01-18 |
| [ADR-003](./ADR-003-azure-sql-serverless.md) | Azure SQL Serverless for Database | Accepted | 2026-01-18 |
| [ADR-004](./ADR-004-data-api-builder.md) | Azure Data API Builder for Data Access | Accepted | 2026-01-18 |
| [ADR-005](./ADR-005-fullcalendar.md) | FullCalendar for Reservation UI | Accepted | 2026-01-18 |
| [ADR-006](./ADR-006-blob-storage.md) | Azure Blob Storage for Images | Accepted | 2026-01-18 |
| [ADR-007](./ADR-007-upcitemdb-api.md) | UPCitemdb for Tool Lookup | Accepted | 2026-01-18 |
| [ADR-008](./ADR-008-stripe-payments.md) | Stripe for Subscription Payments | Accepted | 2026-01-18 |
| [ADR-009](./ADR-009-playwright-e2e.md) | Playwright for E2E Testing | Accepted | 2026-01-18 |
| [ADR-010](./ADR-010-feature-slice-development.md) | Feature-Slice Development Approach | Accepted | 2026-01-18 |

## Creating a New ADR

1. Copy [ADR-000-template.md](./ADR-000-template.md)
2. Rename to `ADR-[number]-[short-title].md`
3. Fill in all sections
4. Submit via Pull Request for review
5. Update this README index

## ADR Statuses

- **Proposed** - Under discussion, not yet accepted
- **Accepted** - Decision has been made and is in effect
- **Deprecated** - No longer relevant but kept for historical reference
- **Superseded** - Replaced by a newer ADR (link to replacement)
