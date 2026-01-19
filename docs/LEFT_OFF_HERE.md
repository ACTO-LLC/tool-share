# Left Off Here - Authentication Setup

**Date:** 2026-01-18
**Branch:** master

## What Was Done

### 1. Microsoft Entra External ID Setup (Replaces Azure AD B2C)
Azure AD B2C is deprecated as of May 2025. We migrated to Microsoft Entra External ID.

**Tenant Created:**
- Domain: `toolshare.onmicrosoft.com`
- Auth Domain: `toolshare.ciamlogin.com`
- Tenant ID: `bcf802e0-bcbf-4c6b-84df-72538573a5c3`

**App Registrations:**
| App | Client ID |
|-----|-----------|
| ToolShare-SPA-dev | `be16e8ac-0fcb-48d0-b12b-4cce071f54af` |
| ToolShare-API-dev | `82ea9ac5-0639-4493-a8ec-1c6a6bb7b992` |

**User Flow Created:**
- Name: "Tool Share Sign Up Sign In"
- ID: `15cf2636-54f6-43f0-8874-15917eced477`

### 2. Scripts Created

| Script | Purpose |
|--------|---------|
| `iac/create-external-tenant.ps1` | Creates External ID tenant via Azure REST API |
| `iac/setup-entra-external-id.ps1` | Creates app registrations (SPA + API) |
| `iac/setup-user-flow.ps1` | Creates sign-up/sign-in user flow |
| `iac/setup-auth-complete.ps1` | Master script that runs all of the above |

### 3. Mock Auth System
Created a mock authentication system for local development without Entra:
- `TS.UI/src/auth/MockAuthProvider.tsx`
- `TS.UI/src/auth/AuthProvider.tsx`
- `TS.UI/src/auth/useAuth.ts`
- Set `VITE_MOCK_AUTH=true` in `.env.local` to use

### 4. Dev Environment Scripts
- `start-dev.ps1` / `start-dev.sh` - Start all services
- `.vscode/launch.json` - Debug configurations
- `.vscode/tasks.json` - VS Code tasks

### 5. Files Updated
- `TS.UI/src/main.tsx` - Uses new AuthProvider
- `TS.UI/src/App.tsx` - Uses useAuth hook
- `TS.UI/src/components/Layout.tsx` - Uses useAuth hook
- `TS.UI/src/pages/Login.tsx` - Uses useAuth hook
- `TS.UI/src/pages/Profile.tsx` - Uses useAuth hook
- `TS.UI/src/services/api.ts` - Supports mock auth tokens
- `TS.UI/src/config/auth.ts` - Updated for Entra External ID
- `TS.UI/.env.example` - Updated with Entra config
- `TS.UI/.env.local` - Configured with real credentials

## What's Left To Do

### REQUIRED: Link App to User Flow (Manual Step)
The Graph API doesn't support this operation when authenticated with an AAD guest account.

**Steps:**
1. Go to https://entra.microsoft.com
2. Switch to **toolshare** tenant (top-right dropdown)
3. Navigate to **Identity** → **External Identities** → **User flows**
4. Click "**Tool Share Sign Up Sign In**"
5. Click **Applications** in the left menu
6. Click **+ Add application**
7. Select **ToolShare-SPA-dev** → Click **Select**

### Then Test Sign-In
1. Restart Vite: `cd TS.UI && npm run dev`
2. Go to http://localhost:5173
3. Click "Sign In"
4. Should redirect to Entra login page
5. Create account or sign in

## GitHub Issues Updated
- Issue #6: Updated to "Microsoft Entra External ID Setup" (was Azure AD B2C)

## Running the App

```powershell
# Start all services
.\start-dev.ps1

# Or start individually:
docker-compose up -d          # Docker services (SQL, DAB, Azurite)
cd TS.UI && npm run dev       # UI on http://localhost:5173
cd TS.API && npm run dev      # API on http://localhost:3000
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

Then complete the manual step to link the app to the user flow.
