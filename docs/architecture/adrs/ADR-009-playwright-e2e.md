# ADR-009: Playwright for E2E Testing

## Status
Accepted

## Context
We need end-to-end testing to verify that our UI components work correctly together and that user flows function as expected. We considered Cypress and Playwright as the primary options.

## Decision
We will use **Playwright** for E2E testing.

## Rationale

### Why Playwright over Cypress
1. **Multi-browser support out of the box** - Chromium, Firefox, and WebKit (Safari) without additional plugins
2. **Better parallel execution** - Native parallel test execution with better resource management
3. **Mobile emulation** - Built-in device emulation for responsive testing
4. **Auto-wait** - Intelligent waiting for elements reduces flaky tests
5. **Modern architecture** - Direct browser automation via DevTools Protocol
6. **Trace viewer** - Excellent debugging with step-by-step traces
7. **CI-friendly** - Works well in headless mode with minimal configuration

### Trade-offs
- Cypress has a larger community and more tutorials available
- Cypress's time-travel debugging UI is more intuitive for newcomers
- We accept these trade-offs for Playwright's technical advantages

## Implementation

### Configuration
- Config file: `TS.UI/playwright.config.ts`
- Test directory: `TS.UI/e2e/`
- Uses Vite dev server locally, preview server in CI

### Test Scripts
```bash
npm run test:e2e          # Run all tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:headed   # Run with visible browser
npm run test:e2e:debug    # Debug mode
```

### CI Integration
- E2E tests run after build in GitHub Actions
- Only Chromium in CI to reduce execution time
- Playwright report uploaded as artifact

### Test Patterns
- Page Object Model for reusable page interactions
- Mock data for consistent test state
- Separate spec files per feature/page

### Authentication for E2E Tests

E2E tests require authenticated API access. We support two modes:

#### 1. Mock Auth (Default)
- Frontend uses `MockAuthProvider` when `VITE_MOCK_AUTH=true`
- No real tokens, uses mock user data
- Fast, no external dependencies
- Good for UI-only testing

#### 2. Service Principal Auth (Recommended for Full E2E)
- Uses Azure AD service principal with client credentials
- Real tokens mapped to test user in API
- Tests actual auth flow and API authorization
- Required for CI/CD with real database

**Setup:**
```bash
# 1. Acquire token (stored in .env.e2e.local)
npm run test:e2e:auth

# 2. Run tests
npm run test:e2e
```

**Configuration:**
- `TS.UI/.env.e2e` - Sets `VITE_E2E_TEST=true` and `VITE_MOCK_AUTH=true`
- `TS.UI/.env.e2e.local` - Contains `VITE_E2E_ACCESS_TOKEN` (gitignored)
- `TS.API/.env` - Configures `E2E_TEST_USER_MAPPING_ENABLED=true`

See [E2E_AUTH_SETUP.md](../../E2E_AUTH_SETUP.md) for complete setup guide.

## Consequences

### Positive
- Reliable cross-browser testing
- Fast parallel execution
- Good developer experience with UI mode
- Built-in screenshot and trace on failure

### Negative
- Team needs to learn Playwright-specific APIs
- Slightly more complex setup than Cypress
- Requires browser binaries in CI

## References
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
