# Left Off Here - Authentication Setup

**Date:** 2026-01-19
**Branch:** master
**Status:** Authentication Working

## What Was Done

### 1. Microsoft Entra External ID Setup (Replaces Azure AD B2C)
Azure AD B2C is deprecated as of May 2025. We migrated to Microsoft Entra External ID.

**Tenant Created:**
- Domain: `toolshare.onmicrosoft.com`
- Auth Domain: `toolshare.ciamlogin.com`
- Tenant GUID: `bcf802e0-bcbf-4c6b-84df-72538573a5c3`

**App Registrations:**
| App | Client ID |
|-----|-----------|
| ToolShare-SPA-dev | `be16e8ac-0fcb-48d0-b12b-4cce071f54af` |
| ToolShare-API-dev | `82ea9ac5-0639-4493-a8ec-1c6a6bb7b992` |

**User Flow Created:**
- Name: "Tool Share Sign Up Sign In"
- ID: `15cf2636-54f6-43f0-8874-15917eced477`

### 2. Authentication Fixes (2026-01-19)

**JWKS URI Fix:**
Microsoft Entra External ID uses a different JWKS endpoint format than Azure AD B2C:
- Old (B2C): `https://{tenantName}.b2clogin.com/{tenantName}.onmicrosoft.com/{policy}/discovery/v2.0/keys`
- New (CIAM): `https://{tenantGUID}.ciamlogin.com/{tenantGUID}/discovery/v2.0/keys`

Key insight: The tenant GUID must be used as the subdomain, not the tenant name.

**Files Updated:**
- `TS.API/src/middleware/auth.ts` - Fixed JWKS URI format for Entra External ID
- `TS.API/src/config/env.ts` - Added `AZURE_AD_TENANT_GUID` config
- `TS.API/.env` - Added tenant GUID configuration
- `TS.DataAPI/dab-config.json` - Fixed issuer format for Entra External ID
- `docker-compose.yml` - Added `AZURE_AD_TENANT_GUID` environment variable

**Issuer Format (Entra External ID):**
```
https://{tenantGUID}.ciamlogin.com/{tenantGUID}/v2.0
```

### 3. Scripts Created

| Script | Purpose |
|--------|---------|
| `iac/create-external-tenant.ps1` | Creates External ID tenant via Azure REST API |
| `iac/setup-entra-external-id.ps1` | Creates app registrations (SPA + API) |
| `iac/setup-user-flow.ps1` | Creates sign-up/sign-in user flow |
| `iac/setup-auth-complete.ps1` | Master script that runs all of the above |

### 4. Mock Auth System
Created a mock authentication system for local development without Entra:
- `TS.UI/src/auth/MockAuthProvider.tsx`
- `TS.UI/src/auth/AuthProvider.tsx`
- `TS.UI/src/auth/useAuth.ts`
- Set `VITE_MOCK_AUTH=true` in `.env.local` to use

### 5. Dev Environment Scripts
- `start-dev.ps1` / `start-dev.sh` - Start all services
- `.vscode/launch.json` - Debug configurations
- `.vscode/tasks.json` - VS Code tasks

## Current State

**Authentication is working.** The app successfully:
1. Redirects to Entra External ID login page
2. Handles OAuth callback
3. Validates JWT tokens in the API
4. Passes authenticated requests to DAB (Data API Builder)

**Tested Endpoints:**
- `GET /api/circles` - Returns authenticated user's circles (empty if none)
- `GET /api/tools/my/tools` - Returns authenticated user's tools (empty if none)

## Running the App

```powershell
# Start all services
.\start-dev.ps1

# Or start individually:
docker-compose up -d          # Docker services (SQL, DAB, Azurite)
cd TS.UI && npm run dev       # UI on http://localhost:5175
cd TS.API && npm run dev      # API on http://localhost:3000
```

## Environment Configuration

**TS.API/.env:**
```
AZURE_AD_B2C_TENANT_ID=toolshare
AZURE_AD_B2C_CLIENT_ID=82ea9ac5-0639-4493-a8ec-1c6a6bb7b992
AZURE_AD_AUTH_DOMAIN=toolshare.ciamlogin.com
AZURE_AD_TENANT_GUID=bcf802e0-bcbf-4c6b-84df-72538573a5c3
```

## For Future Environments

To set up authentication for a new environment:

```powershell
.\iac\setup-auth-complete.ps1 `
    -TenantSubdomain "myapp" `
    -DisplayName "My App" `
    -ResourceGroupName "rg-myapp-auth" `
    -Environment "prod"
```

Then complete the manual step to link the app to the user flow:
1. Go to https://entra.microsoft.com
2. Switch to the new tenant
3. Navigate to **Identity** → **External Identities** → **User flows**
4. Click the user flow
5. Click **Applications** → **+ Add application**
6. Select the SPA app → Click **Select**
