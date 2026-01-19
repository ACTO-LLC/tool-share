# ADR-010: Feature-Slice Development Approach

**Status:** Accepted
**Date:** 2026-01-18
**Decision Makers:** Development Team

## Context

The Tool Share project requires parallel development by 3 agents/developers to accelerate delivery. We need a work organization strategy that:
- Maximizes parallel execution with minimal blocking
- Reduces integration risk
- Delivers testable increments early
- Minimizes merge conflicts

Two primary approaches were considered: horizontal (track-based) and vertical (feature-slice) organization.

## Decision

Adopt a **vertical feature-slice approach** where each developer owns a complete feature area across all layers (database, API, UI).

### Slice Assignments

| Slice | Scope | Key Deliverables |
|-------|-------|------------------|
| **Slice 1: User & Auth** | Authentication, profiles, circles, subscriptions | Login flow, user management, circle membership |
| **Slice 2: Tools & Search** | Tool CRUD, photos, search, browsing | Tool listings, photo upload, search functionality |
| **Slice 3: Reservations** | Booking, loan lifecycle, notifications, reviews | Reservation flow, pickup/return, notifications |

### Shared Foundation

Before parallel slice work begins, complete shared foundation:
- Database schema (can be split by domain)
- DAB configuration
- Project scaffolding and shared utilities

## Options Considered

### Option 1: Horizontal Track-Based (Rejected)

```
Track A: Infrastructure (DB, DAB, Azure)
Track B: Backend (APIs, business logic)
Track C: Frontend (React UI)
```

- **Pros:**
  - Clear ownership by technical domain
  - Minimal merge conflicts (different directories)
  - Matches traditional team structures
- **Cons:**
  - Creates blocking dependencies (B & C wait for A)
  - Integration risk at the end ("big bang" integration)
  - Features not testable until all tracks converge
  - API contracts may drift without tight coordination

### Option 2: Vertical Feature-Slice (Accepted)

```
Slice 1: User & Auth (all layers)
Slice 2: Tools & Search (all layers)
Slice 3: Reservations & Loans (all layers)
```

- **Pros:**
  - Each developer delivers complete, testable features
  - Less coordination needed on API contracts
  - Faster feedback loops
  - Better for AI agents (no skill specialization constraint)
  - Reduces integration risk
- **Cons:**
  - More potential for merge conflicts in shared code
  - Requires upfront agreement on patterns
  - Each developer needs full-stack capability

## Consequences

### Positive
- Features are testable end-to-end as they're completed
- Each slice can demo independently
- Reduced integration risk at milestones
- Natural alignment with user stories
- AI agents can work autonomously within their slice

### Negative
- Shared code (auth middleware, utilities) needs coordination
- Possible code duplication if patterns not established upfront
- Merge conflicts possible in shared files (routes, app config)

### Risks
- **Mitigation for shared code:** Slice 1 owns auth middleware; other slices import it
- **Mitigation for patterns:** Establish conventions before starting (API response shapes, error handling, component structure)
- **Mitigation for conflicts:** Use feature branches, integrate to main frequently

## Implementation

### Phase 1: Foundation (Collaborative)
1. Database schema - can split tables by slice owner
2. DAB configuration - one owner, others contribute entity configs
3. Establish shared patterns:
   - API response format: `{ data, error, meta }`
   - Error handling middleware
   - React component structure
   - Auth token handling

### Phase 2+: Parallel Slice Development

```
Week 1: Foundation setup
        ├─ All: Agree on API contracts and patterns
        ├─ Slice 1: Users/Circles tables
        ├─ Slice 2: Tools/Photos tables
        └─ Slice 3: Reservations tables + DAB config

Week 2+: Parallel feature development
        ├─ Slice 1: Auth → Profile → App Shell → Circles
        ├─ Slice 2: Blob Storage → Tools API → Tool UI pages
        └─ Slice 3: Reservation API → Dashboard → Booking UI
```

### Coordination Points
- Daily sync on shared code changes
- Slice 1 publishes auth middleware early (others can mock initially)
- API contracts defined in OpenAPI spec before implementation
- Integration testing at end of each phase

## GitHub Organization

Issues are labeled by slice for easy filtering:
- `foundation` - Shared work, do first
- `slice-1-auth` - User & Auth features
- `slice-2-tools` - Tools & Search features
- `slice-3-reservations` - Reservations & Loans features

Milestones track phases:
- Phase 1: MVP Foundation
- Phase 2: Core Features
- Phase 3: Polish

## Git Branching Strategy

**CRITICAL: Each agent/developer MUST work on their own feature branch.**

### Branch Naming Convention
```
feature/slice-1-auth
feature/slice-2-tools
feature/slice-3-reservations
```

### Workflow for Parallel Agents

```bash
# BEFORE launching agents, create branches from master:
git checkout master
git pull origin master
git checkout -b feature/slice-1-auth
git push -u origin feature/slice-1-auth
git checkout master
git checkout -b feature/slice-2-tools
git push -u origin feature/slice-2-tools
git checkout master
git checkout -b feature/slice-3-reservations
git push -u origin feature/slice-3-reservations
```

### Agent Launch Instructions

Each agent prompt MUST include:
```
IMPORTANT: Before making any changes:
1. Run: git checkout feature/slice-X-name
2. Verify you are on the correct branch: git branch --show-current
3. All commits go to YOUR branch only
4. When done, push: git push origin feature/slice-X-name
```

### Integration Process

After all agents complete their slice work:

1. **Create PRs** - Each slice branch creates a PR to master
2. **Review** - Review each PR for conflicts with other slices
3. **Merge order** - Merge in dependency order:
   - Slice 1 (Auth) first - provides auth middleware
   - Slice 2 (Tools) second
   - Slice 3 (Reservations) third
4. **Resolve conflicts** - If conflicts arise, resolve in the later PR

### Why This Matters

- **Prevents merge conflicts** during parallel development
- **Enables code review** before integration
- **Allows rollback** of individual slices if needed
- **Creates audit trail** of who changed what

### Lesson Learned

> If agents work on the same branch simultaneously, they will overwrite each other's
> changes and create untraceable merge conflicts. Always isolate agent work to
> separate branches.

## Related

- [GitHub Issues](https://github.com/ACTO-LLC/tool-share/issues)
- [Functional Specification](../../../functional-spec.md)
- ADR-004: Data API Builder (shared infrastructure)
