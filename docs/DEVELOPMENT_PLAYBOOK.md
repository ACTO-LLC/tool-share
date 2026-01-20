# Development Playbook

This playbook documents operational procedures for developing the Tool Share application, particularly when using AI agents for parallel development.

## Table of Contents
- [Parallel Agent Development](#parallel-agent-development)
- [Git Workflow](#git-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Parallel Agent Development with Git Worktrees

### Overview

We use 3 AI agents working **truly concurrently** on vertical feature slices. To achieve true parallelism, each agent must work in its own **git worktree** (separate directory).

| Agent | Slice | Worktree Path | Branch |
|-------|-------|---------------|--------|
| Agent 1 | User & Auth | `../tool-share-slice-1` | `feature/slice-1-auth` |
| Agent 2 | Tools & Search | `../tool-share-slice-2` | `feature/slice-2-tools` |
| Agent 3 | Reservations | `../tool-share-slice-3` | `feature/slice-3-reservations` |

See [ADR-010](./architecture/adrs/ADR-010-feature-slice-development.md) for the full rationale.

### Why Worktrees Are Required

Without worktrees, all agents share the same working directory:
- `git checkout` overwrites the entire directory
- Agents cannot write files concurrently
- Work is effectively serialized, not parallelized
- Risk of agents overwriting each other's changes

### Pre-Launch Checklist

Before launching parallel agents:

- [ ] **Create git worktrees** for each slice (not just branches!)
- [ ] **Push branches to remote** so agents can work independently
- [ ] **Install dependencies** in each worktree
- [ ] **Verify worktree paths** are correct
- [ ] **Document the current state** - what's already implemented

```bash
# Setup script for parallel agent work with worktrees
cd C:/source/tool-share
git checkout master && git pull origin master

# Create worktrees (creates both directory and branch)
git worktree add ../tool-share-slice-1 -b feature/slice-1-auth-phase4
git worktree add ../tool-share-slice-2 -b feature/slice-2-tools-phase4
git worktree add ../tool-share-slice-3 -b feature/slice-3-reservations-phase4

# Push branches to remote
git push -u origin feature/slice-1-auth-phase4
git push -u origin feature/slice-2-tools-phase4
git push -u origin feature/slice-3-reservations-phase4

# Install dependencies in each worktree
cd ../tool-share-slice-1/TS.UI && npm install
cd ../tool-share-slice-1/TS.API && npm install
# ... repeat for slice-2 and slice-3

# Verify setup
git worktree list
```

### Agent Launch Template (Worktree Version)

When launching an agent, specify the worktree path:

```markdown
## Working Directory (MANDATORY)
You are working in: `C:/source/tool-share-slice-X`
This is a git worktree already on branch: `feature/slice-X-name-phaseN`

Before making changes:
1. Verify location: `pwd` (must show C:/source/tool-share-slice-X)
2. Verify branch: `git branch --show-current`

After completing work:
1. Stage changes: `git add -A`
2. Commit: `git commit -m "feat(slice-X): description"`
3. Push: `git push origin feature/slice-X-name-phaseN`

NEVER change to other worktree directories.
NEVER switch branches—you're already on the correct branch.
NEVER commit directly to master.
```

### Post-Completion Workflow

After all agents complete:

1. **Review each branch** (from main repo or any worktree)
   ```bash
   cd C:/source/tool-share  # Main repo
   git fetch --all
   git log master..feature/slice-1-auth-phaseN --oneline
   git diff master..feature/slice-1-auth-phaseN --stat
   ```

2. **Create Pull Requests**
   ```bash
   gh pr create --base master --head feature/slice-1-auth-phaseN --title "feat: Slice 1 - User & Auth"
   gh pr create --base master --head feature/slice-2-tools-phaseN --title "feat: Slice 2 - Tools & Search"
   gh pr create --base master --head feature/slice-3-reservations-phaseN --title "feat: Slice 3 - Reservations"
   ```

3. **Merge in dependency order**
   - Slice 1 first (provides auth middleware others depend on)
   - Slice 2 second (may need to pull master after Slice 1 merges)
   - Slice 3 third (may need to pull master after Slice 2 merges)

4. **Clean up worktrees and branches**
   ```bash
   cd C:/source/tool-share  # Return to main repo

   # Remove worktrees first
   git worktree remove ../tool-share-slice-1
   git worktree remove ../tool-share-slice-2
   git worktree remove ../tool-share-slice-3

   # Delete remote branches
   git push origin --delete feature/slice-1-auth-phaseN
   git push origin --delete feature/slice-2-tools-phaseN
   git push origin --delete feature/slice-3-reservations-phaseN

   # Delete local branch references
   git branch -d feature/slice-1-auth-phaseN feature/slice-2-tools-phaseN feature/slice-3-reservations-phaseN
   ```

### Troubleshooting

#### Agents worked in same directory (without worktrees)
If agents ran in the same directory without worktrees:
1. Work was likely serialized (not parallel)
2. Check `git log` to see if commits are sequential
3. For future work: Always use worktrees for true parallelism

#### Merge conflicts between slices
1. Identify conflicting files: `git diff feature/slice-1-auth..feature/slice-2-tools`
2. In later slice's worktree, merge master: `git fetch origin && git merge origin/master`
3. Resolve conflicts, commit, push
4. Common conflicts: `App.tsx` routes, `package.json` dependencies, `api.ts` exports

---

## Git Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature slice | `feature/slice-N-name` | `feature/slice-1-auth` |
| Bug fix | `fix/issue-description` | `fix/login-redirect` |
| Hotfix | `hotfix/description` | `hotfix/security-patch` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Scopes: `auth`, `tools`, `reservations`, `ui`, `api`, `db`

Examples:
```
feat(auth): add JWT validation middleware
fix(tools): handle missing photo gracefully
docs(api): update OpenAPI spec for reservations
```

### Pull Request Process

1. Create PR with description following template
2. Ensure CI passes
3. Request review if working with team
4. Squash merge to master
5. Delete feature branch

---

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types without justification
- Use interfaces for data shapes, types for unions
- Export types from dedicated `types/` directories

### API (Express/TSOA)

- Controllers in `src/controllers/`
- Business logic in `src/services/`
- Use TSOA decorators for OpenAPI generation
- Standard response format:
  ```typescript
  interface ApiResponse<T> {
    data?: T;
    error?: { code: string; message: string };
    meta?: { page?: number; total?: number };
  }
  ```

### React/UI

- Functional components with hooks
- MUI components for consistency
- Pages in `src/pages/`, reusable components in `src/components/`
- Use React Query for server state

---

## Testing

### Running Tests

```bash
# API tests
cd TS.API && npm test

# UI tests
cd TS.UI && npm test

# E2E tests (with mock auth)
cd TS.UI && npm run test:e2e

# E2E tests (with real service principal auth)
cd TS.UI && npm run test:e2e:auth  # Acquire token first
cd TS.UI && npm run test:e2e       # Run tests
```

### Test Requirements

- API: Unit tests for services, integration tests for controllers
- UI: Component tests for complex components
- E2E: Critical user flows (login, create tool, make reservation)

### E2E Testing with Service Principal Authentication

For automated E2E testing in CI/CD or local development, we use a **service principal with client credentials flow** to acquire tokens, which are mapped to a test user in the API.

#### Prerequisites

1. **Service Principal** configured in Azure AD with client secret
2. **Test User** exists in the database with known `externalId`
3. **API configured** with E2E test user mapping enabled

#### Setup Steps

1. **Configure API environment** (`TS.API/.env`):
   ```env
   E2E_TEST_USER_MAPPING_ENABLED=true
   E2E_TEST_USER_ID=test-user-1        # User's externalId, NOT database ID
   E2E_TEST_USER_EMAIL=test@example.com
   E2E_TEST_USER_NAME=Test User
   E2E_SERVICE_PRINCIPAL_CLIENT_ID=<your-app-client-id>
   ```

2. **Acquire E2E token**:
   ```bash
   cd TS.UI
   npm run test:e2e:auth
   ```
   This creates `.env.e2e.local` with the access token.

3. **Run E2E tests**:
   ```bash
   npm run test:e2e
   ```

#### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Playwright     │────>│   TS.API         │────>│   DAB           │
│  + Vite         │     │   (Auth Middleware)│     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │ Bearer Token           │ App-only token detected
        │ (Service Principal)    │ Maps to test user
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Azure AD       │     │  Test User       │
│  (token issuer) │     │  (in database)   │
└─────────────────┘     └──────────────────┘
```

1. **Token acquisition**: Service principal gets app-only token via client credentials
2. **Frontend bypass**: MockAuthProvider auto-logs in when E2E token present
3. **API mapping**: Auth middleware detects app-only tokens and maps to test user
4. **Database access**: All queries run as the test user

#### Security Notes

- E2E mapping **only works** when `E2E_TEST_USER_MAPPING_ENABLED=true`
- Only tokens from the configured service principal are accepted
- **Never enable in production**

See [E2E_AUTH_SETUP.md](./E2E_AUTH_SETUP.md) for complete documentation.

---

## Deployment

### Local Development

```bash
# Start all services
docker-compose up -d

# Create blob storage container (required for photo uploads)
cd TS.API && node -e "
const { BlobServiceClient } = require('@azure/storage-blob');
const cs = 'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
BlobServiceClient.fromConnectionString(cs).getContainerClient('tool-photos').createIfNotExists({access:'blob'}).then(r => console.log('Container:', r.succeeded ? 'created' : 'exists'));
"

# Start the applications
cd TS.API && npm run dev
cd TS.UI && npm run dev
```

**Important:** The blob container must exist before photo uploads will work. If you get 500 errors on photo uploads, run the container creation script above.

### Environment Variables

See `.env.example` in each project directory.

Required for local development:
- `DATABASE_CONNECTION_STRING`
- `AZURE_AD_B2C_TENANT_NAME`
- `AZURE_AD_B2C_CLIENT_ID`
- `AZURE_STORAGE_CONNECTION_STRING`

---

## Lessons Learned

### 2026-01-18: Phase 1 - Agents on Same Branch

**Problem:** Launched 3 agents to work on slices without creating separate branches. All agents modified files on master simultaneously.

**Impact:** Potential merge conflicts and interleaved changes that are hard to attribute.

**Solution:** Always create and push feature branches BEFORE launching agents. Include explicit branch checkout instructions in every agent prompt.

**Prevention:** Added to this playbook and ADR-010.

### 2026-01-18: Phases 2-3 - Branches Without Worktrees

**Problem:** Created separate branches but had all agents working in the same directory. Agents were instructed to `git checkout` to their branch, but this overwrites the working directory.

**Impact:** Agents could not truly run in parallel. Each branch checkout wiped out the previous agent's in-progress work. Development was effectively serial, not parallel.

**Root Cause:** Misunderstanding of git's working directory model. A git repository can only have one branch checked out at a time in a single working directory.

**Solution:** Use **git worktrees** to create separate directories for each branch:
```bash
git worktree add ../project-slice-1 -b feature/slice-1
git worktree add ../project-slice-2 -b feature/slice-2
git worktree add ../project-slice-3 -b feature/slice-3
```

**Key Insight:** Worktrees give each agent its own isolated directory. Each worktree has the complete repository with its branch already checked out. Agents work in parallel without any file conflicts.

**Prevention:** Updated this playbook and ADR-010 with mandatory worktree setup. Updated strategy-planning playbook for all future projects.

### 2026-01-18: Batching Tests After Features = Slow

**Problem:** Wrote all features in Phases 1-3 without tests, then tried to add tests afterward with 3 parallel agents. Took 55+ minutes.

**Impact:**
- Agents had to configure Jest from scratch (not done during scaffolding)
- Agents had to create missing hooks (`useNotifications`, `useCircles`) that should have existed
- Agents hit dependency compatibility issues (date-fns v3 vs MUI)
- Agents had huge scope (all tests for all features) instead of focused tasks

**Root Cause:** Tests were not written WITH features. Test infrastructure was not configured during scaffolding.

**Solution:**
1. Configure test infrastructure during project scaffolding (Jest, Vitest, Playwright)
2. Every feature PR must include its tests
3. Agent prompts must specify: "Create X feature AND its tests"

**Example agent prompt (correct):**
```markdown
Create NotificationBell component:
1. NotificationBell.tsx - displays unread count badge
2. NotificationBell.test.tsx - tests rendering and click behavior
3. useNotifications.ts hook if needed + its test

Tests must pass before committing.
```

**Prevention:** Added "Testing Requirements" section to strategy-planning playbook. Tests are now a deliverable for every feature, not a separate phase.

### 2026-01-18: Missing Reusable Hooks

**Problem:** Test agent had to CREATE `useCircles.ts` and `useNotifications.ts` hooks that should have existed from Phase 2-3 development.

**Impact:**
- Duplicated API call logic in multiple components
- Test agent spent time creating hooks instead of just testing
- Inconsistent data fetching patterns across components

**Root Cause:** Feature agents embedded API calls directly in components instead of creating reusable hooks.

**Solution:** Agent prompts must require hook creation:

```markdown
Create Circle Management feature:
1. useCircles.ts hook - list, create, join, leave circles
2. CirclesList.tsx - uses useCircles hook
3. Tests for both hook and component
```

**Pattern to enforce:**
- API calls → Custom hook (useX.ts)
- Component → Uses hook, never calls API directly
- Tests → Test hook with mocked API, test component with mocked hook

### 2026-01-20: 20-Minute Debugging Rule

**Problem:** Spent extended time debugging an auth/DAB integration issue. AI context filled with debugging attempts, making it harder to see the solution clearly.

**Impact:**
- Context window filled with trial-and-error debugging logs
- Hard to maintain clear picture of what was tried
- Repeated similar approaches without fresh perspective

**Solution:** If debugging takes longer than 20 minutes without resolution:

1. **Document findings** - Create a GitHub issue with:
   - What works (green checkmarks)
   - What fails (specific errors)
   - Configuration details
   - Code changes attempted
   - Logs and error messages

2. **Clear context** - Start fresh conversation with:
   - Link to the GitHub issue
   - Clean slate for new approaches

3. **Issue Template:**
   ```markdown
   ## Summary
   [One-line description of the problem]

   ## What Works
   - ✅ [Working component 1]
   - ✅ [Working component 2]

   ## What Fails
   - ❌ [Failing component with specific error]

   ## Logs
   [Relevant error messages and debug output]

   ## Attempted Fixes
   1. [Fix 1 - result]
   2. [Fix 2 - result]

   ## Next Steps to Investigate
   1. [Suggested approach 1]
   2. [Suggested approach 2]
   ```

**Prevention:** Set a mental timer. After 20 minutes of debugging:
- Stop
- Document
- Create issue
- Start fresh

**Example:** Issue #56 - Auth token validates correctly but DAB returns 400. Documented all working auth config and specific failure point for fresh investigation.

### 2026-01-20: Azurite SDK Version Mismatch

**Problem:** Photo uploads failing with 500 errors. API logs showed Azure Storage SDK requesting API version not supported by Azurite.

**Error:**
```
The API version 2026-02-06 is not supported by Azurite.
```

**Root Cause:** The `@azure/storage-blob` npm package was newer than the Azurite Docker image supported.

**Solution:**
1. Add `--skipApiVersionCheck` flag to Azurite in `docker-compose.yml`:
   ```yaml
   command: azurite --blobHost 0.0.0.0 --queueHost 0.0.0.0 --tableHost 0.0.0.0 --skipApiVersionCheck
   ```
2. Restart Azurite: `docker-compose up -d azurite`
3. Create the blob container (see Local Development section)

**Prevention:**
- Always include `--skipApiVersionCheck` in Azurite config for local dev
- Add container creation to setup scripts
- Document blob storage setup requirements

---

*Last updated: 2026-01-20*
