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

---

*Last updated: 2026-01-18*
