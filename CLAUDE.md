# Claude Code Project Guide

## Project Overview
Tool Share is a tool lending application with:
- **TS.UI**: React frontend (Vite, MUI, TypeScript)
- **TS.API**: Express backend (TSOA, TypeScript)
- **TS.Database**: SQL Server database with DAB (Data API Builder) for GraphQL

## Development Setup
- UI runs on port 5173 (`npm run dev` in TS.UI)
- API runs on port 3000 (`npm run dev` in TS.API)
- DAB runs on port 5001 (provides GraphQL interface to database)

## Lessons Learned

### 1. DAB GraphQL Type Mismatch (UUID vs ID)
**Date**: 2026-01-26

**Problem**: API calls to DAB were failing with 400 errors. The error message was:
```
"The variable `id` is not compatible with the type of the current location."
"variableType":"ID!","locationType":"UUID!"
```

**Root Cause**: DAB (Data API Builder) generates GraphQL schemas that use `UUID!` type for primary key columns, not the generic GraphQL `ID!` type. The dabService.ts was using `$id: ID!` in all mutations and queries.

**Fix**: Changed all GraphQL variable declarations from `$id: ID!` to `$id: UUID!` in `TS.API/src/services/dabService.ts`.

**Prevention**: When writing GraphQL queries/mutations for DAB:
- Use `UUID!` for ALL UUID/GUID columns (primary keys AND foreign keys), not `ID!` or `String!`
- The same applies to filter variables - if filtering by a UUID column, use `UUID!`
- Check DAB's generated schema at http://localhost:5001/graphql (GraphQL Playground) to verify expected types
- **Always test new DAB queries manually with curl before assuming they work**

### 2. Error Messages Hidden in Production
**Date**: 2026-01-26

**Problem**: 500 errors returned generic "Internal Server Error" without the actual error message, making debugging difficult.

**Root Cause**: The error handler in `app.ts` intentionally hid error details for security, but this made debugging impossible.

**Fix**: Updated error handler to:
- Return actual error message in development mode
- Recognize business logic errors and return them as 400 with meaningful messages
- Log full stack traces for debugging

**Prevention**: Always ensure error responses include enough detail for debugging in development environments.

## Testing Requirements

### MANDATORY: All features must have 100% test coverage before creating a PR

1. **Write tests first or alongside code** - Never create a PR without tests
2. **Run tests and verify they pass** - Don't assume tests work; run them
3. **Test the actual user workflow** - E2E tests should complete full user flows, not just open dialogs
4. **Fix failing tests before committing** - A PR with failing tests is incomplete

### Unit Tests
- Located in `TS.API/src/__tests__/`
- Run with `npm test` in TS.API
- Tests mock the DAB service, so they don't catch DAB integration issues

### E2E Tests
- Located in `TS.UI/e2e/`
- Run with `npx playwright test` in TS.UI
- Requires all services running (UI, API, DAB)
- Uses mock authentication with `test-user-1` (John Doe)

### Before Creating a PR
1. Run all unit tests: `cd TS.API && npm test`
2. Run all E2E tests: `cd TS.UI && npx playwright test`
3. Manually verify the feature works in the browser
4. Ensure no regressions in existing functionality

## Key Files
- `TS.API/src/services/dabService.ts` - All DAB/GraphQL interactions
- `TS.API/src/routes/reservationsController.ts` - Reservation workflow endpoints
- `TS.API/src/middleware/auth.ts` - Authentication middleware
- `TS.API/src/app.ts` - Express app setup and error handling
- `TS.Database/Scripts/PostDeployment/SeedData.sql` - Test data

## Seed Data Users
| Internal ID | External ID | Name | Role |
|-------------|-------------|------|------|
| 11111111-1111-1111-1111-111111111111 | test-user-1 | John Doe | Tool owner |
| 66666666-6666-6666-6666-666666666666 | test-user-2 | Jane Smith | Borrower |
| 77777777-7777-7777-7777-777777777777 | test-user-3 | Mike Wilson | Member |
