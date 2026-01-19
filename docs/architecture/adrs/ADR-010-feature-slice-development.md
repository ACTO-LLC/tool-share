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

## Git Worktree Strategy

**CRITICAL: Each agent/developer MUST work in their own git worktree (separate directory).**

Branches alone are not sufficient for parallel development. A single git working directory can only have one branch checked out at a time. When an agent runs `git checkout`, it overwrites the entire directory, destroying any other agent's in-progress work.

### The Solution: Git Worktrees

Git worktrees allow multiple branches to be checked out simultaneously in separate directories:

```
C:/source/tool-share/           # Main repo (master)
C:/source/tool-share-slice-1/   # Worktree (feature/slice-1-auth)
C:/source/tool-share-slice-2/   # Worktree (feature/slice-2-tools)
C:/source/tool-share-slice-3/   # Worktree (feature/slice-3-reservations)
```

### Worktree Setup (REQUIRED)

```bash
# From the main repository
cd C:/source/tool-share
git checkout master && git pull origin master

# Create worktrees for each slice
# Syntax: git worktree add <path> -b <new-branch-name>
git worktree add ../tool-share-slice-1 -b feature/slice-1-auth-phaseN
git worktree add ../tool-share-slice-2 -b feature/slice-2-tools-phaseN
git worktree add ../tool-share-slice-3 -b feature/slice-3-reservations-phaseN

# Push branches to remote
git push -u origin feature/slice-1-auth-phaseN
git push -u origin feature/slice-2-tools-phaseN
git push -u origin feature/slice-3-reservations-phaseN

# Install dependencies in each worktree
cd ../tool-share-slice-1/TS.UI && npm install && cd ../TS.API && npm install
cd ../../tool-share-slice-2/TS.UI && npm install && cd ../TS.API && npm install
cd ../../tool-share-slice-3/TS.UI && npm install && cd ../TS.API && npm install

# Verify worktrees
cd ../tool-share
git worktree list
```

### Agent Launch Instructions

Each agent prompt MUST specify the worktree path, NOT a branch to checkout:

```
## Working Directory (MANDATORY)
You are working in: C:/source/tool-share-slice-X
This is a git worktree already checked out to: feature/slice-X-name-phaseN

Before making changes:
1. Verify: pwd should show C:/source/tool-share-slice-X
2. Verify: git branch --show-current should show feature/slice-X-name-phaseN

After completing work:
1. git add -A && git commit -m "feat(slice-X): description"
2. git push origin feature/slice-X-name-phaseN

DO NOT:
- Change to other directories
- Switch branches (you're already on the correct one)
- Commit to master
```

### Integration Process

After all agents complete their slice work:

1. **Create PRs** - Each slice branch creates a PR to master
2. **Review** - Review each PR for conflicts with other slices
3. **Merge order** - Merge in dependency order:
   - Slice 1 (Auth) first - provides auth middleware
   - Slice 2 (Tools) second - pull master, resolve conflicts if any
   - Slice 3 (Reservations) third - pull master, resolve conflicts if any
4. **Cleanup worktrees**:
   ```bash
   cd C:/source/tool-share
   git worktree remove ../tool-share-slice-1
   git worktree remove ../tool-share-slice-2
   git worktree remove ../tool-share-slice-3
   ```

### Why Worktrees Are Required

| Approach | True Parallelism | Risk |
|----------|------------------|------|
| Same branch | ❌ No | Agents overwrite each other |
| Different branches, same directory | ❌ No | `git checkout` overwrites directory |
| Different branches, different worktrees | ✅ Yes | Fully isolated |

### Lessons Learned

> **Phase 1 (2026-01-18):** Agents worked on same branch in same directory.
> Result: Interleaved commits, effectively serial execution.

> **Phases 2-3 (2026-01-18):** Created separate branches but not worktrees.
> Agents instructed to `git checkout` their branch in same directory.
> Result: Effectively serial execution—each checkout wiped previous work.

> **Going Forward:** Always use worktrees for parallel agent development.
> Each agent gets its own directory with its branch pre-checked-out.

## Related

- [GitHub Issues](https://github.com/ACTO-LLC/tool-share/issues)
- [Functional Specification](../../../functional-spec.md)
- ADR-004: Data API Builder (shared infrastructure)
