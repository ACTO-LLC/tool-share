# Tool Share - Functional Specification

**Version:** 1.0.0
**Date:** 2026-01-18
**Status:** Draft
**Author:** ACTO Development Team

---

## Executive Summary

Tool Share is a web application that enables friends and community members to share tools they own and are willing to loan out. The platform provides secure user management, tool cataloging with photos, reservation/booking capabilities, and condition documentation through before/after photos.

### Key Objectives
- Enable tool owners to list and manage their tool inventory
- Allow borrowers to search, discover, and reserve available tools
- Prevent double-booking through calendar-based reservations
- Document tool condition with before/after photos
- Maintain security while keeping costs optimized

### Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + TypeScript + Vite | Consistent with existing stack, fast builds |
| UI Components | MUI v6 | Comprehensive component library |
| Calendar | FullCalendar v6 | Proven scheduling component |
| Backend | Node.js + Express + TypeScript | Consistent with existing stack |
| API Docs | TSOA | Auto-generated OpenAPI specs |
| Data Access | Azure Data API Builder | Reduces backend code, GraphQL support |
| Database | Azure SQL (Serverless) | Cost-optimized, scales to zero |
| Auth | Azure AD B2C | Consumer-focused, 50K MAU free |
| Storage | Azure Blob Storage | Cost-effective image storage |
| Payments | Stripe | Industry standard, subscription support |
| Tool Lookup | UPCitemdb API | Free tier, auto-populate tool details |
| Hosting | Azure App Service (Basic) | Low-cost, sufficient for expected traffic |

### Cost Optimization Decisions
- **No real-time updates** - Use optimistic UI updates instead of Web PubSub
- **Serverless database** - Auto-pause when inactive
- **Basic tier hosting** - Scale up only if needed
- **Blob storage** - Cheapest option for images
- **DAB** - Reduces custom backend code = less maintenance

### Business Model
- **Subscription-based** - Monthly fee covers infrastructure costs
- **Target pricing** - $7-10/user/month (covers ~$56/mo costs with 8 users)
- **Initial users** - 8 friends in close-knit group

### External Integrations
| Service | Purpose | Tier |
|---------|---------|------|
| UPCitemdb API | Tool lookup by barcode/name | Free (100 requests/day) |

---

## 1. Functional Requirements

### 1.1 User Management

#### US-001: User Registration
**As a** new user
**I want to** create an account
**So that** I can participate in the tool sharing community

**Acceptance Criteria:**
- User can register with email/password or social login (Google, Microsoft)
- Email verification required before full access
- User must provide: display name, email, phone (optional)
- User must accept terms of service

#### US-002: User Profile
**As a** registered user
**I want to** manage my profile
**So that** others can know who they're lending to/borrowing from

**Acceptance Criteria:**
- User can set display name, avatar, bio
- User can set pickup address (exact street address for tool pickup/return)
- User can set notification preferences (email, in-app)
- User can view their reputation score (read-only)
- User can see their lending/borrowing history
- Address is only visible to circle members with confirmed reservations

#### US-003: User Authentication
**As a** registered user
**I want to** securely log in and out
**So that** my account remains protected

**Acceptance Criteria:**
- Login via Azure AD B2C (email/password or social)
- Session timeout after 24 hours of inactivity
- "Remember me" option extends to 30 days
- Password reset via email link

### 1.2 Circle/Group Management

#### US-004: Create Circle
**As a** user
**I want to** create a sharing circle
**So that** I can share tools with a specific group of friends

**Acceptance Criteria:**
- User can create a circle with name and description
- Creator becomes circle admin
- Circle can be invite-only or request-to-join
- Circle has a unique invite code/link

#### US-005: Join Circle
**As a** user
**I want to** join existing circles
**So that** I can borrow tools from friends

**Acceptance Criteria:**
- User can join via invite link/code
- User can request to join public circles
- Circle admin approves/denies requests
- User can belong to multiple circles

#### US-006: Manage Circle Members
**As a** circle admin
**I want to** manage circle membership
**So that** I can control who has access

**Acceptance Criteria:**
- Admin can invite users by email
- Admin can remove members
- Admin can promote members to admin
- Admin can transfer ownership

### 1.3 Tool Management

#### US-007: Add Tool
**As a** tool owner
**I want to** add tools to my inventory
**So that** others can borrow them

**Acceptance Criteria:**
- User can add tool with: name, description, category, brand, model
- User can scan barcode or search UPCitemdb to auto-populate tool details
- User can upload 1-5 photos of the tool
- User can specify which circles the tool is shared with
- User can set availability preferences (days of week, advance notice)
- User can mark tool as "available" or "unavailable"

#### US-007a: Tool Lookup via Barcode/Search
**As a** tool owner
**I want to** look up tool details automatically
**So that** I don't have to manually enter all information

**Acceptance Criteria:**
- User can enter UPC/barcode number to fetch tool details from UPCitemdb API
- User can search by tool name to find matching products
- Auto-populated fields: name, brand, model, description, category (suggested)
- User can edit any auto-populated fields before saving
- Graceful fallback if API returns no results (manual entry)
- API usage stays within free tier limits (100 requests/day)

#### US-008: Edit Tool
**As a** tool owner
**I want to** update my tool listings
**So that** information stays accurate

**Acceptance Criteria:**
- Owner can edit all tool details
- Owner can add/remove photos
- Owner can change circle visibility
- Owner can archive (soft delete) tools

#### US-009: Tool Categories
**As a** user
**I want to** browse tools by category
**So that** I can find what I need quickly

**Acceptance Criteria:**
- Predefined categories: Power Tools, Hand Tools, Garden/Yard, Automotive, Kitchen, Camping/Outdoor, Electronics, Other
- Tools can have one primary category
- Tools can have multiple tags for better searchability

### 1.4 Search & Discovery

#### US-010: Search Tools
**As a** borrower
**I want to** search for tools
**So that** I can find what I need

**Acceptance Criteria:**
- Full-text search across tool name, description, brand, model
- Filter by category, availability dates, circle
- Sort by relevance, date added, distance (if location enabled)
- Search results show tool photo, name, owner, availability status

#### US-011: Browse Tools
**As a** borrower
**I want to** browse available tools
**So that** I can discover tools I didn't know were available

**Acceptance Criteria:**
- Browse by category
- Browse by circle
- Browse recently added
- View tool detail page with full info and photos

### 1.5 Reservations & Booking

#### US-012: Request Reservation
**As a** borrower
**I want to** request to borrow a tool
**So that** I can use it for my project

**Acceptance Criteria:**
- User selects desired date range on calendar
- User can add a note explaining the need
- System checks for conflicts before allowing request
- Owner is notified of new request
- **Optimistic update:** UI shows pending status immediately

#### US-013: View Tool Availability
**As a** borrower
**I want to** see when a tool is available
**So that** I can plan my reservation

**Acceptance Criteria:**
- FullCalendar shows tool availability
- Existing reservations shown as blocked time
- Owner's availability preferences reflected
- Clear visual distinction: available, pending, confirmed, unavailable

#### US-014: Approve/Deny Reservation
**As a** tool owner
**I want to** approve or deny reservation requests
**So that** I maintain control over my tools

**Acceptance Criteria:**
- Owner sees pending requests in dashboard
- Owner can approve with optional message
- Owner can deny with required reason
- Borrower is notified of decision
- **Optimistic update:** Status changes immediately in UI

#### US-015: Cancel Reservation
**As a** borrower or owner
**I want to** cancel a reservation
**So that** plans can change

**Acceptance Criteria:**
- Borrower can cancel any time before pickup
- Owner can cancel with required reason
- Both parties notified of cancellation
- Tool becomes available again immediately

#### US-016: View My Reservations
**As a** user
**I want to** see all my reservations
**So that** I can track my commitments

**Acceptance Criteria:**
- Dashboard shows: upcoming, active, past reservations
- Filter by status: pending, confirmed, active, completed, cancelled
- Quick actions: cancel, contact owner, add photos

### 1.6 Loan Lifecycle & Condition Tracking

#### US-017: Record Pickup
**As a** borrower
**I want to** confirm tool pickup
**So that** the loan officially begins

**Acceptance Criteria:**
- Borrower confirms pickup in app
- Borrower uploads "before" photo(s) showing tool condition
- Reservation status changes to "active"
- Owner is notified of pickup

#### US-018: Record Return
**As a** borrower
**I want to** confirm tool return
**So that** the loan officially ends

**Acceptance Criteria:**
- Borrower confirms return in app
- Borrower uploads "after" photo(s) showing tool condition
- Owner confirms receipt and condition
- Reservation status changes to "completed"

#### US-019: Before/After Photo Comparison
**As a** tool owner
**I want to** compare before and after photos
**So that** I can verify tool condition

**Acceptance Criteria:**
- Side-by-side photo comparison view
- Photos timestamped and immutable
- Owner can flag condition issues
- Photo history retained for dispute resolution

#### US-020: Rate & Review
**As a** user
**I want to** rate my experience
**So that** the community can build trust

**Acceptance Criteria:**
- After loan completion, both parties can rate (1-5 stars)
- Optional written review
- Ratings contribute to user reputation score
- Reviews visible on user profile

### 1.7 Notifications

#### US-021: Notification Preferences
**As a** user
**I want to** control my notifications
**So that** I'm not overwhelmed

**Acceptance Criteria:**
- Email notifications: on/off per type
- In-app notifications: always on
- Notification types: new request, request approved/denied, pickup reminder, return reminder, new review

#### US-022: Receive Notifications
**As a** user
**I want to** be notified of important events
**So that** I don't miss anything

**Acceptance Criteria:**
- In-app notification center
- Email for critical events (configurable)
- Unread indicator in UI
- Mark as read / mark all read

### 1.8 Subscription & Billing

#### US-023: Subscribe to Service
**As a** new user
**I want to** subscribe to the service
**So that** I can access the tool sharing platform

**Acceptance Criteria:**
- User sees pricing during registration ($7-10/month)
- Payment processed via Stripe (or similar)
- Subscription starts immediately upon payment
- User receives confirmation email with receipt
- Grace period: 7 days past due before access suspended

#### US-024: Manage Subscription
**As a** subscriber
**I want to** manage my subscription
**So that** I can update payment or cancel

**Acceptance Criteria:**
- User can view current subscription status
- User can update payment method
- User can cancel subscription (access continues until period end)
- User can view billing history
- Admin can grant complimentary access if needed

---

## 2. Non-Functional Requirements

### 2.1 Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Page Load | < 3 seconds | Standard UX benchmark |
| API Response | < 500ms (p95) | Acceptable for low-traffic app |
| Image Upload | < 5 seconds (5MB) | Reasonable for mobile uploads |
| Search Results | < 1 second | User expectation for search |

**Optimistic Updates:**
- All user actions reflect immediately in UI
- Background sync confirms with server
- Rollback UI if server rejects
- No loading spinners for common actions

### 2.2 Scalability

| Dimension | Initial Target | Notes |
|-----------|---------------|-------|
| Concurrent Users | 50 | Friends/community scale |
| Total Users | 500 | Single community |
| Tools Listed | 2,000 | ~4 tools per user |
| Reservations/Month | 200 | Low volume expected |
| Image Storage | 10 GB | ~5 images/tool average |

**Scaling Strategy:**
- Azure SQL Serverless handles variable load
- App Service scales manually if needed
- Blob Storage scales automatically
- No need for caching layer initially

### 2.3 Security

#### Authentication & Authorization
- Azure AD B2C handles all authentication
- JWT tokens with 1-hour expiry
- Refresh tokens for session continuity
- Role-based access: User, Circle Admin, System Admin

#### Data Protection
- All data encrypted at rest (Azure default)
- All traffic over HTTPS (TLS 1.2+)
- PII limited to: name, email, phone
- No payment data stored (no transactions)

#### Application Security
- OWASP Top 10 compliance
- Input validation on all endpoints
- Output encoding to prevent XSS
- SQL injection prevented by DAB/parameterized queries
- CORS restricted to known origins
- Rate limiting on auth endpoints

### 2.4 Availability

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Planned Maintenance | Off-peak hours with notice |
| Recovery Time Objective | 4 hours |
| Recovery Point Objective | 24 hours |

### 2.5 Browser Support

| Browser | Versions |
|---------|----------|
| Chrome | Last 2 major versions |
| Firefox | Last 2 major versions |
| Safari | Last 2 major versions |
| Edge | Last 2 major versions |
| Mobile Safari | iOS 15+ |
| Chrome Mobile | Android 10+ |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Circle    │       │    Tool     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │    ┌──│ id (PK)     │
│ externalId  │  │    │ name        │    │  │ ownerId(FK) │──┐
│ displayName │  │    │ description │    │  │ name        │  │
│ email       │  │    │ inviteCode  │    │  │ description │  │
│ phone       │  │    │ isPublic    │    │  │ category    │  │
│ avatarUrl   │  │    │ createdBy   │────┘  │ brand       │  │
│ bio         │  │    │ createdAt   │       │ model       │  │
│ location    │  │    └─────────────┘       │ status      │  │
│ reputation  │  │           │              │ createdAt   │  │
│ createdAt   │  │           │              └─────────────┘  │
└─────────────┘  │           │                     │         │
       │         │    ┌──────┴──────┐              │         │
       │         │    │             │              │         │
       │         ▼    ▼             ▼              │         │
       │  ┌─────────────┐   ┌─────────────┐       │         │
       │  │CircleMember │   │ ToolCircle  │       │         │
       │  ├─────────────┤   ├─────────────┤       │         │
       │  │ id (PK)     │   │ id (PK)     │       │         │
       │  │ circleId(FK)│   │ toolId (FK) │───────┘         │
       │  │ userId (FK) │───│ circleId(FK)│                 │
       │  │ role        │   └─────────────┘                 │
       │  │ joinedAt    │                                   │
       │  └─────────────┘                                   │
       │                                                    │
       │         ┌─────────────┐       ┌─────────────┐      │
       │         │ Reservation │       │ ToolPhoto   │      │
       │         ├─────────────┤       ├─────────────┤      │
       │         │ id (PK)     │       │ id (PK)     │      │
       └────────▶│ toolId (FK) │───────│ toolId (FK) │──────┘
                 │ borrowerId  │       │ url         │
                 │ status      │       │ isPrimary   │
                 │ startDate   │       │ uploadedAt  │
                 │ endDate     │       └─────────────┘
                 │ note        │
                 │ createdAt   │       ┌─────────────┐
                 └─────────────┘       │ LoanPhoto   │
                        │              ├─────────────┤
                        │              │ id (PK)     │
                        ▼              │ reservationId│
                 ┌─────────────┐       │ type        │
                 │   Review    │       │ url         │
                 ├─────────────┤       │ uploadedAt  │
                 │ id (PK)     │       │ notes       │
                 │ reservationId│──────└─────────────┘
                 │ reviewerId  │
                 │ revieweeId  │
                 │ rating      │
                 │ comment     │
                 │ createdAt   │
                 └─────────────┘
```

### 3.2 Entity Definitions

#### User
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Internal ID |
| externalId | NVARCHAR(255) | UNIQUE, NOT NULL | Azure AD B2C object ID |
| displayName | NVARCHAR(100) | NOT NULL | Public display name |
| email | NVARCHAR(255) | UNIQUE, NOT NULL | Email address |
| phone | NVARCHAR(20) | NULL | Optional phone |
| avatarUrl | NVARCHAR(500) | NULL | Profile photo URL |
| bio | NVARCHAR(500) | NULL | User bio |
| streetAddress | NVARCHAR(200) | NULL | Pickup address line 1 |
| city | NVARCHAR(100) | NULL | City |
| state | NVARCHAR(50) | NULL | State |
| zipCode | NVARCHAR(20) | NULL | ZIP code |
| reputationScore | DECIMAL(3,2) | DEFAULT 0 | Calculated rating |
| notifyEmail | BIT | DEFAULT 1 | Email notifications |
| stripeCustomerId | NVARCHAR(255) | NULL | Stripe customer ID |
| subscriptionStatus | NVARCHAR(20) | DEFAULT 'trial' | 'trial', 'active', 'past_due', 'cancelled' |
| subscriptionEndsAt | DATETIME2 | NULL | When current period ends |
| tosAcceptedAt | DATETIME2 | NULL | Terms acceptance timestamp |
| createdAt | DATETIME2 | DEFAULT GETUTCDATE() | Registration date |
| updatedAt | DATETIME2 | NULL | Last update |

#### Circle
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Circle ID |
| name | NVARCHAR(100) | NOT NULL | Circle name |
| description | NVARCHAR(500) | NULL | Circle description |
| inviteCode | NVARCHAR(20) | UNIQUE, NOT NULL | Join code |
| isPublic | BIT | DEFAULT 0 | Allow join requests |
| createdBy | UNIQUEIDENTIFIER | FK -> User | Creator |
| createdAt | DATETIME2 | DEFAULT GETUTCDATE() | Creation date |

#### CircleMember
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Membership ID |
| circleId | UNIQUEIDENTIFIER | FK -> Circle | Circle |
| userId | UNIQUEIDENTIFIER | FK -> User | Member |
| role | NVARCHAR(20) | NOT NULL | 'member', 'admin', 'owner' |
| joinedAt | DATETIME2 | DEFAULT GETUTCDATE() | Join date |
| UNIQUE | (circleId, userId) | | One membership per circle |

#### Tool
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Tool ID |
| ownerId | UNIQUEIDENTIFIER | FK -> User, NOT NULL | Owner |
| name | NVARCHAR(100) | NOT NULL | Tool name |
| description | NVARCHAR(1000) | NULL | Tool description |
| category | NVARCHAR(50) | NOT NULL | Primary category |
| brand | NVARCHAR(100) | NULL | Brand name |
| model | NVARCHAR(100) | NULL | Model number |
| status | NVARCHAR(20) | DEFAULT 'available' | 'available', 'unavailable', 'archived' |
| advanceNoticeDays | INT | DEFAULT 1 | Minimum booking notice |
| maxLoanDays | INT | DEFAULT 7 | Maximum loan duration |
| createdAt | DATETIME2 | DEFAULT GETUTCDATE() | Created date |
| updatedAt | DATETIME2 | NULL | Last update |

#### ToolCircle
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Link ID |
| toolId | UNIQUEIDENTIFIER | FK -> Tool | Tool |
| circleId | UNIQUEIDENTIFIER | FK -> Circle | Circle |
| UNIQUE | (toolId, circleId) | | One link per pair |

#### ToolPhoto
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Photo ID |
| toolId | UNIQUEIDENTIFIER | FK -> Tool | Tool |
| url | NVARCHAR(500) | NOT NULL | Blob storage URL |
| isPrimary | BIT | DEFAULT 0 | Primary listing photo |
| uploadedAt | DATETIME2 | DEFAULT GETUTCDATE() | Upload date |

#### Reservation
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Reservation ID |
| toolId | UNIQUEIDENTIFIER | FK -> Tool, NOT NULL | Tool |
| borrowerId | UNIQUEIDENTIFIER | FK -> User, NOT NULL | Borrower |
| status | NVARCHAR(20) | NOT NULL | See status enum |
| startDate | DATE | NOT NULL | Loan start |
| endDate | DATE | NOT NULL | Loan end |
| note | NVARCHAR(500) | NULL | Borrower note |
| ownerNote | NVARCHAR(500) | NULL | Owner response |
| pickupConfirmedAt | DATETIME2 | NULL | Pickup timestamp |
| returnConfirmedAt | DATETIME2 | NULL | Return timestamp |
| createdAt | DATETIME2 | DEFAULT GETUTCDATE() | Request date |
| updatedAt | DATETIME2 | NULL | Last update |

**Reservation Status Enum:**
- `pending` - Awaiting owner approval
- `confirmed` - Approved, awaiting pickup
- `active` - Tool picked up, loan in progress
- `completed` - Tool returned, loan finished
- `cancelled` - Cancelled by either party
- `declined` - Owner declined request

#### LoanPhoto
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Photo ID |
| reservationId | UNIQUEIDENTIFIER | FK -> Reservation | Reservation |
| type | NVARCHAR(20) | NOT NULL | 'before', 'after' |
| url | NVARCHAR(500) | NOT NULL | Blob storage URL |
| uploadedBy | UNIQUEIDENTIFIER | FK -> User | Uploader |
| notes | NVARCHAR(500) | NULL | Condition notes |
| uploadedAt | DATETIME2 | DEFAULT GETUTCDATE() | Upload date |

#### Review
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Review ID |
| reservationId | UNIQUEIDENTIFIER | FK -> Reservation | Related loan |
| reviewerId | UNIQUEIDENTIFIER | FK -> User | Who wrote it |
| revieweeId | UNIQUEIDENTIFIER | FK -> User | Who it's about |
| rating | INT | CHECK (1-5) | Star rating |
| comment | NVARCHAR(1000) | NULL | Written review |
| createdAt | DATETIME2 | DEFAULT GETUTCDATE() | Review date |
| UNIQUE | (reservationId, reviewerId) | | One review per party |

#### Notification
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UNIQUEIDENTIFIER | PK, DEFAULT NEWID() | Notification ID |
| userId | UNIQUEIDENTIFIER | FK -> User | Recipient |
| type | NVARCHAR(50) | NOT NULL | Notification type |
| title | NVARCHAR(200) | NOT NULL | Notification title |
| message | NVARCHAR(1000) | NOT NULL | Notification body |
| relatedId | UNIQUEIDENTIFIER | NULL | Related entity ID |
| isRead | BIT | DEFAULT 0 | Read status |
| createdAt | DATETIME2 | DEFAULT GETUTCDATE() | Created date |

---

## 4. Architecture Decision Records

### ADR-001: Use Optimistic Updates Instead of Real-Time

**Status:** Accepted

**Context:**
The application needs to provide responsive UI feedback when users perform actions (create reservations, approve requests, etc.). Options considered:
1. Azure Web PubSub for real-time updates
2. Polling for updates
3. Optimistic updates with background sync

**Decision:**
Use optimistic updates with background sync.

**Rationale:**
- Expected low traffic (50 concurrent users) doesn't justify real-time infrastructure
- Web PubSub adds ~$50+/month cost
- Optimistic updates provide instant feedback without server round-trip
- Conflict likelihood is very low for this use case
- Simpler architecture = lower maintenance

**Consequences:**
- (+) Lower cost
- (+) Simpler architecture
- (+) Instant UI feedback
- (-) Rare edge case: two users could request same dates simultaneously
- (-) UI must handle rollback on server rejection

**Mitigation:**
- Server validates all reservations for conflicts before confirming
- UI shows clear error if optimistic update is rolled back
- Reservation requests go through approval workflow anyway

---

### ADR-002: Azure AD B2C for Authentication

**Status:** Accepted

**Context:**
Need secure authentication for consumer-facing application. Options:
1. Azure AD B2C
2. Auth0
3. Firebase Auth
4. Custom authentication

**Decision:**
Use Azure AD B2C.

**Rationale:**
- 50,000 MAU free tier covers expected usage
- Consistent with existing Azure stack
- Built-in social login (Google, Microsoft, Facebook)
- Handles password reset, MFA, account verification
- MSAL-React library already used in reference project

**Consequences:**
- (+) Free for expected scale
- (+) Enterprise-grade security
- (+) Consistent with existing stack
- (-) Azure AD B2C has learning curve
- (-) Less flexible than Auth0 for custom flows

---

### ADR-003: Azure SQL Serverless for Database

**Status:** Accepted

**Context:**
Need relational database for structured data. Options:
1. Azure SQL Serverless
2. Azure SQL Basic tier
3. Azure Database for PostgreSQL
4. Cosmos DB

**Decision:**
Use Azure SQL Serverless tier.

**Rationale:**
- Auto-pauses when inactive (cost savings)
- Pay only for compute used
- Consistent with reference project (SQL Server)
- DAB works seamlessly with Azure SQL
- Supports all needed features (transactions, constraints, etc.)

**Consequences:**
- (+) Cost optimized for low/variable traffic
- (+) Consistent with existing stack
- (+) Auto-scales within tier
- (-) Cold start latency (~1 minute) after pause
- (-) Minimum charge when active

**Mitigation:**
- Configure auto-pause delay to 1 hour
- First user after pause sees loading state
- Consider Basic tier if cold starts are problematic

---

### ADR-004: Azure Data API Builder for Data Access

**Status:** Accepted

**Context:**
Need data access layer between frontend and database. Options:
1. Custom REST API only
2. Custom GraphQL API
3. Azure Data API Builder (DAB)
4. Prisma + custom API

**Decision:**
Use Azure Data API Builder with custom API for business logic.

**Rationale:**
- Auto-generates GraphQL and REST endpoints
- Reduces backend code significantly
- Built-in authorization and filtering
- Proven in reference project
- Custom API only needed for complex business logic

**Consequences:**
- (+) Faster development
- (+) Less code to maintain
- (+) Type-safe GraphQL queries
- (-) Less flexibility for complex queries
- (-) Additional service to deploy

**Architecture:**
```
Frontend -> DAB (CRUD operations)
         -> Custom API (business logic: booking validation, notifications)
```

---

### ADR-005: FullCalendar for Reservation UI

**Status:** Accepted

**Context:**
Need calendar component for viewing and creating reservations. Options:
1. FullCalendar
2. React Big Calendar
3. Custom calendar component

**Decision:**
Use FullCalendar v6.

**Rationale:**
- Already used in reference project
- Mature, well-documented library
- Resource scheduling support
- Good MUI integration
- Supports day, week, month views

**Consequences:**
- (+) Proven solution
- (+) Team familiarity
- (+) Rich feature set
- (-) Large bundle size
- (-) Commercial license for some features (not needed)

---

### ADR-006: Blob Storage for Images

**Status:** Accepted

**Context:**
Need to store tool photos and loan condition photos. Options:
1. Azure Blob Storage
2. Database BLOB storage
3. Third-party CDN (Cloudinary, etc.)

**Decision:**
Use Azure Blob Storage with SAS tokens for secure access.

**Rationale:**
- Cheapest option (~$0.02/GB/month)
- Consistent with Azure stack
- SAS tokens provide secure, time-limited access
- No need for CDN at expected scale
- Easy integration with Azure services

**Consequences:**
- (+) Very low cost
- (+) Secure access control
- (+) Scalable storage
- (-) No automatic image optimization
- (-) No built-in CDN

**Mitigation:**
- Resize images on upload (client or server)
- Add CDN later if performance requires

---

### ADR-007: UPCitemdb for Tool Lookup

**Status:** Accepted

**Context:**
Want to auto-populate tool details to reduce manual data entry. Options:
1. UPCitemdb API (free tier: 100 req/day)
2. Barcode Lookup API (paid)
3. Go-UPC (paid)
4. Manual entry only

**Decision:**
Use UPCitemdb API free tier.

**Rationale:**
- Free tier sufficient for 8-user group (100 requests/day)
- Provides name, brand, description, images
- Simple REST API
- No credit card required
- Can upgrade to paid if needed later

**Consequences:**
- (+) Zero cost
- (+) Reduces data entry friction
- (+) Better data quality
- (-) Limited to 100 requests/day
- (-) Not all tools have UPC codes (hand tools, older items)

**Mitigation:**
- Cache successful lookups in database
- Graceful fallback to manual entry
- Monitor usage; upgrade if approaching limits

**API Details:**
- Endpoint: `https://api.upcitemdb.com/prod/trial/lookup`
- Free tier: 100 requests/day, no API key required
- Paid tier: $10/month for 10,000 requests

---

### ADR-008: Stripe for Subscription Payments

**Status:** Accepted

**Context:**
Need payment processing for monthly subscriptions. Options:
1. Stripe
2. PayPal
3. Square
4. Manual (Venmo/Zelle)

**Decision:**
Use Stripe for subscription billing.

**Rationale:**
- Industry standard for SaaS subscriptions
- Excellent developer experience
- Built-in subscription management
- Customer portal for self-service
- Handles failed payments, retries, dunning
- PCI compliant (we never see card numbers)

**Consequences:**
- (+) Reliable, well-documented
- (+) Handles subscription lifecycle automatically
- (+) Customer self-service portal
- (-) 2.9% + $0.30 per transaction
- (-) Adds complexity vs manual payments

**Implementation:**
- Use Stripe Checkout for payment collection
- Use Stripe Billing for subscription management
- Webhook integration for subscription status updates
- Store `stripeCustomerId` on User entity

---

## 5. UI/UX Specifications

### 5.1 Key Screens

#### 5.1.1 Home / Dashboard
**Purpose:** Landing page for authenticated users

**Components:**
- Quick stats: tools owned, tools borrowed, pending requests
- Upcoming reservations (next 7 days)
- Recent activity feed
- Quick actions: Add Tool, Browse Tools, My Requests

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  [Logo]  Tool Share    [Search]  [Profile] [+]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Welcome, {Name}!                               │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 5 Tools  │ │ 2 Active │ │ 1 Pending│        │
│  │ Listed   │ │ Loans    │ │ Request  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  Upcoming Reservations                          │
│  ┌─────────────────────────────────────────┐   │
│  │ [img] Circular Saw - Jan 20-22          │   │
│  │       Pickup from John                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Recent Activity                                │
│  • Sarah requested your Drill Press            │
│  • Mike approved your ladder request           │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 5.1.2 Tool Listing Page
**Purpose:** Display tool details and availability

**Components:**
- Photo gallery (carousel)
- Tool details (name, description, owner, category)
- Availability calendar (FullCalendar)
- Request reservation form
- Owner info with rating

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  ← Back to Browse                               │
├─────────────────────────────────────────────────┤
│  ┌─────────────────┐  Tool Name                 │
│  │                 │  ★★★★☆ (12 reviews)        │
│  │   [Photo]       │                            │
│  │                 │  Category: Power Tools     │
│  │  [1] [2] [3]    │  Brand: DeWalt             │
│  └─────────────────┘  Model: DWS780             │
│                                                 │
│  Description                                    │
│  12" sliding compound miter saw. Great for...  │
│                                                 │
│  Owner: John D. ★★★★★                          │
│  Location: Downtown                             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │         January 2026                     │   │
│  │  Su Mo Tu We Th Fr Sa                    │   │
│  │              1  2  3  4                  │   │
│  │   5  6  7 [8][9] 10 11                  │   │
│  │  12 13 14 15 16 17 18                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [ Request Jan 8-9 ]                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 5.1.3 Browse / Search Results
**Purpose:** Find and filter tools

**Components:**
- Search bar with filters
- Category tabs/chips
- Tool cards grid
- Pagination

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  [Search tools...                    ] [Filter] │
│                                                 │
│  [All] [Power Tools] [Hand Tools] [Garden] ... │
│                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ [Photo]   │ │ [Photo]   │ │ [Photo]   │    │
│  │           │ │           │ │           │    │
│  │ Miter Saw │ │ Drill     │ │ Ladder    │    │
│  │ John D.   │ │ Sarah M.  │ │ Mike R.   │    │
│  │ Available │ │ Available │ │ Unavail.  │    │
│  └───────────┘ └───────────┘ └───────────┘    │
│                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ [Photo]   │ │ [Photo]   │ │ [Photo]   │    │
│  │  ...      │ │  ...      │ │  ...      │    │
│  └───────────┘ └───────────┘ └───────────┘    │
│                                                 │
│            [1] [2] [3] ... [Next]               │
└─────────────────────────────────────────────────┘
```

#### 5.1.4 My Tools (Owner Dashboard)
**Purpose:** Manage owned tools and requests

**Components:**
- Tools list with status
- Pending requests requiring action
- Active loans
- Add new tool button

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  My Tools                        [+ Add Tool]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Pending Requests (2)                           │
│  ┌─────────────────────────────────────────┐   │
│  │ [img] Drill - Sarah M. wants Jan 15-17  │   │
│  │       "Need for deck project"           │   │
│  │       [Approve] [Decline]               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Active Loans (1)                               │
│  ┌─────────────────────────────────────────┐   │
│  │ [img] Miter Saw - Mike R. (due Jan 22)  │   │
│  │       [View Details]                    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  My Inventory                                   │
│  ┌─────────────────────────────────────────┐   │
│  │ [img] Drill Press     Available  [Edit] │   │
│  │ [img] Circular Saw    On Loan    [Edit] │   │
│  │ [img] Router          Available  [Edit] │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 5.1.5 Reservation Detail / Loan Workflow
**Purpose:** Manage individual reservation lifecycle

**Components:**
- Reservation status timeline
- Tool info
- Participant info
- Before/after photo upload
- Action buttons (contextual)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  ← Back                     Reservation #12345  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Status: ACTIVE                                 │
│  ●───────●───────●───────○───────○             │
│  Request  Approved  Pickup  Return  Complete   │
│                                                 │
│  ┌───────────────┬──────────────────────────┐  │
│  │ [Tool Photo]  │ DeWalt Miter Saw         │  │
│  │               │ Owner: John D.            │  │
│  │               │ Jan 20 - Jan 22, 2026     │  │
│  └───────────────┴──────────────────────────┘  │
│                                                 │
│  Before Photos (Pickup)                         │
│  ┌────┐ ┌────┐ ┌────┐                          │
│  │    │ │    │ │ +  │                          │
│  └────┘ └────┘ └────┘                          │
│                                                 │
│  After Photos (Return)                          │
│  [ Upload photos to confirm return ]           │
│                                                 │
│  [ Confirm Return ]                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 5.1.6 Circle Management
**Purpose:** Manage sharing circles

**Components:**
- Circle list
- Circle detail with members
- Invite management
- Circle tools view

### 5.2 Navigation Structure

```
├── Home (Dashboard)
├── Browse Tools
│   ├── By Category
│   ├── By Circle
│   └── Search Results
├── Tool Detail
│   └── Request Reservation
├── My Tools
│   ├── Add Tool
│   ├── Edit Tool
│   └── Manage Requests
├── My Reservations
│   ├── As Borrower
│   ├── As Lender
│   └── Reservation Detail
├── Circles
│   ├── My Circles
│   ├── Create Circle
│   ├── Circle Detail
│   └── Join Circle
├── Notifications
└── Profile
    ├── Edit Profile
    ├── My Reviews
    └── Settings
```

### 5.3 Design System Notes

**Color Palette:**
- Primary: MUI default blue (or custom brand color)
- Secondary: MUI default purple
- Success: Green (available, confirmed)
- Warning: Orange (pending)
- Error: Red (declined, issues)

**Typography:**
- Use MUI default typography scale
- Roboto font family

**Components:**
- Use MUI components throughout
- Custom components only when MUI doesn't suffice
- Consistent spacing using MUI spacing system (8px base)

**Responsive Breakpoints:**
- Mobile: < 600px (single column)
- Tablet: 600-960px (two columns)
- Desktop: > 960px (full layout)

---

## 6. API Specifications

### 6.1 API Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│    DAB      │────▶│  Azure SQL  │
│   Frontend  │     │  (GraphQL)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │            ┌─────────────┐     ┌─────────────┐
       └───────────▶│  Custom API │────▶│ Blob Storage│
                    │  (Express)  │     │             │
                    └─────────────┘     └─────────────┘
```

### 6.2 DAB Endpoints (Auto-generated)

DAB provides GraphQL and REST endpoints for all entities:

**GraphQL Queries:**
- `users`, `user(id)`
- `circles`, `circle(id)`
- `tools`, `tool(id)`
- `reservations`, `reservation(id)`
- (etc. for all entities)

**GraphQL Mutations:**
- `createUser`, `updateUser`, `deleteUser`
- `createTool`, `updateTool`, `deleteTool`
- (etc. for all entities)

**Filtering & Pagination:**
- DAB supports OData-style filtering
- Example: `tools(filter: { category: { eq: "Power Tools" } })`

### 6.3 Custom API Endpoints

Custom API handles business logic that DAB can't:

#### Reservations

**POST /api/reservations**
Create reservation with conflict checking.

Request:
```json
{
  "toolId": "uuid",
  "startDate": "2026-01-20",
  "endDate": "2026-01-22",
  "note": "Need for deck project"
}
```

Response:
```json
{
  "id": "uuid",
  "status": "pending",
  "toolId": "uuid",
  "startDate": "2026-01-20",
  "endDate": "2026-01-22"
}
```

Errors:
- 409 Conflict: Dates overlap with existing reservation
- 400 Bad Request: Invalid dates, tool unavailable

**POST /api/reservations/{id}/approve**
**POST /api/reservations/{id}/decline**
**POST /api/reservations/{id}/cancel**
**POST /api/reservations/{id}/pickup**
**POST /api/reservations/{id}/return**

#### Image Upload

**POST /api/tools/{id}/photos**
Upload tool photo.

Request: `multipart/form-data` with image file

Response:
```json
{
  "id": "uuid",
  "url": "https://blob.../photo.jpg",
  "isPrimary": false
}
```

**POST /api/reservations/{id}/photos**
Upload before/after photo.

Request:
```json
{
  "type": "before|after",
  "file": "<multipart>",
  "notes": "Small scratch on base"
}
```

#### Search

**GET /api/tools/search?q={query}&category={cat}&circleId={id}**
Full-text search with filters.

Response:
```json
{
  "results": [...],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

#### Notifications

**GET /api/notifications**
Get user's notifications.

**POST /api/notifications/{id}/read**
Mark notification as read.

#### Tool Lookup (UPCitemdb)

**GET /api/tools/lookup?upc={barcode}**
Look up tool by UPC/barcode.

Response:
```json
{
  "found": true,
  "name": "DEWALT 20V MAX Cordless Drill",
  "brand": "DEWALT",
  "model": "DCD771C2",
  "description": "Compact, lightweight design...",
  "category": "Power Tools",
  "imageUrl": "https://..."
}
```

**GET /api/tools/lookup/search?q={query}**
Search for tools by name.

Response:
```json
{
  "results": [
    {
      "upc": "885911478571",
      "name": "DEWALT 20V MAX Cordless Drill",
      "brand": "DEWALT"
    }
  ]
}
```

#### Subscription Management

**POST /api/subscriptions/checkout**
Create Stripe Checkout session for new subscription.

Response:
```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**GET /api/subscriptions/portal**
Get Stripe Customer Portal URL for managing subscription.

Response:
```json
{
  "portalUrl": "https://billing.stripe.com/..."
}
```

**POST /api/webhooks/stripe**
Stripe webhook endpoint (internal, not user-facing).
Handles: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## 7. Security Specifications

### 7.1 Authentication Flow

```
1. User clicks "Sign In"
2. MSAL redirects to Azure AD B2C
3. User authenticates (email/password or social)
4. B2C returns ID token + access token
5. Frontend stores tokens in memory (not localStorage)
6. Frontend includes access token in API requests
7. API/DAB validates token and extracts user claims
```

### 7.2 Authorization Rules

| Resource | Action | Who Can |
|----------|--------|---------|
| Tool | Create | Any authenticated user |
| Tool | Read | Circle members (based on ToolCircle) |
| Tool | Update | Tool owner only |
| Tool | Delete | Tool owner only |
| Reservation | Create | Circle members who can see the tool |
| Reservation | Read | Borrower or tool owner |
| Reservation | Approve/Decline | Tool owner only |
| Reservation | Cancel | Borrower or tool owner |
| Circle | Create | Any authenticated user |
| Circle | Read | Circle members |
| Circle | Update | Circle admins |
| Circle | Delete | Circle owner only |

### 7.3 Data Access Patterns

**Row-Level Security:**
- Users can only see tools shared with their circles
- Users can only see reservations where they are borrower or owner
- Implemented via DAB permission policies

**Example DAB Policy:**
```json
{
  "entities": {
    "Tool": {
      "permissions": [{
        "role": "authenticated",
        "actions": [{
          "action": "read",
          "policy": {
            "database": "@claims.userId in (SELECT userId FROM CircleMember WHERE circleId IN (SELECT circleId FROM ToolCircle WHERE toolId = @item.id))"
          }
        }]
      }]
    }
  }
}
```

### 7.4 Image Security

- All images stored in private blob container
- Access via SAS tokens with 1-hour expiry
- SAS tokens generated server-side
- No direct public URLs

---

## 8. Cost Estimation

### 8.1 Monthly Cost Breakdown (Estimated)

| Service | SKU/Tier | Est. Monthly Cost |
|---------|----------|-------------------|
| Azure SQL | Serverless (1 vCore, 5GB) | $5-15 |
| App Service (API) | B1 Basic | $13 |
| App Service (UI) | B1 Basic or Static Web App Free | $0-13 |
| Data API Builder | App Service B1 | $13 |
| Blob Storage | LRS, 10GB + transactions | $1-2 |
| Azure AD B2C | Free tier (50K MAU) | $0 |
| UPCitemdb API | Free tier (100 req/day) | $0 |
| Stripe | 2.9% + $0.30 per transaction | ~$2-5 |
| **Total** | | **$34-61/month** |

### 8.2 Subscription Revenue Model

| Users | Price/User | Monthly Revenue | Net (after Stripe) |
|-------|------------|-----------------|-------------------|
| 8 | $7 | $56 | ~$51 |
| 8 | $10 | $80 | ~$74 |
| 15 | $7 | $105 | ~$96 |

**Recommendation:** $8/month subscription covers costs with 8 users and provides small buffer.

### 8.3 Cost Optimization Notes

1. **SQL Serverless** - Pauses after 1 hour idle, resumes on connection
2. **Static Web App** - Free tier for frontend if no server-side rendering needed
3. **B1 App Service** - Smallest paid tier, sufficient for low traffic
4. **No CDN** - Add later only if needed
5. **No real-time** - Eliminated Web PubSub cost
6. **UPCitemdb Free Tier** - 100 requests/day plenty for small group

### 8.4 Scaling Costs

If usage grows beyond initial estimates:
- SQL: Scale vCores (serverless auto-scales)
- App Service: Move to S1 Standard (~$70/mo each)
- Add Azure CDN for images (~$0.08/GB)
- Consider Redis Cache for search (~$16/mo)
- UPCitemdb paid tier if needed (~$10/mo for 10K requests)

---

## 9. Development Phases

### Phase 1: Foundation (MVP)
- User authentication (Azure AD B2C)
- Basic tool CRUD (add, edit, list, view)
- Single "default" circle (all users)
- Simple reservation request/approve flow
- Basic search (name only)

### Phase 2: Core Features
- Multiple circles with invites
- FullCalendar integration
- Before/after photo workflow
- Email notifications
- Ratings and reviews

### Phase 3: Polish
- Advanced search with filters
- Notification center (in-app)
- User profile enhancements
- Mobile-responsive optimizations
- Performance tuning

### Phase 4: Future Considerations (Out of Scope)
- Mobile apps (React Native)
- Payment/deposit handling
- Tool delivery coordination
- Insurance integration
- Public tool libraries (beyond friends)

---

## 10. Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Registration | 50 users in first month | User count in DB |
| Tools Listed | 100 tools in first month | Tool count in DB |
| Successful Loans | 80% of reservations complete | Status tracking |
| User Satisfaction | 4+ star average rating | Review aggregation |
| System Availability | 99.5% uptime | Azure monitoring |
| Page Load Time | < 3 seconds | Application Insights |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Circle | A group of users who share tools with each other |
| Tool | A physical item that can be borrowed |
| Reservation | A request to borrow a tool for specific dates |
| Loan | An active reservation where the tool has been picked up |
| Owner | The user who owns and lists a tool |
| Borrower | The user who requests and uses a tool |
| Before Photo | Photo documenting tool condition at pickup |
| After Photo | Photo documenting tool condition at return |

---

## Appendix B: Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Dispute Resolution | Out-of-band for MVP | Close friends group; handled informally. Borrower accepts responsibility for damages. |
| Deposits | Not for MVP | Adds payment complexity; trust-based system for friends |
| Location Sharing | Exact address | Needed for pickup/return; only visible to confirmed borrowers |
| Verification | None for MVP | Trust-based for friends group |
| Liability | Terms of Service with damage clause | See Appendix C |

---

## Appendix C: Terms of Service (California)

The following terms must be accepted by all users during registration. These are drafted for California compliance including CCPA.

### Tool Share Terms of Service

**Effective Date:** [Launch Date]
**Last Updated:** [Launch Date]

#### 1. Acceptance of Terms
By accessing or using Tool Share ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.

#### 2. Description of Service
Tool Share is a platform that facilitates peer-to-peer tool lending among registered members. Tool Share does not own any tools listed on the platform and is not a party to any lending transaction between users.

#### 3. User Responsibilities

**3.1 Tool Owners ("Lenders")**
- You represent that you own or have the right to lend any tools you list
- You are responsible for accurately describing tool condition
- You agree to make tools available as scheduled in confirmed reservations

**3.2 Tool Borrowers ("Borrowers")**
- **You accept full responsibility for any damage to, loss of, or theft of borrowed tools while in your possession**
- You agree to return tools in the same condition as received (normal wear excepted)
- You agree to document tool condition with photos at pickup and return
- You agree to return tools by the agreed-upon date
- You agree to use tools only for their intended purpose and in a safe manner

#### 4. Damage and Loss Policy
**BORROWERS ARE FULLY RESPONSIBLE FOR ANY DAMAGE, LOSS, OR THEFT OF TOOLS DURING THE LOAN PERIOD.** This includes:
- Repair costs for damaged tools
- Replacement value for lost or stolen tools
- Any consequential damages arising from tool misuse

Disputes regarding tool condition should be resolved directly between the Lender and Borrower. Tool Share provides before/after photos to assist in dispute resolution but does not mediate or adjudicate disputes.

#### 5. Limitation of Liability
**TO THE MAXIMUM EXTENT PERMITTED BY LAW:**
- Tool Share is not liable for any damages arising from tool use, including personal injury or property damage
- Tool Share is not liable for the actions of any user
- Tool Share's total liability shall not exceed the subscription fees paid by you in the 12 months preceding the claim
- Tool Share does not guarantee tool quality, safety, or fitness for any purpose

#### 6. Indemnification
You agree to indemnify and hold harmless Tool Share, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights
- Any tool you lend or borrow through the Service

#### 7. Subscription and Payment
- Access requires a paid subscription ($8/month or as displayed)
- Subscriptions auto-renew monthly until cancelled
- You may cancel at any time; access continues until the end of the billing period
- No refunds for partial months

#### 8. Privacy Policy (CCPA Compliance)

**8.1 Information We Collect**
- Account information: name, email, phone, address
- Usage data: tools listed, reservations, reviews
- Photos: tool photos, condition documentation

**8.2 How We Use Information**
- To provide and improve the Service
- To facilitate tool lending transactions
- To communicate with you about your account
- To enforce our Terms of Service

**8.3 Information Sharing**
- With other users: Your profile, tools, and address (to confirmed borrowers only)
- With service providers: Payment processing (Stripe), hosting (Microsoft Azure)
- We do not sell your personal information

**8.4 Your California Privacy Rights (CCPA)**
California residents have the right to:
- Know what personal information we collect
- Request deletion of your personal information
- Opt-out of the sale of personal information (we do not sell)
- Non-discrimination for exercising your rights

To exercise these rights, contact: [support email]

**8.5 Data Retention**
- Account data: Retained while account is active + 2 years
- Transaction records: 7 years (legal requirement)
- Photos: Retained for 1 year after loan completion

#### 9. Termination
- You may terminate your account at any time
- We may terminate accounts that violate these Terms
- Upon termination, your access ends but data retention policies apply

#### 10. Governing Law
These Terms are governed by the laws of the State of California. Any disputes shall be resolved in the courts of [County], California.

#### 11. Changes to Terms
We may update these Terms. Continued use after changes constitutes acceptance.

#### 12. Contact
Questions about these Terms: [support email]

---

## Appendix D: Future Considerations (Post-MVP)

| Feature | Priority | Notes |
|---------|----------|-------|
| Deposits/holds | Medium | Stripe supports auth holds |
| Insurance integration | Low | Partner with tool rental insurance |
| Delivery coordination | Low | Could integrate with TaskRabbit |
| Mobile app | Medium | React Native, share code with web |
| Public tool libraries | Low | Would need different trust model |
| Dispute mediation | Low | Only if friend-group model expands |

---

*Document generated following ACTO Delivery Playbook standards.*
