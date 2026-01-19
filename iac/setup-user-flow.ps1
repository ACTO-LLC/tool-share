<#
.SYNOPSIS
    Creates a user flow and links the app in Entra External ID.

.DESCRIPTION
    This script creates a sign-up/sign-in user flow and associates the SPA app with it.
    Uses Microsoft Graph API.

.PARAMETER UserFlowName
    Display name for the user flow (default: "Tool Share Sign Up/Sign In")

.PARAMETER SpaAppId
    The SPA application (client) ID to link to the user flow

.EXAMPLE
    .\setup-user-flow.ps1 -SpaAppId "be16e8ac-0fcb-48d0-b12b-4cce071f54af"

.NOTES
    Requires: az login to the External ID tenant
    Docs: https://learn.microsoft.com/en-us/graph/api/identitycontainer-post-authenticationeventsflows
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$UserFlowName = "Tool Share Sign Up Sign In",

    [Parameter(Mandatory = $true)]
    [string]$SpaAppId
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Create User Flow & Link App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "User Flow: $UserFlowName" -ForegroundColor Yellow
Write-Host "SPA App ID: $SpaAppId" -ForegroundColor Yellow
Write-Host ""

# Check login
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in. Run 'az login --tenant <tenant>.onmicrosoft.com --allow-no-subscriptions' first." -ForegroundColor Red
    exit 1
}
Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "Tenant: $($account.tenantId)" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# Step 1: Create the User Flow
# ============================================================================
Write-Host "[1/3] Creating user flow..." -ForegroundColor Yellow

$userFlowBody = @{
    "@odata.type" = "#microsoft.graph.externalUsersSelfServiceSignUpEventsFlow"
    displayName = $UserFlowName
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
            @{
                id = "email"
                displayName = "Email Address"
                description = "Email address of the user"
                userFlowAttributeType = "builtIn"
                dataType = "string"
            }
            @{
                id = "displayName"
                displayName = "Display Name"
                description = "Display Name of the User"
                userFlowAttributeType = "builtIn"
                dataType = "string"
            }
        )
        attributeCollectionPage = @{
            views = @(
                @{
                    inputs = @(
                        @{
                            attribute = "email"
                            label = "Email Address"
                            inputType = "text"
                            hidden = $true
                            editable = $false
                            writeToDirectory = $true
                            required = $true
                        }
                        @{
                            attribute = "displayName"
                            label = "Display Name"
                            inputType = "text"
                            hidden = $false
                            editable = $true
                            writeToDirectory = $true
                            required = $true
                        }
                    )
                }
            )
        }
    }
} | ConvertTo-Json -Depth 20 -Compress

# Write to temp file
$tempFile = [System.IO.Path]::GetTempFileName()
$userFlowBody | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

try {
    $userFlowResult = az rest --method POST `
        --url "https://graph.microsoft.com/v1.0/identity/authenticationEventsFlows" `
        --body "@$tempFile" `
        --headers "Content-Type=application/json" 2>&1

    if ($LASTEXITCODE -ne 0) {
        # Check if it already exists
        if ($userFlowResult -match "already exists" -or $userFlowResult -match "duplicate") {
            Write-Host "  User flow may already exist. Checking..." -ForegroundColor Yellow
        } else {
            Write-Host "  Error creating user flow:" -ForegroundColor Red
            Write-Host $userFlowResult -ForegroundColor Red
            Remove-Item $tempFile -ErrorAction SilentlyContinue
            exit 1
        }
    }

    $userFlow = $userFlowResult | ConvertFrom-Json
    $userFlowId = $userFlow.id
    Write-Host "  User flow created with ID: $userFlowId" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item $tempFile -ErrorAction SilentlyContinue

# ============================================================================
# Step 2: Get the Service Principal for the SPA App
# ============================================================================
Write-Host ""
Write-Host "[2/3] Getting/creating service principal for SPA app..." -ForegroundColor Yellow

# Check if service principal exists
$spResult = az ad sp show --id $SpaAppId 2>$null
if (-not $spResult) {
    Write-Host "  Creating service principal..." -ForegroundColor Gray
    $spResult = az ad sp create --id $SpaAppId 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error creating service principal:" -ForegroundColor Red
        Write-Host $spResult -ForegroundColor Red
        exit 1
    }
}

$sp = $spResult | ConvertFrom-Json
$spObjectId = $sp.id
Write-Host "  Service Principal Object ID: $spObjectId" -ForegroundColor Green

# ============================================================================
# Step 3: Link the App to the User Flow
# ============================================================================
Write-Host ""
Write-Host "[3/3] Linking app to user flow..." -ForegroundColor Yellow

$linkBody = @{
    "@odata.id" = "https://graph.microsoft.com/v1.0/servicePrincipals/$spObjectId"
} | ConvertTo-Json -Compress

$tempFile2 = [System.IO.Path]::GetTempFileName()
$linkBody | Out-File -FilePath $tempFile2 -Encoding utf8 -NoNewline

try {
    $linkResult = az rest --method POST `
        --url "https://graph.microsoft.com/v1.0/identity/authenticationEventsFlows/$userFlowId/conditions/applications/includeApplications/`$ref" `
        --body "@$tempFile2" `
        --headers "Content-Type=application/json" 2>&1

    if ($LASTEXITCODE -ne 0) {
        if ($linkResult -match "already exists" -or $linkResult -match "added") {
            Write-Host "  App already linked to user flow." -ForegroundColor Yellow
        } else {
            Write-Host "  Error linking app:" -ForegroundColor Red
            Write-Host $linkResult -ForegroundColor Red
            Remove-Item $tempFile2 -ErrorAction SilentlyContinue
            exit 1
        }
    } else {
        Write-Host "  App linked to user flow successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}

Remove-Item $tempFile2 -ErrorAction SilentlyContinue

# ============================================================================
# Done
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "User Flow Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "User Flow ID: $userFlowId" -ForegroundColor White
Write-Host "Linked App: $SpaAppId" -ForegroundColor White
Write-Host ""
Write-Host "You can now sign in at your app!" -ForegroundColor Cyan
