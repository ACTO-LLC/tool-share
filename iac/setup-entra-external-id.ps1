<#
.SYNOPSIS
    Sets up Microsoft Entra External ID for Tool Share authentication.

.DESCRIPTION
    This script creates the necessary app registrations for Tool Share using
    Microsoft Entra External ID (replacement for Azure AD B2C).

    Prerequisites:
    - An Entra External ID tenant must already exist
      (Create via Microsoft Entra admin center or VS Code extension)
    - Azure CLI installed and logged in to the external tenant
    - Admin access to the tenant

.PARAMETER TenantSubdomain
    The External ID tenant subdomain (e.g., 'toolshare' for toolshare.onmicrosoft.com)

.PARAMETER Environment
    The target environment (dev, uat, prod)

.EXAMPLE
    .\setup-entra-external-id.ps1 -TenantSubdomain toolshare -Environment dev

.NOTES
    After running this script, you must:
    1. Create a user flow in Microsoft Entra admin center
    2. Associate the app registration with the user flow

    See: https://learn.microsoft.com/en-us/entra/external-id/customers/
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$TenantSubdomain,

    [Parameter(Mandatory = $false)]
    [ValidateSet('dev', 'uat', 'prod')]
    [string]$Environment = 'dev'
)

$ErrorActionPreference = 'Stop'

# Configuration based on environment
$config = @{
    dev = @{
        spaRedirectUris = @(
            'http://localhost:5173',
            'http://localhost:5173/auth/callback'
        )
        apiRedirectUris = @(
            'http://localhost:3000'
        )
    }
    uat = @{
        spaRedirectUris = @(
            'https://app-toolshare-ui-uat.azurewebsites.net',
            'https://app-toolshare-ui-uat.azurewebsites.net/auth/callback'
        )
        apiRedirectUris = @(
            'https://app-toolshare-api-uat.azurewebsites.net'
        )
    }
    prod = @{
        spaRedirectUris = @(
            'https://app-toolshare-ui-prod.azurewebsites.net',
            'https://app-toolshare-ui-prod.azurewebsites.net/auth/callback'
        )
        apiRedirectUris = @(
            'https://app-toolshare-api-prod.azurewebsites.net'
        )
    }
}

$tenantDomain = "$TenantSubdomain.onmicrosoft.com"
# Entra External ID uses ciamlogin.com instead of b2clogin.com
$authDomain = "$TenantSubdomain.ciamlogin.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Microsoft Entra External ID Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tenant: $tenantDomain" -ForegroundColor Yellow
Write-Host "Auth Domain: $authDomain" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

# Check if logged in
Write-Host "Checking Azure CLI login..." -ForegroundColor Gray
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in to Azure CLI. Please run:" -ForegroundColor Red
    Write-Host "  az login --tenant $tenantDomain --allow-no-subscriptions" -ForegroundColor Yellow
    exit 1
}

Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Verify we're in the correct tenant
if ($account.tenantId -and $account.homeTenantId) {
    Write-Host "Current tenant: $($account.tenantId)" -ForegroundColor Gray
}

# ============================================================================
# Create SPA App Registration (React UI)
# ============================================================================
Write-Host ""
Write-Host "[1/3] Creating SPA App Registration..." -ForegroundColor Yellow

$spaAppName = "ToolShare-SPA-$Environment"

# Check if app already exists
$existingSpa = az ad app list --display-name $spaAppName --query "[0]" 2>$null | ConvertFrom-Json
if ($existingSpa) {
    Write-Host "  App '$spaAppName' already exists. Using existing..." -ForegroundColor Gray
    $spaClientId = $existingSpa.appId
} else {
    # Create new SPA app registration
    $spaApp = az ad app create `
        --display-name $spaAppName `
        --sign-in-audience AzureADandPersonalMicrosoftAccount `
        --enable-id-token-issuance true `
        --enable-access-token-issuance true `
        --web-redirect-uris $config[$Environment].spaRedirectUris `
        2>$null | ConvertFrom-Json

    if (-not $spaApp) {
        Write-Host "  Failed to create SPA app. Trying alternative method..." -ForegroundColor Yellow
        # Try with SPA redirect URIs instead of web
        $spaApp = az ad app create `
            --display-name $spaAppName `
            --sign-in-audience AzureADMyOrg `
            --enable-id-token-issuance true `
            2>$null | ConvertFrom-Json
    }

    $spaClientId = $spaApp.appId
    Write-Host "  Created SPA app with Client ID: $spaClientId" -ForegroundColor Green

    # Add SPA platform configuration
    Write-Host "  Configuring SPA redirect URIs..." -ForegroundColor Gray
    $redirectUriJson = $config[$Environment].spaRedirectUris | ConvertTo-Json -Compress
    az ad app update --id $spaClientId --spa-redirect-uris $config[$Environment].spaRedirectUris 2>$null
}

# ============================================================================
# Create API App Registration (Express API)
# ============================================================================
Write-Host ""
Write-Host "[2/3] Creating API App Registration..." -ForegroundColor Yellow

$apiAppName = "ToolShare-API-$Environment"

$existingApi = az ad app list --display-name $apiAppName --query "[0]" 2>$null | ConvertFrom-Json
if ($existingApi) {
    Write-Host "  App '$apiAppName' already exists. Using existing..." -ForegroundColor Gray
    $apiClientId = $existingApi.appId
} else {
    # Create API app
    $apiApp = az ad app create `
        --display-name $apiAppName `
        --sign-in-audience AzureADMyOrg `
        2>$null | ConvertFrom-Json

    $apiClientId = $apiApp.appId
    Write-Host "  Created API app with Client ID: $apiClientId" -ForegroundColor Green
}

# Set up API scope
$scopeId = [guid]::NewGuid().ToString()
$apiScope = "api://$apiClientId/access_as_user"

Write-Host "  API Scope: $apiScope" -ForegroundColor Gray

# ============================================================================
# Output configuration
# ============================================================================
Write-Host ""
Write-Host "[3/3] Setup Complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Entra External ID Configuration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Add these to your environment files:" -ForegroundColor Cyan
Write-Host ""
Write-Host "# TS.UI/.env.local" -ForegroundColor Gray
Write-Host "VITE_MOCK_AUTH=false"
Write-Host "VITE_AZURE_AD_B2C_CLIENT_ID=$spaClientId"
Write-Host "VITE_AZURE_AD_B2C_AUTHORITY=https://$authDomain/$tenantDomain"
Write-Host "VITE_AZURE_AD_B2C_KNOWN_AUTHORITY=$authDomain"
Write-Host "VITE_REDIRECT_URI=http://localhost:5173"
Write-Host "VITE_API_SCOPE=$apiScope"
Write-Host ""
Write-Host "# TS.API/.env" -ForegroundColor Gray
Write-Host "AZURE_AD_TENANT_NAME=$TenantSubdomain"
Write-Host "AZURE_AD_CLIENT_ID=$apiClientId"
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create an External ID tenant (if not done):" -ForegroundColor White
Write-Host "   - Go to: https://entra.microsoft.com" -ForegroundColor Gray
Write-Host "   - Select 'External Identities' > 'Overview'" -ForegroundColor Gray
Write-Host "   - Click 'Create external tenant'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Create a User Flow:" -ForegroundColor White
Write-Host "   - In Microsoft Entra admin center" -ForegroundColor Gray
Write-Host "   - Go to: External Identities > User flows" -ForegroundColor Gray
Write-Host "   - Create 'Sign up and sign in' flow" -ForegroundColor Gray
Write-Host "   - Add app registration to the user flow" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Copy the values above to your .env files" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  https://learn.microsoft.com/en-us/entra/external-id/customers/" -ForegroundColor Gray
Write-Host ""

# Save config to file for reference
$configOutput = @{
    tenantSubdomain = $TenantSubdomain
    tenantDomain = $tenantDomain
    authDomain = $authDomain
    environment = $Environment
    spa = @{
        clientId = $spaClientId
        redirectUris = $config[$Environment].spaRedirectUris
    }
    api = @{
        clientId = $apiClientId
        scope = $apiScope
    }
    authority = "https://$authDomain/$tenantDomain"
}

$configPath = Join-Path $PSScriptRoot "entra-config-$Environment.json"
$configOutput | ConvertTo-Json -Depth 10 | Out-File $configPath -Encoding utf8

Write-Host "Configuration saved to: $configPath" -ForegroundColor Gray
