# ADR-006: Azure Blob Storage for Images

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

Need to store tool photos and loan condition photos (before/after). Storage must be secure, cost-effective, and scalable.

## Decision

Use Azure Blob Storage with SAS tokens for secure access.

## Options Considered

### Option 1: Azure Blob Storage (Selected)
- **Pros:**
  - Cheapest option (~$0.02/GB/month for LRS)
  - Consistent with Azure stack
  - SAS tokens provide secure, time-limited access
  - Easy integration with Azure services
  - Scales automatically
- **Cons:**
  - No automatic image optimization
  - No built-in CDN (can add later)

### Option 2: Database BLOB Storage
- **Pros:**
  - Single data store
  - Transactional consistency
- **Cons:**
  - Expensive for large files
  - Increases database size and backup costs
  - Poor performance for serving images

### Option 3: Cloudinary or Similar CDN
- **Pros:**
  - Automatic image optimization
  - Built-in CDN
  - Transformations (resize, crop)
- **Cons:**
  - Additional service/vendor
  - Free tier limited
  - Adds complexity

## Consequences

### Positive
- Very low cost (~$0.20/month for 10GB)
- Secure access via SAS tokens
- Scalable storage (effectively unlimited)
- Consistent with Azure ecosystem

### Negative
- No automatic image optimization (must resize on upload)
- No CDN initially (can add Azure CDN later if needed)

### Risks
- Low: Blob Storage is mature and reliable
- Mitigated: Resize images client-side before upload to reduce storage/bandwidth

## Implementation Details

- Store images in private container (no public access)
- Generate SAS tokens server-side with 1-hour expiry
- Organize by entity: `tools/{toolId}/{photoId}.jpg`, `loans/{reservationId}/{type}/{photoId}.jpg`
- Client resizes images to max 1920px before upload

## Compliance Impact

- Images are encrypted at rest (Azure default)
- No public URLs (SAS tokens required)
- Soft delete enabled for recovery

## Related

- [Functional Spec: Image Security](../../functional-spec.md#74-image-security)
- [ADR-003: Azure SQL Serverless](./ADR-003-azure-sql-serverless.md)
