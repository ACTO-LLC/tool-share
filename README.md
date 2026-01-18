# Tool Share

A web application that enables friends and community members to share tools they own and are willing to loan out.

## Project Overview

Tool Share is a subscription-based platform for peer-to-peer tool lending within trusted circles. Users can list tools, browse availability, make reservations, and document tool condition with before/after photos.

### Key Features

- **Tool Catalog** - List tools with photos, auto-populate details via barcode lookup
- **Sharing Circles** - Create invite-only groups to share tools with friends
- **Reservation System** - Calendar-based booking with FullCalendar, prevents double-booking
- **Condition Tracking** - Before/after photos document tool condition for each loan
- **Search** - Find tools by name, category, or barcode
- **Ratings & Reviews** - Build trust through community feedback

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + MUI v6 |
| Calendar | FullCalendar v6 |
| Backend | Node.js + Express + TypeScript + TSOA |
| Data Access | Azure Data API Builder (GraphQL) |
| Database | Azure SQL (Serverless) |
| Auth | Azure AD B2C |
| Storage | Azure Blob Storage |
| Payments | Stripe |
| Tool Lookup | UPCitemdb API |
| Hosting | Azure App Service |

## Prerequisites

- Node.js 20.x or later
- Yarn 1.22.x or later
- Azure CLI
- Docker Desktop (for local development)
- Git

## Project Structure

```
tool-share/
├── TS.UI/                   # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API service layer
│   │   ├── graphql/         # GraphQL queries
│   │   └── types/           # TypeScript types
│   └── package.json
├── TS.API/                  # Node.js backend (Express/TSOA)
│   ├── src/
│   │   ├── routes/          # TSOA route controllers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── types/           # TypeScript types
│   └── package.json
├── TS.DataAPI/              # Data API Builder config
│   └── dab-config.json
├── database/                # SQL scripts, migrations
├── iac/                     # Infrastructure as Code (Bicep)
├── .github/                 # GitHub configuration
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
└── docs/                    # Documentation
    ├── functional-spec.md
    └── architecture/
        └── adrs/            # Architecture Decision Records
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ACTO-LLC/tool-share.git
cd tool-share
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cp .env.template .env.local
```

Required environment variables:
- `AZURE_AD_B2C_TENANT_ID`
- `AZURE_AD_B2C_CLIENT_ID`
- `DATABASE_CONNECTION_STRING`
- `BLOB_STORAGE_CONNECTION_STRING`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `UPCITEMDB_API_KEY` (optional, for paid tier)

### 3. Install Dependencies

```bash
# Install frontend dependencies
cd TS.UI && yarn install

# Install backend dependencies
cd ../TS.API && yarn install
```

### 4. Start Local Development

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individually:
cd TS.UI && yarn dev      # Frontend on http://localhost:5173
cd TS.API && yarn dev     # Backend on http://localhost:3000
```

### 5. Run Tests

```bash
# Frontend tests
cd TS.UI && yarn test

# Backend tests
cd TS.API && yarn test

# E2E tests
cd TS.UI && yarn test:e2e
```

## Development Workflow

This project follows the [ACTO Delivery Playbook](docs/architecture/adrs/). Key practices:

1. **Branch naming**: `feature/[issue-number]-description` or `bugfix/[issue-number]-description`
2. **Commits**: Use [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)
3. **Pull Requests**: All changes require PR review before merge
4. **Testing**: Maintain 80%+ coverage on critical paths

## Documentation

- [Functional Specification](docs/functional-spec.md) - Complete feature requirements
- [Architecture Decision Records](docs/architecture/adrs/) - Key technical decisions
- [API Documentation](http://localhost:3000/api-docs) - Swagger UI (when running locally)

## Deployment

Deployments are managed via GitHub Actions:

- **Development**: Auto-deploy on merge to `main`
- **UAT**: Manual trigger after dev verification
- **Production**: Manual trigger after UAT sign-off

See [deployment runbook](docs/deployment-runbook.md) for details.

## Contributing

1. Create an issue describing the change
2. Create a feature branch from `main`
3. Make changes with conventional commits
4. Submit PR with completed checklist
5. Address review feedback
6. Merge after approval

## Support

- **Issues**: [GitHub Issues](https://github.com/ACTO-LLC/tool-share/issues)
- **Documentation**: [/docs](docs/)

## License

Proprietary - ACTO LLC
