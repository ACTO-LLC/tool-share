#!/bin/bash
# Tool Share Infrastructure Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
LOCATION="westus2"
WHAT_IF=false

# Usage
usage() {
    echo "Usage: $0 -e <environment> -u <sql-admin-login> [-l <location>] [-w]"
    echo ""
    echo "Options:"
    echo "  -e    Environment (dev, uat, prod) [required]"
    echo "  -u    SQL Admin Login [required]"
    echo "  -p    SQL Admin Password (will prompt if not provided)"
    echo "  -l    Azure location (default: westus2)"
    echo "  -b    Azure AD B2C tenant name"
    echo "  -c    Azure AD B2C client ID"
    echo "  -w    What-If mode (preview only)"
    echo ""
    exit 1
}

# Parse arguments
while getopts "e:u:p:l:b:c:w" opt; do
    case $opt in
        e) ENVIRONMENT="$OPTARG" ;;
        u) SQL_ADMIN_LOGIN="$OPTARG" ;;
        p) SQL_ADMIN_PASSWORD="$OPTARG" ;;
        l) LOCATION="$OPTARG" ;;
        b) B2C_TENANT_NAME="$OPTARG" ;;
        c) B2C_CLIENT_ID="$OPTARG" ;;
        w) WHAT_IF=true ;;
        *) usage ;;
    esac
done

# Validate required parameters
if [ -z "$ENVIRONMENT" ] || [ -z "$SQL_ADMIN_LOGIN" ]; then
    usage
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    echo -e "${RED}Invalid environment. Must be dev, uat, or prod.${NC}"
    exit 1
fi

# Prompt for password if not provided
if [ -z "$SQL_ADMIN_PASSWORD" ]; then
    echo -n "Enter SQL Admin Password: "
    read -s SQL_ADMIN_PASSWORD
    echo ""
fi

echo -e "${CYAN}========================================"
echo "Tool Share Infrastructure Deployment"
echo -e "========================================${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Location: $LOCATION${NC}"
echo ""

# Check Azure CLI login
echo -e "Checking Azure CLI login..."
ACCOUNT=$(az account show 2>/dev/null || true)
if [ -z "$ACCOUNT" ]; then
    echo -e "${RED}Not logged in to Azure CLI. Please run 'az login' first.${NC}"
    exit 1
fi
echo -e "${GREEN}Logged in as: $(echo $ACCOUNT | jq -r '.user.name')${NC}"
echo -e "${GREEN}Subscription: $(echo $ACCOUNT | jq -r '.name')${NC}"
echo ""

# Set paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="$SCRIPT_DIR/main.bicep"
PARAMETER_FILE="$SCRIPT_DIR/parameters/$ENVIRONMENT.bicepparam"
DEPLOYMENT_NAME="toolshare-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"

echo "Deployment Name: $DEPLOYMENT_NAME"
echo "Template: $TEMPLATE_FILE"
echo "Parameters: $PARAMETER_FILE"
echo ""

# Build deployment command
DEPLOY_CMD="az deployment sub create \
    --name $DEPLOYMENT_NAME \
    --location $LOCATION \
    --template-file $TEMPLATE_FILE \
    --parameters $PARAMETER_FILE \
    --parameters sqlAdminLogin=$SQL_ADMIN_LOGIN \
    --parameters sqlAdminPassword=$SQL_ADMIN_PASSWORD"

if [ -n "$B2C_TENANT_NAME" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --parameters b2cTenantName=$B2C_TENANT_NAME"
fi

if [ -n "$B2C_CLIENT_ID" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --parameters b2cClientId=$B2C_CLIENT_ID"
fi

if [ "$WHAT_IF" = true ]; then
    DEPLOY_CMD="$DEPLOY_CMD --what-if"
    echo -e "${YELLOW}Running What-If analysis...${NC}"
else
    echo -e "${YELLOW}Starting deployment...${NC}"
fi

# Execute deployment
eval $DEPLOY_CMD

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

if [ "$WHAT_IF" = false ]; then
    echo ""
    echo -e "${GREEN}========================================"
    echo "Deployment completed successfully!"
    echo -e "========================================${NC}"
    echo ""

    # Get outputs
    echo "Fetching deployment outputs..."
    OUTPUTS=$(az deployment sub show --name $DEPLOYMENT_NAME --query properties.outputs)

    echo ""
    echo -e "${CYAN}Resources Created:${NC}"
    echo "  Resource Group: $(echo $OUTPUTS | jq -r '.resourceGroupName.value')"
    echo "  SQL Server: $(echo $OUTPUTS | jq -r '.sqlServerFqdn.value')"
    echo "  Database: $(echo $OUTPUTS | jq -r '.sqlDatabaseName.value')"
    echo "  Storage: $(echo $OUTPUTS | jq -r '.storageAccountName.value')"
    echo ""
    echo -e "${CYAN}Application URLs:${NC}"
    echo "  UI: $(echo $OUTPUTS | jq -r '.uiAppUrl.value')"
    echo "  API: $(echo $OUTPUTS | jq -r '.apiAppUrl.value')"
    echo "  DAB: $(echo $OUTPUTS | jq -r '.dabAppUrl.value')"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Run database schema: Connect to SQL Server and run database/schema.sql"
    echo "  2. Configure Azure AD B2C tenant and update app settings"
    echo "  3. Deploy application code via GitHub Actions"
fi
