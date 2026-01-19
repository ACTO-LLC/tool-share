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
