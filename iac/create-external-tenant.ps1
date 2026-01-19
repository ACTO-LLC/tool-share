<#
.SYNOPSIS
    Creates a Microsoft Entra External ID tenant via REST API.

.DESCRIPTION
    This script creates a new External ID (CIAM) tenant using the Azure REST API.
    Requires an Azure subscription and appropriate permissions.

.PARAMETER TenantSubdomain
    The subdomain for the tenant (e.g., 'toolshare' becomes toolshare.onmicrosoft.com)
    Must be 1-26 alphanumeric characters.

.PARAMETER DisplayName
    The display name for the tenant (e.g., 'Tool Share')

.PARAMETER ResourceGroupName
    The Azure resource group to create the tenant in

.PARAMETER Location
    The data residency location. One of: 'United States', 'Europe', 'Asia Pacific', 'Australia'

.PARAMETER SubscriptionId
    Optional. The Azure subscription ID. If not provided, uses current subscription.

.EXAMPLE
    .\create-external-tenant.ps1 -TenantSubdomain toolshare -DisplayName "Tool Share" -ResourceGroupName rg-toolshare-auth

.NOTES
    API Version: 2023-05-17-preview
    Docs: https://learn.microsoft.com/en-us/rest/api/activedirectory/ciam-tenants/create
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-zA-Z0-9]{1,26}$')]
    [string]$TenantSubdomain,

    [Parameter(Mandatory = $true)]
    [string]$DisplayName,

    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $false)]
    [ValidateSet('United States', 'Europe', 'Asia Pacific', 'Australia')]
    [string]$Location = 'United States',

    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Create Entra External ID Tenant" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get current subscription if not provided
if (-not $SubscriptionId) {
    $account = az account show | ConvertFrom-Json
    if (-not $account) {
        Write-Host "Not logged in. Run 'az login' first." -ForegroundColor Red
        exit 1
    }
    $SubscriptionId = $account.id
    Write-Host "Using subscription: $($account.name)" -ForegroundColor Gray
}

Write-Host "Tenant Subdomain: $TenantSubdomain" -ForegroundColor Yellow
Write-Host "Display Name: $DisplayName" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host ""

# Map location to country code
$countryCode = switch ($Location) {
    'United States' { 'US' }
    'Europe' { 'EU' }
    'Asia Pacific' { 'AP' }
    'Australia' { 'AU' }
}

# Check if resource group exists, create if not
Write-Host "[1/4] Checking resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName | ConvertFrom-Json
if (-not $rgExists) {
    Write-Host "  Creating resource group '$ResourceGroupName'..." -ForegroundColor Gray
    az group create --name $ResourceGroupName --location westus2 | Out-Null
    Write-Host "  Resource group created." -ForegroundColor Green
} else {
    Write-Host "  Resource group exists." -ForegroundColor Green
}

# Check name availability
Write-Host ""
Write-Host "[2/4] Checking tenant name availability..." -ForegroundColor Yellow

$checkUrl = "https://management.azure.com/subscriptions/$SubscriptionId/providers/Microsoft.AzureActiveDirectory/checkNameAvailability?api-version=2023-05-17-preview"
$checkBody = @{
    name = $TenantSubdomain
    countryCode = $countryCode
} | ConvertTo-Json -Compress

# Write body to temp file to avoid escaping issues
$tempFile = [System.IO.Path]::GetTempFileName()
$checkBody | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

$availability = az rest --method POST --url $checkUrl --body "@$tempFile" --headers "Content-Type=application/json" 2>$null | ConvertFrom-Json
Remove-Item $tempFile -ErrorAction SilentlyContinue

if ($availability -and $availability.nameAvailable -eq $false) {
    Write-Host "  Name '$TenantSubdomain' is not available: $($availability.reason)" -ForegroundColor Red
    Write-Host "  Message: $($availability.message)" -ForegroundColor Red
    exit 1
}
Write-Host "  Name '$TenantSubdomain' is available." -ForegroundColor Green

# Create the tenant
Write-Host ""
Write-Host "[3/4] Creating External ID tenant..." -ForegroundColor Yellow
Write-Host "  This may take up to 30 minutes..." -ForegroundColor Gray

$createUrl = "https://management.azure.com/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.AzureActiveDirectory/ciamDirectories/$TenantSubdomain`?api-version=2023-05-17-preview"

$createBody = @{
    location = $Location
    sku = @{
        name = "Standard"
        tier = "A0"
    }
    properties = @{
        createTenantProperties = @{
            displayName = $DisplayName
            countryCode = $countryCode
        }
    }
} | ConvertTo-Json -Depth 10 -Compress

Write-Host "  Sending request to Azure..." -ForegroundColor Gray

# Write body to temp file to avoid escaping issues
$tempFile = [System.IO.Path]::GetTempFileName()
$createBody | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

try {
    $result = az rest --method PUT --url $createUrl --body "@$tempFile" --headers "Content-Type=application/json" 2>&1
    Remove-Item $tempFile -ErrorAction SilentlyContinue

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error creating tenant:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }

    $tenant = $result | ConvertFrom-Json
    Write-Host "  Tenant creation initiated!" -ForegroundColor Green
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Wait for provisioning (poll status)
Write-Host ""
Write-Host "[4/4] Waiting for tenant provisioning..." -ForegroundColor Yellow

$maxWaitMinutes = 35
$pollIntervalSeconds = 30
$elapsed = 0

while ($elapsed -lt ($maxWaitMinutes * 60)) {
    Start-Sleep -Seconds $pollIntervalSeconds
    $elapsed += $pollIntervalSeconds

    $statusResult = az rest --method GET --url $createUrl 2>$null | ConvertFrom-Json
    $provisioningState = $statusResult.properties.provisioningState

    Write-Host "  Status: $provisioningState ($(([math]::Round($elapsed/60, 1))) min elapsed)" -ForegroundColor Gray

    if ($provisioningState -eq "Succeeded") {
        break
    } elseif ($provisioningState -eq "Failed") {
        Write-Host "  Tenant creation failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Tenant Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tenant Details:" -ForegroundColor Cyan
Write-Host "  Domain: $TenantSubdomain.onmicrosoft.com" -ForegroundColor White
Write-Host "  Auth Domain: $TenantSubdomain.ciamlogin.com" -ForegroundColor White
Write-Host "  Tenant ID: $($statusResult.properties.tenantId)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Login to the new tenant:" -ForegroundColor White
Write-Host "     az login --tenant $TenantSubdomain.onmicrosoft.com --allow-no-subscriptions" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Run the app registration script:" -ForegroundColor White
Write-Host "     .\setup-entra-external-id.ps1 -TenantSubdomain $TenantSubdomain -Environment dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Create a user flow in Microsoft Entra admin center:" -ForegroundColor White
Write-Host "     https://entra.microsoft.com" -ForegroundColor Gray

# Save tenant info
$tenantInfo = @{
    subdomain = $TenantSubdomain
    domain = "$TenantSubdomain.onmicrosoft.com"
    authDomain = "$TenantSubdomain.ciamlogin.com"
    tenantId = $statusResult.properties.tenantId
    location = $Location
    resourceGroup = $ResourceGroupName
    createdAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$infoPath = Join-Path $PSScriptRoot "tenant-info.json"
$tenantInfo | ConvertTo-Json | Out-File $infoPath -Encoding utf8
Write-Host ""
Write-Host "Tenant info saved to: $infoPath" -ForegroundColor Gray
