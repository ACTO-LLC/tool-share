# Lessons Learned

## Microsoft Entra External ID Authentication (2026-01-19)

### The Problem
After migrating from Azure AD B2C to Microsoft Entra External ID (CIAM), JWT token validation was failing with 401 errors when fetching signing keys from the JWKS endpoint.

### Root Cause
Microsoft Entra External ID uses **tenant GUID** as the subdomain in its endpoints, not the tenant name. This is different from Azure AD B2C.

### Key Insight
When using `ciamlogin.com` (Entra External ID / CIAM), all endpoints must use the **tenant GUID** as the subdomain:

| Endpoint Type | Incorrect | Correct |
|--------------|-----------|---------|
| JWKS | `https://toolshare.ciamlogin.com/...` | `https://{tenantGUID}.ciamlogin.com/...` |
| Issuer | `https://toolshare.ciamlogin.com/...` | `https://{tenantGUID}.ciamlogin.com/...` |
| Authority | `https://toolshare.ciamlogin.com/...` | `https://{tenantGUID}.ciamlogin.com/...` |

### Correct Endpoint Formats

**JWKS URI:**
```
https://{tenantGUID}.ciamlogin.com/{tenantGUID}/discovery/v2.0/keys
```

**Token Issuer:**
```
https://{tenantGUID}.ciamlogin.com/{tenantGUID}/v2.0
```

**OpenID Configuration:**
```
https://{tenantGUID}.ciamlogin.com/{tenantGUID}/v2.0/.well-known/openid-configuration
```

### What Threw Us Off

1. **Microsoft documentation** often shows `{tenantName}.ciamlogin.com` in examples, but the actual production endpoints use the GUID
2. **The tenant name works for browser redirects** but NOT for backend API calls to fetch JWKS keys
3. **Error messages were misleading** - "401 Unauthorized" from the JWKS endpoint didn't clearly indicate it was a URL format issue

### Debugging Tips

1. **Check the OpenID configuration** - Fetch `/.well-known/openid-configuration` to see the exact `jwks_uri` the identity provider expects
2. **Decode the JWT** - Check the `iss` (issuer) claim to see what format the token actually uses
3. **Test JWKS directly** - Use curl to verify the JWKS endpoint returns keys:
   ```bash
   curl https://{tenantGUID}.ciamlogin.com/{tenantGUID}/discovery/v2.0/keys
   ```

### Configuration Checklist

When setting up Entra External ID authentication:

- [ ] Get the **tenant GUID** (not just the tenant name)
- [ ] Use tenant GUID in JWKS URI
- [ ] Use tenant GUID in issuer validation
- [ ] Use tenant GUID in DAB/backend auth configuration
- [ ] Use tenant GUID in docker-compose environment variables
- [ ] Test with a real token (not just decoded - actually verify signature)

### Environment Variables Needed

```env
# The friendly tenant name (for reference)
AZURE_AD_B2C_TENANT_ID=toolshare

# The API app registration client ID
AZURE_AD_B2C_CLIENT_ID=82ea9ac5-0639-4493-a8ec-1c6a6bb7b992

# The auth domain (ciamlogin.com for Entra External ID)
AZURE_AD_AUTH_DOMAIN=toolshare.ciamlogin.com

# CRITICAL: The tenant GUID - required for JWKS and issuer URLs
AZURE_AD_TENANT_GUID=bcf802e0-bcbf-4c6b-84df-72538573a5c3
```

### Code Pattern

```typescript
// Correct JWKS client setup for Entra External ID
function getJwksClient(): jwksClient.JwksClient {
  const tenantGuid = config.AZURE_AD_TENANT_GUID;
  const authDomain = config.AZURE_AD_AUTH_DOMAIN;

  let jwksUri: string;
  if (authDomain?.includes('ciamlogin.com') && tenantGuid) {
    // Entra External ID - use tenant GUID as subdomain
    jwksUri = `https://${tenantGuid}.ciamlogin.com/${tenantGuid}/discovery/v2.0/keys`;
  } else {
    // Legacy Azure AD B2C format
    jwksUri = `https://${tenantName}.b2clogin.com/...`;
  }

  return jwksClient({ jwksUri, cache: true });
}
```

### Related Files

- `TS.API/src/middleware/auth.ts` - JWT validation middleware
- `TS.API/src/config/env.ts` - Environment configuration
- `TS.DataAPI/dab-config.json` - Data API Builder auth config
- `docker-compose.yml` - Container environment variables

### References

- [Microsoft Entra External ID Documentation](https://learn.microsoft.com/en-us/entra/external-id/)
- [MSAL.js Configuration for CIAM](https://learn.microsoft.com/en-us/entra/external-id/customers/tutorial-single-page-app-react-sign-in-configure-authentication)

---

## Data API Builder (DAB) and Entra External ID Authentication (2026-01-19)

### The Problem
After successfully validating JWT tokens in TS.API, calls to DAB GraphQL were returning HTTP 400 errors. The API logs showed:
```
[Auth] Token verified successfully for user: 9a42e5d8-a91d-4e20-b29f-51acc2515885
[stderr] Error: Request failed with status code 400
```

DAB logs showed:
```
Error code: AUTH_NOT_AUTHENTICATED
Error message: The current user is not authorized to access this resource.
```

### Root Cause
DAB's `AzureAD` authentication provider does not properly support Entra External ID (CIAM) tokens. Even with correctly configured issuer and audience values, DAB's JWT validation fails with CIAM tokens that use the `ciamlogin.com` domain.

The issue is that DAB's AzureAD provider was designed for standard Azure AD tenants (`login.microsoftonline.com`) and Azure AD B2C (`b2clogin.com`), not for the newer Entra External ID (`ciamlogin.com`).

### Attempted Fixes That Didn't Work

1. **Environment variable substitution** - Using `@env('AZURE_AD_TENANT_GUID')` in dab-config.json worked, but DAB still couldn't validate the token
2. **Hardcoded values** - Hardcoding the issuer and audience directly in dab-config.json didn't help
3. **Simulator provider** - Not supported in DAB 1.7.x

### The Solution
Since DAB is only accessed internally by TS.API (not exposed to browsers), we adopted an **API Gateway authentication pattern**:

1. **Remove authentication from DAB** - Delete the `authentication` section from `dab-config.json`
2. **Use anonymous permissions** - Change all entity permissions from `"role": "authenticated"` to `"role": "anonymous"`
3. **Let TS.API handle all authentication** - TS.API validates all JWT tokens before making DAB requests
4. **Maintain authorization in TS.API** - TS.API verifies ownership/permissions before allowing update/delete operations

### Architecture Pattern
```
Browser → [Auth] → TS.API → [No Auth] → DAB → SQL Server
              ↑                            ↑
         Validates JWT              Trusts TS.API
         Enforces authz            Processes requests
```

This is a valid microservices pattern where:
- The API gateway (TS.API) handles authentication
- Internal services (DAB) trust the gateway
- Authorization is enforced at the API layer

### Trade-offs

**Pros:**
- Works with Entra External ID
- Simpler DAB configuration
- All auth logic in one place (TS.API)

**Cons:**
- Database-level policy enforcement (`@claims.oid`) is lost
- DAB endpoint is "open" (but only accessible internally via Docker network)
- Must ensure TS.API validates ownership before all write operations

### Configuration Changes

**dab-config.json** - Remove authentication:
```json
{
  "runtime": {
    "host": {
      "cors": { ... }
      // No "authentication" section
    }
  },
  "entities": {
    "User": {
      "permissions": [
        {
          "role": "anonymous",  // Changed from "authenticated"
          "actions": [
            { "action": "create" },
            { "action": "read" },
            { "action": "update" }
          ]
        }
      ]
    }
  }
}
```

**dabClient.ts** - Don't pass Authorization header:
```typescript
private async query<T>(query: string, variables?: Record<string, unknown>, _authToken?: string): Promise<T> {
  // Note: DAB runs without authentication - all auth is handled by TS.API
  const headers: Record<string, string> = {};
  // Don't pass Authorization header since DAB doesn't need it
  ...
}
```

### Security Considerations

1. **DAB should not be exposed publicly** - Only TS.API should access DAB (via Docker network)
2. **TS.API must validate ownership** - Before any update/delete, verify the user owns the resource
3. **Network isolation** - DAB port (5001) should only be accessible from TS.API container

### Future Improvements

When DAB adds proper support for Entra External ID (`ciamlogin.com`), consider:
1. Re-enabling DAB authentication
2. Restoring `@claims.oid` policies for database-level enforcement
3. Switching entities back to `"role": "authenticated"`

### Related Files

- `TS.DataAPI/dab-config.json` - DAB configuration with anonymous permissions
- `TS.API/src/services/dabClient.ts` - DAB GraphQL client
- `TS.API/src/middleware/auth.ts` - JWT validation (remains unchanged)
- `TS.API/src/routes/toolsController.ts` - Ownership validation before writes

---

## E2E Testing with Service Principal Authentication (2026-01-20)

### The Problem
Playwright E2E tests needed to authenticate against real API endpoints, but we couldn't use interactive MSAL login in automated tests.

### Solution
Implemented a **service principal with client credentials flow** that gets mapped to a test user in the API.

### Architecture

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

### Key Implementation Details

1. **Token Acquisition** (`TS.UI/scripts/get-e2e-token.cjs`)
   - Uses MSAL `ConfidentialClientApplication` with client credentials
   - Gets app-only token from `login.microsoftonline.com` (not ciamlogin.com)
   - Writes token to `.env.e2e.local`

2. **Frontend Auto-Login** (`TS.UI/src/auth/MockAuthProvider.tsx`)
   - When `VITE_E2E_TEST=true` and `VITE_E2E_ACCESS_TOKEN` exists
   - MockAuthProvider starts with `isAuthenticated = true`
   - Bypasses MSAL login screen

3. **API Token Mapping** (`TS.API/src/middleware/auth.ts`)
   - Detects app-only tokens (azp === aud, oid === sub, no email/name)
   - Uses different JWKS endpoint (`login.microsoftonline.com`)
   - Maps to configured test user when `E2E_TEST_USER_MAPPING_ENABLED=true`

### Important Gotchas

1. **E2E_TEST_USER_ID must be externalId, NOT database ID**
   - Wrong: `E2E_TEST_USER_ID=11111111-1111-1111-1111-111111111111` (database primary key)
   - Right: `E2E_TEST_USER_ID=test-user-1` (user's externalId/Azure AD object ID)

2. **App-only tokens use different issuer**
   - User tokens: `https://{tenant}.ciamlogin.com/{tenant}/v2.0`
   - App tokens: `https://login.microsoftonline.com/{tenant}/v2.0`
   - Auth middleware must handle both

3. **Vite env loading requires fresh server**
   - `.env.e2e.local` changes aren't picked up by running Vite
   - Kill existing Vite servers before running tests
   - Playwright's `reuseExistingServer` can cause stale env issues

4. **Token expiration**
   - Client credentials tokens expire (typically 1 hour)
   - Re-run `npm run test:e2e:auth` to get fresh token

### Configuration Files

| File | Purpose |
|------|---------|
| `TS.UI/scripts/get-e2e-token.cjs` | Token acquisition script |
| `TS.UI/.env.e2e` | E2E mode config (VITE_MOCK_AUTH=true) |
| `TS.UI/.env.e2e.local` | Token storage (gitignored) |
| `TS.API/.env` | E2E mapping config |
| `TS.API/src/middleware/auth.ts` | Token mapping logic |

### Security Notes

- E2E mapping **only works** when explicitly enabled
- Only tokens from configured service principal are accepted
- **Never enable E2E_TEST_USER_MAPPING in production**

### Related Documentation

- [E2E_AUTH_SETUP.md](./E2E_AUTH_SETUP.md) - Complete setup guide
- [ADR-009-playwright-e2e.md](./architecture/adrs/ADR-009-playwright-e2e.md) - E2E testing decision
- [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md) - Testing section
