<#
.SYNOPSIS
    Complete Entra External ID setup for Tool Share.

.DESCRIPTION
    This script automates the entire authentication setup:
    1. Creates External ID tenant
    2. Creates app registrations (SPA + API)
    3. Creates user flow
    4. Outputs .env configuration

    NOTE: One manual step is required - linking the app to the user flow
    in the Entra admin center (Graph API limitation with AAD accounts).

.PARAMETER TenantSubdomain
    Subdomain for the tenant (e.g., 'toolshare')

.PARAMETER DisplayName
    Display name for the tenant

.PARAMETER ResourceGroupName
    Azure resource group for the tenant resource

.PARAMETER Environment
    Target environment (dev, uat, prod)

.EXAMPLE
    .\setup-auth-complete.ps1 -TenantSubdomain toolshare -DisplayName "Tool Share" -ResourceGroupName rg-toolshare-auth

.NOTES
    Prerequisites:
    - Azure CLI installed and logged in
    - Tenant Creator role on the subscription
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$TenantSubdomain,

    [Parameter(Mandatory = $true)]
    [string]$DisplayName,

    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $false)]
    [ValidateSet('dev', 'uat', 'prod')]
    [string]$Environment = 'dev',

    [Parameter(Mandatory = $false)]
    [ValidateSet('United States', 'Europe', 'Asia Pacific', 'Australia')]
    [string]$Location = 'United States'
)

$ErrorActionPreference = 'Stop'
$scriptDir = $PSScriptRoot

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Tool Share - Complete Auth Setup                           ║" -ForegroundColor Cyan
Write-Host "║     Microsoft Entra External ID                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Step 1: Create External ID Tenant
# ============================================================================
Write-Host "┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│ Step 1/4: Create External ID Tenant                            │" -ForegroundColor Yellow
Write-Host "└─────────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow

& "$scriptDir\create-external-tenant.ps1" `
    -TenantSubdomain $TenantSubdomain `
    -DisplayName $DisplayName `
    -ResourceGroupName $ResourceGroupName `
    -Location $Location

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create tenant. Exiting." -ForegroundColor Red
    exit 1
}

# Load tenant info
$tenantInfo = Get-Content "$scriptDir\tenant-info.json" | ConvertFrom-Json
$tenantId = $tenantInfo.tenantId

Write-Host ""
Write-Host "Tenant created: $($tenantInfo.domain)" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 2: Login to new tenant
# ============================================================================
Write-Host "┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│ Step 2/4: Login to External ID Tenant                          │" -ForegroundColor Yellow
Write-Host "└─────────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow

Write-Host "Logging in to $($tenantInfo.domain)..." -ForegroundColor Gray
az login --tenant "$($tenantInfo.domain)" --allow-no-subscriptions --use-device-code

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to login to tenant. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "Logged in successfully!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 3: Create App Registrations
# ============================================================================
Write-Host "┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│ Step 3/4: Create App Registrations                             │" -ForegroundColor Yellow
Write-Host "└─────────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow

# Create SPA app
$spaAppName = "ToolShare-SPA-$Environment"
Write-Host "Creating SPA app: $spaAppName" -ForegroundColor Gray

$spaApp = az ad app create `
    --display-name $spaAppName `
    --sign-in-audience AzureADandPersonalMicrosoftAccount `
    --enable-id-token-issuance true `
    --enable-access-token-issuance true `
    | ConvertFrom-Json

$spaClientId = $spaApp.appId
Write-Host "  SPA Client ID: $spaClientId" -ForegroundColor Green

# Configure SPA redirect URIs
$redirectUris = @("http://localhost:5173", "http://localhost:5173/auth/callback")
if ($Environment -eq "uat") {
    $redirectUris += @("https://app-toolshare-ui-uat.azurewebsites.net", "https://app-toolshare-ui-uat.azurewebsites.net/auth/callback")
} elseif ($Environment -eq "prod") {
    $redirectUris += @("https://app-toolshare-ui-prod.azurewebsites.net", "https://app-toolshare-ui-prod.azurewebsites.net/auth/callback")
}

$redirectJson = $redirectUris | ConvertTo-Json -Compress
az rest --method PATCH `
    --url "https://graph.microsoft.com/v1.0/applications(appId='$spaClientId')" `
    --body "{`"spa`":{`"redirectUris`":$redirectJson}}" `
    --headers "Content-Type=application/json" | Out-Null

Write-Host "  Redirect URIs configured" -ForegroundColor Green

# Create API app
$apiAppName = "ToolShare-API-$Environment"
Write-Host "Creating API app: $apiAppName" -ForegroundColor Gray

$apiApp = az ad app create `
    --display-name $apiAppName `
    --sign-in-audience AzureADMyOrg `
    | ConvertFrom-Json

$apiClientId = $apiApp.appId
Write-Host "  API Client ID: $apiClientId" -ForegroundColor Green

# Create service principal for SPA
Write-Host "Creating service principal for SPA..." -ForegroundColor Gray
$spResult = az ad sp create --id $spaClientId 2>$null | ConvertFrom-Json
$spObjectId = $spResult.id
Write-Host "  Service Principal ID: $spObjectId" -ForegroundColor Green

Write-Host ""

# ============================================================================
# Step 4: Create User Flow
# ============================================================================
Write-Host "┌─────────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│ Step 4/4: Create User Flow                                     │" -ForegroundColor Yellow
Write-Host "└─────────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow

$userFlowName = "$DisplayName Sign Up Sign In"
Write-Host "Creating user flow: $userFlowName" -ForegroundColor Gray

$userFlowBody = @{
    "@odata.type" = "#microsoft.graph.externalUsersSelfServiceSignUpEventsFlow"
    displayName = $userFlowName
    onInteractiveAuthFlowStart = @{
        "@odata.type" = "#microsoft.graph.onInteractiveAuthFlowStartExternalUsersSelfServiceSignUp"
        isSignUpAllowed = $true
    }
    onAuthenticationMethodLoadStart = @{
        "@odata.type" = "#microsoft.graph.onAuthenticationMethodLoadStartExternalUsersSelfServiceSignUp"
        identityProviders = @(
            @{ id = "EmailPassword-OAUTH" }
        )
    }
    onAttributeCollection = @{
        "@odata.type" = "#microsoft.graph.onAttributeCollectionExternalUsersSelfServiceSignUp"
        attributes = @(
            @{ id = "email"; displayName = "Email Address"; description = "Email"; userFlowAttributeType = "builtIn"; dataType = "string" }
            @{ id = "displayName"; displayName = "Display Name"; description = "Display Name"; userFlowAttributeType = "builtIn"; dataType = "string" }
        )
        attributeCollectionPage = @{
            views = @(@{
                inputs = @(
                    @{ attribute = "email"; label = "Email"; inputType = "text"; hidden = $true; editable = $false; writeToDirectory = $true; required = $true }
                    @{ attribute = "displayName"; label = "Display Name"; inputType = "text"; hidden = $false; editable = $true; writeToDirectory = $true; required = $true }
                )
            })
        }
    }
} | ConvertTo-Json -Depth 20 -Compress

$tempFile = [System.IO.Path]::GetTempFileName()
$userFlowBody | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

$userFlowResult = az rest --method POST `
    --url "https://graph.microsoft.com/v1.0/identity/authenticationEventsFlows" `
    --body "@$tempFile" `
    --headers "Content-Type=application/json" 2>&1 | ConvertFrom-Json

Remove-Item $tempFile -ErrorAction SilentlyContinue

$userFlowId = $userFlowResult.id
Write-Host "  User Flow ID: $userFlowId" -ForegroundColor Green

Write-Host ""

# ============================================================================
# Save Configuration
# ============================================================================
$authDomain = "$TenantSubdomain.ciamlogin.com"
$tenantDomain = "$TenantSubdomain.onmicrosoft.com"

$config = @{
    tenant = @{
        subdomain = $TenantSubdomain
        domain = $tenantDomain
        authDomain = $authDomain
        tenantId = $tenantId
    }
    spa = @{
        clientId = $spaClientId
        servicePrincipalId = $spObjectId
    }
    api = @{
        clientId = $apiClientId
        scope = "api://$apiClientId/access_as_user"
    }
    userFlow = @{
        id = $userFlowId
        name = $userFlowName
    }
    environment = $Environment
}

$configPath = "$scriptDir\auth-config-$Environment.json"
$config | ConvertTo-Json -Depth 10 | Out-File $configPath -Encoding utf8
Write-Host "Configuration saved to: $configPath" -ForegroundColor Gray

# Generate .env.local content
$envContent = @"
# Microsoft Entra External ID Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Tenant: $tenantDomain

VITE_MOCK_AUTH=false

# Entra External ID
VITE_AZURE_AD_B2C_CLIENT_ID=$spaClientId
VITE_AZURE_AD_B2C_AUTHORITY=https://$authDomain/$tenantDomain
VITE_AZURE_AD_B2C_KNOWN_AUTHORITY=$authDomain
VITE_REDIRECT_URI=http://localhost:5173
VITE_API_SCOPE=api://$apiClientId/access_as_user

# API Configuration
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:5001/graphql
"@

$envPath = Join-Path (Split-Path $scriptDir -Parent) "TS.UI\.env.local"
$envContent | Out-File $envPath -Encoding utf8
Write-Host ".env.local updated: $envPath" -ForegroundColor Gray

# ============================================================================
# Summary
# ============================================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     Setup Complete!                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Tenant:        $tenantDomain" -ForegroundColor White
Write-Host "Auth Domain:   $authDomain" -ForegroundColor White
Write-Host "SPA Client:    $spaClientId" -ForegroundColor White
Write-Host "API Client:    $apiClientId" -ForegroundColor White
Write-Host "User Flow:     $userFlowId" -ForegroundColor White
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  ⚠️  ONE MANUAL STEP REQUIRED                                   ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "Link the app to the user flow in Entra admin center:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Go to https://entra.microsoft.com" -ForegroundColor Gray
Write-Host "  2. Switch to '$TenantSubdomain' tenant (top-right)" -ForegroundColor Gray
Write-Host "  3. Identity → External Identities → User flows" -ForegroundColor Gray
Write-Host "  4. Click '$userFlowName'" -ForegroundColor Gray
Write-Host "  5. Click 'Applications' → '+ Add application'" -ForegroundColor Gray
Write-Host "  6. Select '$spaAppName' → Select" -ForegroundColor Gray
Write-Host ""
Write-Host "(This step cannot be automated due to Graph API limitations)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Then restart Vite and test sign-in at http://localhost:5173" -ForegroundColor Cyan
