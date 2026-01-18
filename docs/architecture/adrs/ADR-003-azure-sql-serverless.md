# ADR-003: Azure SQL Serverless for Database

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

Need a relational database for structured data (users, tools, reservations, etc.). Must optimize for cost given low expected traffic.

## Decision

Use Azure SQL Serverless tier.

## Options Considered

### Option 1: Azure SQL Serverless (Selected)
- **Pros:**
  - Auto-pauses when inactive (major cost savings)
  - Pay only for compute used
  - Consistent with reference project (SQL Server)
  - DAB works seamlessly
  - Supports all needed features (transactions, constraints, etc.)
- **Cons:**
  - Cold start latency (~1 minute) after pause
  - Minimum charge when active

### Option 2: Azure SQL Basic Tier
- **Pros:**
  - Predictable cost (~$5/month)
  - No cold start
- **Cons:**
  - Paying for idle time
  - Limited DTUs

### Option 3: Azure Database for PostgreSQL
- **Pros:**
  - Open source
  - Flexible pricing
- **Cons:**
  - Different from reference project
  - Would need to adapt DAB configuration

### Option 4: Cosmos DB
- **Pros:**
  - Serverless option available
  - Global distribution
- **Cons:**
  - Overkill for this use case
  - Different data model (document vs relational)
  - More expensive for relational workloads

## Consequences

### Positive
- Cost optimized for low/variable traffic
- Consistent with existing stack and team knowledge
- Auto-scales within tier as needed
- Full SQL Server feature set

### Negative
- First user after idle pause experiences ~1 minute delay
- Need to configure auto-pause delay appropriately

### Risks
- Medium: Cold starts could frustrate users
- Mitigated: Configure auto-pause delay to 1 hour
- Mitigated: UI shows loading state during cold start
- Fallback: Can switch to Basic tier if cold starts are problematic (~$5/mo)

## Compliance Impact

- Data encrypted at rest by default
- Can enable auditing if needed in future

## Related

- [Functional Spec: Cost Estimation](../../functional-spec.md#8-cost-estimation)
- [ADR-004: Data API Builder](./ADR-004-data-api-builder.md)
