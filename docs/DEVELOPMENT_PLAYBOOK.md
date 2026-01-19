# Development Playbook

This playbook documents operational procedures for developing the Tool Share application, particularly when using AI agents for parallel development.

## Table of Contents
- [Parallel Agent Development](#parallel-agent-development)
- [Git Workflow](#git-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Parallel Agent Development

### Overview

We use 3 AI agents working concurrently on vertical feature slices:

| Agent | Slice | Scope |
|-------|-------|-------|
| Agent 1 | User & Auth | Authentication, profiles, circles |
| Agent 2 | Tools & Search | Tool CRUD, photos, search, browsing |
| Agent 3 | Reservations | Booking, loan lifecycle, dashboard |

See [ADR-010](./architecture/adrs/ADR-010-feature-slice-development.md) for the full rationale.

### Pre-Launch Checklist

Before launching parallel agents:

- [ ] **Create feature branches** for each slice
- [ ] **Push branches to remote** so agents can work independently
- [ ] **Verify master is clean** - no uncommitted changes
- [ ] **Document the current state** - what's already implemented

```bash
# Setup script for parallel agent work
git checkout master && git pull origin master

# Create and push slice branches
for slice in slice-1-auth slice-2-tools slice-3-reservations; do
  git checkout master
  git checkout -b feature/$slice
  git push -u origin feature/$slice
done

git checkout master
```

### Agent Launch Template

When launching an agent, ALWAYS include branch instructions:

```markdown
## Git Instructions (MANDATORY)
Before making ANY code changes:
1. Switch to your branch: `git checkout feature/slice-X-name`
2. Verify branch: `git branch --show-current` (must show feature/slice-X-name)
3. Pull latest: `git pull origin feature/slice-X-name`

After completing work:
1. Stage changes: `git add -A`
2. Commit: `git commit -m "feat(slice-X): description"`
3. Push: `git push origin feature/slice-X-name`

NEVER commit directly to master.
```

### Post-Completion Workflow

After all agents complete:

1. **Review each branch**
   ```bash
   git log master..feature/slice-1-auth --oneline
   git diff master..feature/slice-1-auth --stat
   ```

2. **Create Pull Requests**
   ```bash
   gh pr create --base master --head feature/slice-1-auth --title "feat: Slice 1 - User & Auth"
   gh pr create --base master --head feature/slice-2-tools --title "feat: Slice 2 - Tools & Search"
   gh pr create --base master --head feature/slice-3-reservations --title "feat: Slice 3 - Reservations"
   ```

3. **Merge in dependency order**
   - Slice 1 first (provides auth middleware others depend on)
   - Slice 2 second
   - Slice 3 third

4. **Clean up branches**
   ```bash
   git branch -d feature/slice-1-auth feature/slice-2-tools feature/slice-3-reservations
   git push origin --delete feature/slice-1-auth feature/slice-2-tools feature/slice-3-reservations
   ```

### Troubleshooting

#### Agents worked on same branch
If agents accidentally worked on the same branch:
1. Review `git log` to see interleaved commits
2. Use `git cherry-pick` to extract commits to correct branches
3. Or: consolidate as single "Phase X" commit if changes are compatible

#### Merge conflicts between slices
1. Identify conflicting files: `git diff feature/slice-1-auth..feature/slice-2-tools`
2. Resolve in the later slice's PR
3. Common conflicts: `App.tsx` routes, `package.json` dependencies

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

# E2E tests
cd TS.UI && npm run test:e2e
```

### Test Requirements

- API: Unit tests for services, integration tests for controllers
- UI: Component tests for complex components
- E2E: Critical user flows (login, create tool, make reservation)

---

## Deployment

### Local Development

```bash
# Start all services
docker-compose up -d

# Or individually:
cd TS.API && npm run dev
cd TS.UI && npm run dev
cd TS.DataAPI && dab start
```

### Environment Variables

See `.env.example` in each project directory.

Required for local development:
- `DATABASE_CONNECTION_STRING`
- `AZURE_AD_B2C_TENANT_NAME`
- `AZURE_AD_B2C_CLIENT_ID`
- `AZURE_STORAGE_CONNECTION_STRING`

---

## Lessons Learned

### 2026-01-18: Parallel Agent Branch Isolation

**Problem:** Launched 3 agents to work on slices without creating separate branches. All agents modified files on master simultaneously.

**Impact:** Potential merge conflicts and interleaved changes that are hard to attribute.

**Solution:** Always create and push feature branches BEFORE launching agents. Include explicit branch checkout instructions in every agent prompt.

**Prevention:** Added to this playbook and ADR-010.

---

*Last updated: 2026-01-18*
