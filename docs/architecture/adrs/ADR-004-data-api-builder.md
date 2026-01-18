# ADR-004: Azure Data API Builder for Data Access

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

Need a data access layer between frontend and database. Want to minimize custom backend code while maintaining security and flexibility.

## Decision

Use Azure Data API Builder (DAB) for CRUD operations, with a custom Express API for business logic.

## Options Considered

### Option 1: Custom REST API Only
- **Pros:**
  - Full control
  - Single service to deploy
- **Cons:**
  - Significant boilerplate code
  - Manual query building
  - Higher maintenance burden

### Option 2: Custom GraphQL API
- **Pros:**
  - Flexible queries
  - Type-safe
- **Cons:**
  - Significant development effort
  - Must build resolvers manually

### Option 3: Azure Data API Builder + Custom API (Selected)
- **Pros:**
  - Auto-generates GraphQL and REST endpoints
  - Reduces backend code significantly
  - Built-in authorization and filtering
  - Proven in reference project
  - Custom API only needed for complex business logic
- **Cons:**
  - Less flexibility for complex queries
  - Additional service to deploy

### Option 4: Prisma + Custom API
- **Pros:**
  - Great developer experience
  - Type-safe ORM
- **Cons:**
  - Still requires significant API code
  - Another dependency to manage

## Consequences

### Positive
- Faster development (auto-generated endpoints)
- Less code to maintain
- Type-safe GraphQL queries from frontend
- Consistent with reference project patterns

### Negative
- Less flexibility for very complex queries
- Additional service to deploy and configure

### Risks
- Low: DAB is proven in patient-scheduling-solution
- Mitigated: Custom API handles any edge cases DAB can't

## Architecture

```
Frontend -> DAB (CRUD operations via GraphQL)
         -> Custom API (business logic: booking validation, notifications, Stripe)
```

## Compliance Impact

- DAB supports row-level security via policy configuration
- All database access goes through authenticated endpoints

## Related

- [Functional Spec: API Architecture](../../functional-spec.md#61-api-architecture)
- [ADR-003: Azure SQL Serverless](./ADR-003-azure-sql-serverless.md)
