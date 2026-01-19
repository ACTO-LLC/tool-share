# Performance Optimization Guide

This document outlines the performance optimization strategies implemented in the Tool Share application, including recommended database indexes, caching strategies, and frontend optimizations.

## Performance Targets

Based on the functional specification (Section 2.1):

| Metric | Target | Measured Baseline |
|--------|--------|-------------------|
| Page Load | < 3 seconds | TBD |
| API Response | < 500ms (p95) | TBD |
| Image Upload | < 5 seconds (5MB) | TBD |
| Search Results | < 1 second | TBD |

## Database Indexes

### Recommended Indexes for Azure SQL

The following indexes should be created to optimize common query patterns. These recommendations are based on the GraphQL queries in `dabService.ts` and common access patterns.

```sql
-- ============================================================================
-- User Table Indexes
-- ============================================================================

-- Index for looking up users by external ID (Azure AD B2C)
-- Used on every authenticated API call
CREATE UNIQUE NONCLUSTERED INDEX IX_User_ExternalId
ON [User] (externalId);

-- Index for user subscription status filtering
CREATE NONCLUSTERED INDEX IX_User_SubscriptionStatus
ON [User] (subscriptionStatus) INCLUDE (subscriptionEndsAt);

-- ============================================================================
-- Tool Table Indexes
-- ============================================================================

-- Index for browsing tools by owner (My Tools page)
CREATE NONCLUSTERED INDEX IX_Tool_OwnerId
ON Tool (ownerId)
INCLUDE (name, category, status, createdAt);

-- Index for filtering tools by category
CREATE NONCLUSTERED INDEX IX_Tool_Category
ON Tool (category)
WHERE status = 'available';

-- Index for browsing available tools (most common query)
CREATE NONCLUSTERED INDEX IX_Tool_Status_CreatedAt
ON Tool (status, createdAt DESC)
INCLUDE (name, category, ownerId, brand, model);

-- ============================================================================
-- Reservation Table Indexes
-- ============================================================================

-- Index for getting reservations by borrower
CREATE NONCLUSTERED INDEX IX_Reservation_BorrowerId
ON Reservation (borrowerId, status)
INCLUDE (toolId, startDate, endDate);

-- Index for checking date conflicts on a tool
CREATE NONCLUSTERED INDEX IX_Reservation_ToolId_Status
ON Reservation (toolId, status)
INCLUDE (startDate, endDate)
WHERE status IN ('pending', 'confirmed', 'active');

-- Index for finding pending/active reservations
CREATE NONCLUSTERED INDEX IX_Reservation_Status_StartDate
ON Reservation (status, startDate)
INCLUDE (toolId, borrowerId, endDate);

-- ============================================================================
-- Notification Table Indexes
-- ============================================================================

-- Index for fetching user notifications (ordered by date)
CREATE NONCLUSTERED INDEX IX_Notification_UserId_CreatedAt
ON Notification (userId, createdAt DESC)
INCLUDE (type, title, message, isRead, relatedId);

-- Index for counting unread notifications
CREATE NONCLUSTERED INDEX IX_Notification_UserId_IsRead
ON Notification (userId, isRead)
WHERE isRead = 0;

-- ============================================================================
-- Review Table Indexes
-- ============================================================================

-- Index for getting reviews for a user (reputation calculation)
CREATE NONCLUSTERED INDEX IX_Review_RevieweeId
ON Review (revieweeId)
INCLUDE (rating, createdAt);

-- Index for checking if review exists for a reservation
CREATE UNIQUE NONCLUSTERED INDEX IX_Review_ReservationId_ReviewerId
ON Review (reservationId, reviewerId);

-- ============================================================================
-- ToolCircle Table Indexes
-- ============================================================================

-- Index for finding tools in a circle
CREATE NONCLUSTERED INDEX IX_ToolCircle_CircleId
ON ToolCircle (circleId);

-- Index for finding circles a tool belongs to
CREATE NONCLUSTERED INDEX IX_ToolCircle_ToolId
ON ToolCircle (toolId);

-- ============================================================================
-- CircleMember Table Indexes
-- ============================================================================

-- Index for finding members in a circle
CREATE NONCLUSTERED INDEX IX_CircleMember_CircleId
ON CircleMember (circleId)
INCLUDE (userId, role);

-- Index for finding circles a user belongs to
CREATE NONCLUSTERED INDEX IX_CircleMember_UserId
ON CircleMember (userId)
INCLUDE (circleId, role);

-- ============================================================================
-- ToolPhoto Table Indexes
-- ============================================================================

-- Index for getting photos for a tool
CREATE NONCLUSTERED INDEX IX_ToolPhoto_ToolId
ON ToolPhoto (toolId, isPrimary DESC)
INCLUDE (url, uploadedAt);

-- ============================================================================
-- LoanPhoto Table Indexes
-- ============================================================================

-- Index for getting loan photos by reservation
CREATE NONCLUSTERED INDEX IX_LoanPhoto_ReservationId
ON LoanPhoto (reservationId, type)
INCLUDE (url, uploadedBy, notes, uploadedAt);
```

### Index Maintenance

For Azure SQL Serverless:
- Enable automatic tuning: `ALTER DATABASE [ToolShare] SET AUTOMATIC_TUNING (CREATE_INDEX = ON, DROP_INDEX = ON);`
- Monitor index usage via DMVs: `sys.dm_db_index_usage_stats`
- Rebuild fragmented indexes monthly during low-usage periods

## Caching Strategy

### Frontend Caching (React Query)

The application uses TanStack Query (React Query) with optimized cache settings:

```typescript
// main.tsx - QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000,      // 30 minutes - cache retention
      retry: 1,
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      refetchOnReconnect: true,
    },
  },
});
```

**Query-specific caching:**

| Query | staleTime | gcTime | Rationale |
|-------|-----------|--------|-----------|
| Categories | 24 hours | 48 hours | Rarely changes |
| Circles list | 5 minutes | 30 minutes | User might join/leave |
| Tool browse | 30 seconds | 5 minutes | Available tools change frequently |
| Tool detail | 2 minutes | 10 minutes | Details change infrequently |
| My reservations | 1 minute | 5 minutes | Status changes are important |
| Notifications | 30 seconds | 5 minutes | Need to show new notifications |

### Backend Caching

For low-traffic, cost-optimized deployment, caching is primarily handled by:

1. **Azure SQL Query Store** - Automatic query plan caching
2. **Connection Pooling** - Node.js maintains connection pools
3. **DAB Built-in Caching** - Data API Builder caches schema and query plans

For future scaling, consider:
- **Azure Redis Cache** - For session data and frequently accessed lists
- **CDN for Images** - Azure CDN for blob storage

### SAS URL Caching

SAS URLs for images are generated with appropriate expiration:
- Tool photos: 24-hour expiry (regenerated on page load)
- Loan photos: 1-year expiry (immutable after creation)

## Code Splitting Strategy

### Route-Based Code Splitting

All page components are loaded via React.lazy():

```typescript
// App.tsx - Lazy-loaded routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BrowseTools = lazy(() => import('./pages/BrowseTools'));
const ToolDetail = lazy(() => import('./pages/ToolDetail'));
// ... etc.
```

**Bundle Size Estimates:**

| Chunk | Estimated Size | Contents |
|-------|---------------|----------|
| main | ~150KB | React, React Router, MUI core |
| Dashboard | ~30KB | Dashboard page + dependencies |
| BrowseTools | ~80KB | Search, filters, pagination |
| ToolDetail | ~60KB | Calendar (FullCalendar), photo gallery |
| AddTool | ~40KB | Form handling, UPC lookup |
| Circles | ~35KB | Circle management |

### Component-Level Optimization

Heavy components that should be considered for additional splitting:
- FullCalendar (used in ToolDetail) - ~100KB
- Date Pickers (from MUI X) - ~50KB
- Photo Gallery (custom) - ~15KB

## Image Optimization

### Lazy Loading

The `LazyImage` component uses Intersection Observer for viewport-based loading:

```typescript
// Components/LazyImage.tsx
- Uses IntersectionObserver with 100px rootMargin
- Shows skeleton placeholder until in viewport
- Graceful fallback on error
- CSS opacity transition for smooth appearance
```

### Image Guidelines

For optimal performance:
1. **Maximum size**: 5MB per upload
2. **Recommended formats**: WebP > JPEG > PNG
3. **Recommended dimensions**: 1200x1200 max for tool photos
4. **Thumbnail generation**: Consider Azure Functions for auto-resize

## API Optimization

### Query Optimization in dabService.ts

Key optimizations implemented:

1. **Selective field fetching** - GraphQL queries only request needed fields
2. **Batch operations** - `Promise.all()` for parallel requests
3. **Pagination** - All list queries support `first` and `offset` parameters

### Identified N+1 Query Patterns

The following patterns have potential N+1 issues:

1. **`getReservationsForOwner`** - Fetches all tools, then reservations per tool
   - Mitigation: Uses nested GraphQL query to fetch in single request

2. **`markAllNotificationsAsRead`** - Updates notifications one at a time
   - Recommendation: Create batch update endpoint in DAB or use stored procedure

3. **`calculateUserReputationScore`** - Fetches all reviews for calculation
   - Recommendation: Use database trigger or scheduled function for precomputation

### Response Caching Recommendations

For endpoints that serve relatively static data:

```typescript
// Recommended cache headers for static data
// Categories endpoint - can be cached aggressively
res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours

// Browse tools - short cache
res.setHeader('Cache-Control', 'public, max-age=30'); // 30 seconds

// User-specific data - no cache
res.setHeader('Cache-Control', 'private, no-cache');
```

## Performance Monitoring

### Recommended Metrics

Track these metrics in Azure Application Insights:

1. **Page Load Time** - `window.performance.timing`
2. **API Latency** - Request/response timing
3. **Cache Hit Rate** - React Query cache statistics
4. **Error Rate** - Failed requests and exceptions
5. **Database Query Time** - DAB request duration

### Sample Application Insights Query

```kusto
// API response time by endpoint
requests
| where timestamp > ago(24h)
| summarize
    avg(duration),
    percentile(duration, 95),
    count()
by operation_Name
| order by avg_duration desc
```

## Frontend Performance Checklist

- [x] React.lazy() for route-based code splitting
- [x] Suspense fallback with loading indicator
- [x] Image lazy loading with IntersectionObserver
- [x] Skeleton placeholders for loading states
- [x] React Query for data caching
- [x] useMemo for expensive computations
- [x] useCallback for stable function references
- [ ] Virtual scrolling for long lists (future)
- [ ] Service worker for offline support (future)
- [ ] Web Vitals monitoring (future)

## Backend Performance Checklist

- [x] GraphQL selective field fetching
- [x] Pagination on all list endpoints
- [x] Connection pooling
- [x] SAS URL generation with appropriate expiry
- [ ] Response compression (gzip)
- [ ] Rate limiting
- [ ] Query result caching
- [ ] Database index tuning (see recommendations above)

## Testing Performance

### Local Performance Testing

```bash
# Lighthouse CI
npx lighthouse http://localhost:5173 --output=html --view

# Bundle analyzer
npm run build -- --analyze
```

### Load Testing Recommendations

For pre-production testing:
1. Use Azure Load Testing or k6
2. Target: 50 concurrent users
3. Test scenarios:
   - Browse tools (read-heavy)
   - Create reservation (write)
   - Upload photo (heavy payload)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-18 | Initial performance documentation |
