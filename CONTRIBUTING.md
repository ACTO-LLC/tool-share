# Contributing to Tool Share

Thank you for your interest in contributing to Tool Share! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Getting Help](#getting-help)

## Code of Conduct

By participating in this project, you agree to maintain a welcoming, inclusive, and harassment-free environment. Be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/tool-share.git
   cd tool-share
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ACTO-LLC/tool-share.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Azure account (for authentication testing)

### Installation

1. **Install dependencies** for each project:
   ```bash
   cd TS.API && npm install
   cd ../TS.UI && npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Copy example env files
   cp TS.API/.env.example TS.API/.env
   cp TS.UI/.env.example TS.UI/.env
   ```

3. **Start the development environment**:
   ```bash
   docker-compose up -d
   ```

4. **Run the applications**:
   ```bash
   # Terminal 1 - API
   cd TS.API && npm run dev

   # Terminal 2 - UI
   cd TS.UI && npm run dev
   ```

See [docs/DEVELOPMENT_PLAYBOOK.md](docs/DEVELOPMENT_PLAYBOOK.md) for detailed setup instructions.

## Making Changes

### Branch Naming

Create a branch from `master` with a descriptive name:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-tool-categories` |
| Bug fix | `fix/description` | `fix/login-redirect-loop` |
| Documentation | `docs/description` | `docs/api-authentication` |
| Refactor | `refactor/description` | `refactor/simplify-auth-flow` |

```bash
git checkout master
git pull upstream master
git checkout -b feature/your-feature-name
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes:** `auth`, `tools`, `reservations`, `ui`, `api`, `db`

**Examples:**
```
feat(tools): add category filter to tool search
fix(auth): handle expired token refresh correctly
docs(api): document reservation endpoints
```

## Pull Request Process

1. **Ensure your branch is up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

2. **Run tests and linting**:
   ```bash
   cd TS.API && npm test && npm run lint
   cd TS.UI && npm test && npm run lint
   ```

3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** with:
   - Clear title following commit message format
   - Description of what changes were made and why
   - Screenshots for UI changes
   - Link to related issues (use `Fixes #123` to auto-close)

5. **Address review feedback** by pushing additional commits

6. **Requirements for merge**:
   - At least 1 approving review
   - All status checks passing
   - All conversations resolved
   - Branch up to date with master

## Coding Standards

### TypeScript

- Strict mode enabled - no `any` types without justification
- Use interfaces for data shapes, types for unions
- Export types from dedicated `types/` directories

### API (Express/TSOA)

- Controllers in `src/controllers/`
- Business logic in `src/services/`
- Use TSOA decorators for OpenAPI generation
- Follow REST conventions for endpoints

### React/UI

- Functional components with hooks
- MUI components for consistency
- Pages in `src/pages/`, reusable components in `src/components/`
- Use React Query for server state management

### General

- Keep functions small and focused
- Write self-documenting code; add comments only when logic isn't obvious
- Don't over-engineer - solve the current problem, not hypothetical future ones

## Testing

### Running Tests

```bash
# API unit/integration tests
cd TS.API && npm test

# UI component tests
cd TS.UI && npm test

# E2E tests (requires running services)
cd TS.UI && npm run test:e2e
```

### Test Requirements

- API: Unit tests for services, integration tests for controllers
- UI: Component tests for complex components
- E2E: Tests for critical user flows
- All new features should include relevant tests

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/ACTO-LLC/tool-share/discussions)
- **Found a bug?** Open an [Issue](https://github.com/ACTO-LLC/tool-share/issues)
- **Security issues?** Email security concerns privately (do not open public issues)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Tool Share!
