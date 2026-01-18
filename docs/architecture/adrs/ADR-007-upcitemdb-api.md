# ADR-007: UPCitemdb for Tool Lookup

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** ACTO Development Team

## Context

Want to auto-populate tool details when users add tools to reduce manual data entry and improve data quality. Need to look up product information by barcode/UPC or search by name.

## Decision

Use UPCitemdb API free tier.

## Options Considered

### Option 1: UPCitemdb API (Selected)
- **Pros:**
  - Free tier: 100 requests/day (sufficient for 8-user group)
  - Provides name, brand, description, images
  - Simple REST API
  - No credit card required
  - Can upgrade to paid if needed later ($10/mo for 10K requests)
- **Cons:**
  - Limited to 100 requests/day on free tier
  - Not all tools have UPC codes (older items, hand tools)

### Option 2: Barcode Lookup API
- **Pros:**
  - Larger database
  - More detailed product info
- **Cons:**
  - No free tier
  - Starts at $50/month

### Option 3: Go-UPC
- **Pros:**
  - Large database (1B+ items)
- **Cons:**
  - Paid only
  - More expensive than UPCitemdb

### Option 4: Manual Entry Only
- **Pros:**
  - No external dependency
  - No API limits
- **Cons:**
  - Poor user experience
  - Inconsistent data quality
  - More typing for users

## Consequences

### Positive
- Zero cost for expected usage
- Reduces data entry friction significantly
- Better data quality and consistency
- Can upgrade seamlessly if usage grows

### Negative
- 100 requests/day limit (should be fine for 8 users adding ~5 tools/day max)
- Not all items will be found (graceful fallback to manual)

### Risks
- Low: Usage well within free tier limits
- Mitigated: Cache successful lookups in database
- Mitigated: Graceful fallback to manual entry

## API Details

- **Endpoint:** `https://api.upcitemdb.com/prod/trial/lookup`
- **Free tier:** 100 requests/day, no API key required
- **Paid tier:** $10/month for 10,000 requests
- **Response:** JSON with product name, brand, model, description, images, category

## Implementation

1. User enters UPC or searches by product name
2. API checks UPCitemdb
3. If found: auto-populate form fields
4. If not found: user enters manually
5. Cache successful lookups to avoid duplicate API calls

## Compliance Impact

N/A - No PII or sensitive data involved in product lookups.

## Related

- [Functional Spec: Tool Lookup](../../functional-spec.md#us-007a-tool-lookup-via-barcodesearch)
- [UPCitemdb API Documentation](https://www.upcitemdb.com/wp/docs/main/development/getting-started/)
