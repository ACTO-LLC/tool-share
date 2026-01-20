# E2E Testing Authentication Setup

This document describes the E2E (end-to-end) testing authentication infrastructure that allows automated Playwright tests to run with real authentication against the API.

## Overview

The E2E authentication system uses a **service principal with client credentials flow** to acquire tokens, which are then **mapped to a test user** in the API. This approach:

- **Secure**: Requires valid Azure AD service principal credentials
- **Automatable**: No manual browser login needed
- **CI/CD friendly**: Can run in pipelines with stored credentials
- **Tests real code paths**: Exercises actual API endpoints with proper user context

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Playwright     │────>│   TS.API         │────>│   DAB           │
│  (E2E Tests)    │     │   (Auth Middleware)│     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │ Bearer Token           │ App-only token detected
        │ (from Service          │ Maps to test user
        │  Principal)            │ (E2E_TEST_USER_ID)
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Azure AD       │     │  Test User       │
│  (token issuer) │     │  (in database)   │
└─────────────────┘     └──────────────────┘
```

## Setup Steps

### 1. Service Principal Configuration

The service principal is already configured with:
- **App ID (Client ID)**: `82ea9ac5-0639-4493-a8ec-1c6a6bb7b992`
- **Tenant ID**: `bcf802e0-bcbf-4c6b-84df-72538573a5c3`
- **Client Secret**: Stored in `TS.UI/scripts/get-e2e-token.cjs`

### 2. Test User Setup

A test user exists in the database:
- **Database ID**: `11111111-1111-1111-1111-111111111111`
- **External ID**: `test-user-1`
- **Email**: `test@example.com`
- **Display Name**: `Test User`

### 3. API Environment Configuration

Add these variables to `TS.API/.env`:

```env
# E2E Testing - App-to-User Mapping
E2E_TEST_USER_MAPPING_ENABLED=true
E2E_TEST_USER_ID=test-user-1
E2E_TEST_USER_EMAIL=test@example.com
E2E_TEST_USER_NAME=Test User
E2E_SERVICE_PRINCIPAL_CLIENT_ID=82ea9ac5-0639-4493-a8ec-1c6a6bb7b992
```

**Important**: `E2E_TEST_USER_ID` must be the user's `externalId` (Azure AD object ID), not the database primary key.

### 4. UI Environment Configuration

The UI uses `.env.e2e` for E2E test mode:

```env
VITE_E2E_TEST=true
VITE_API_URL=http://localhost:3000
# Token is loaded from .env.e2e.local
```

Tokens are stored in `.env.e2e.local` (gitignored).

## Running E2E Tests

### 1. Acquire Token

```bash
cd TS.UI
npm run test:e2e:auth
```

This runs `scripts/get-e2e-token.cjs` which:
1. Uses MSAL client credentials flow to get a token
2. Writes the token to `.env.e2e.local`

### 2. Run Tests

```bash
npm run test:e2e
```

The Playwright config loads `.env.e2e.local` via dotenv, making the token available as `VITE_E2E_ACCESS_TOKEN`.

## How It Works

### Token Acquisition (get-e2e-token.cjs)

```javascript
const { ConfidentialClientApplication } = require('@azure/msal-node');

const config = {
  auth: {
    clientId: '82ea9ac5-0639-4493-a8ec-1c6a6bb7b992',
    authority: 'https://login.microsoftonline.com/bcf802e0-bcbf-4c6b-84df-72538573a5c3',
    clientSecret: process.env.E2E_CLIENT_SECRET || '<stored-secret>',
  },
};

const tokenRequest = {
  scopes: ['api://82ea9ac5-0639-4493-a8ec-1c6a6bb7b992/.default'],
};

const cca = new ConfidentialClientApplication(config);
const response = await cca.acquireTokenByClientCredential(tokenRequest);
// Token is written to .env.e2e.local
```

### Auth Middleware (TS.API/src/middleware/auth.ts)

The auth middleware detects app-only tokens and maps them to the test user:

```typescript
// Check if this is an app-only token (client credentials flow)
function isAppOnlyToken(claims: AzureB2CTokenClaims): boolean {
  const azpEqualsAud = claims.azp === claims.aud;
  const oidEqualsSub = claims.oid === claims.sub;
  const noEmail = !claims.email && (!claims.emails || claims.emails.length === 0);
  const noName = !claims.name && !claims.given_name && !claims.family_name;
  return azpEqualsAud && oidEqualsSub && noEmail && noName;
}

// In expressAuthentication:
if (isAppOnlyToken(decoded) && config.E2E_TEST_USER_MAPPING_ENABLED === 'true') {
  // Verify token is from allowed service principal
  if (allowedClientId && tokenClientId !== allowedClientId) {
    throw new Error('App-only token not authorized');
  }

  // Return test user context
  return {
    id: config.E2E_TEST_USER_ID,  // 'test-user-1'
    email: config.E2E_TEST_USER_EMAIL,
    name: config.E2E_TEST_USER_NAME,
  };
}
```

### Token Verification

App-only tokens use a different issuer than user tokens:
- **User tokens**: `https://{tenant}.ciamlogin.com/{tenant}/v2.0`
- **App-only tokens**: `https://login.microsoftonline.com/{tenant}/v2.0`

The middleware automatically detects the issuer and uses the appropriate JWKS endpoint for verification.

## Security Considerations

1. **Environment-gated**: The mapping only works when `E2E_TEST_USER_MAPPING_ENABLED=true`
2. **Client ID validation**: Only tokens from the configured service principal are accepted
3. **Token verification**: App-only tokens are fully verified against Azure AD's JWKS
4. **No production use**: Never enable this in production environments

## Troubleshooting

### Token expired
Re-run `npm run test:e2e:auth` to get a fresh token.

### "Internal Server Error" when testing
- Ensure the API server was restarted after changing `.env`
- Verify `E2E_TEST_USER_ID` matches the user's `externalId` in the database
- Check that the test user exists in the database

### JWKS key fetch error
The token's signing key couldn't be fetched. Check:
- Network connectivity to login.microsoftonline.com
- Correct tenant GUID in configuration

### Token verification failed
- Verify the client ID matches between token and config
- Check that the token hasn't expired
- Ensure the correct JWKS endpoint is being used

## Files

| File | Purpose |
|------|---------|
| `TS.UI/scripts/get-e2e-token.cjs` | Token acquisition script |
| `TS.UI/.env.e2e` | E2E environment config |
| `TS.UI/.env.e2e.local` | Token storage (gitignored) |
| `TS.UI/playwright.config.ts` | Loads .env.e2e.local |
| `TS.API/src/middleware/auth.ts` | App-to-user mapping logic |
| `TS.API/src/config/env.ts` | E2E config variables |
| `TS.API/.env` | API environment with E2E settings |
