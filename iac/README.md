# Infrastructure as Code (Bicep)

This directory contains Bicep templates for deploying Tool Share infrastructure to Azure.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Resource Group                               │
│                   (rg-toolshare-{env})                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   App Svc    │  │   App Svc    │  │   App Svc    │          │
│  │   (UI)       │  │   (API)      │  │   (DAB)      │          │
│  │   React      │  │   Node.js    │  │   v1.7 RC    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
│         │                 │                  │                  │
│         │                 │                  ▼                  │
│         │                 │          ┌──────────────┐          │
│         │                 │          │  Azure SQL   │          │
│         │                 │          │ (Serverless) │          │
│         │                 │          └──────────────┘          │
│         │                 │                                     │
│         │                 ▼                                     │
│         │          ┌──────────────┐  ┌──────────────┐          │
│         │          │    Blob      │  │ App Insights │          │
│         │          │   Storage    │  │              │          │
│         │          └──────────────┘  └──────────────┘          │
│         │                                                       │
│  ┌──────┴───────────────────────────────────────────┐          │
│  │              App Service Plan (B1/S1)             │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

External:
  - Azure AD B2C (separate tenant)
  - Stripe (external service)
```

## Resources Deployed

| Resource | SKU | Purpose |
|----------|-----|---------|
| App Service Plan | B1 (dev) / S1 (prod) | Hosts all web apps |
| App Service (UI) | - | React frontend |
| App Service (API) | - | Node.js backend |
| App Service (DAB) | Container | Data API Builder v1.7 |
| Azure SQL | Serverless Gen5 | Database |
| Storage Account | Standard LRS | Blob storage for images |
| Log Analytics | Per-GB | Logs and metrics |
| Application Insights | - | APM and monitoring |

## Estimated Costs

### Development Environment
| Resource | Est. Monthly Cost |
|----------|-------------------|
| App Service Plan (B1) | $13 |
| Azure SQL (Serverless) | $5-15 |
| Storage (10 GB) | $1-2 |
| App Insights | $0-5 |
| **Total** | **~$20-35/month** |

### Production Environment
| Resource | Est. Monthly Cost |
|----------|-------------------|
| App Service Plan (S1) | $70 |
| Azure SQL (Serverless) | $15-40 |
| Storage (10 GB) | $1-2 |
| App Insights | $5-10 |
| **Total** | **~$90-120/month** |

## Prerequisites

1. Azure CLI installed and logged in
2. Subscription with Contributor access
3. Azure AD B2C tenant (optional, can configure later)

## Deployment

### Using PowerShell (Windows)

```powershell
# Preview deployment (What-If)
.\deploy.ps1 -Environment dev -SqlAdminLogin sqladmin -WhatIf

# Deploy
.\deploy.ps1 -Environment dev -SqlAdminLogin sqladmin
```

### Using Bash (Linux/macOS)

```bash
# Make script executable
chmod +x deploy.sh

# Preview deployment
./deploy.sh -e dev -u sqladmin -w

# Deploy
./deploy.sh -e dev -u sqladmin
```

### Using Azure CLI directly

```bash
az deployment sub create \
  --name toolshare-dev \
  --location westus2 \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam \
  --parameters sqlAdminLogin=sqladmin \
  --parameters sqlAdminPassword=YourSecurePassword123!
```

## Post-Deployment Steps

1. **Run Database Schema**
   ```bash
   # Connect to Azure SQL and run schema.sql
   sqlcmd -S sql-toolshare-dev.database.windows.net -d sqldb-toolshare-dev \
     -U sqladmin -P 'YourPassword' -i ../database/schema.sql
   ```

2. **Configure Azure AD B2C**
   - Create B2C tenant if not exists
   - Register application
   - Create user flows
   - Update app settings with tenant details

3. **Upload DAB Configuration**
   ```bash
   # Deploy dab-config.json to DAB App Service
   az webapp deploy --resource-group rg-toolshare-dev \
     --name app-toolshare-dab-dev \
     --src-path ../TS.DataAPI/dab-config.json \
     --target-path /App/dab-config.json
   ```

4. **Deploy Application Code**
   - Push to main branch to trigger GitHub Actions
   - Or manually deploy using `az webapp deploy`

## Module Reference

| Module | Description |
|--------|-------------|
| `modules/log-analytics.bicep` | Log Analytics workspace |
| `modules/app-insights.bicep` | Application Insights |
| `modules/storage-account.bicep` | Storage account with containers |
| `modules/sql-server.bicep` | SQL Server and serverless database |
| `modules/app-service-plan.bicep` | App Service Plan |
| `modules/app-service.bicep` | App Service for Node.js apps |
| `modules/app-service-dab.bicep` | App Service for DAB container |

## Naming Convention

Resources follow the pattern: `{resource-type}-{project}-{environment}`

Examples:
- `rg-toolshare-dev` - Resource Group
- `sql-toolshare-dev` - SQL Server
- `app-toolshare-api-dev` - API App Service
- `sttoolsharedev` - Storage Account (no hyphens allowed)

## Security Notes

- SQL admin credentials should be stored in Key Vault for production
- Stripe keys should be stored in Key Vault
- Blob storage is private (no public access)
- All traffic over HTTPS
- TLS 1.2 minimum enforced
