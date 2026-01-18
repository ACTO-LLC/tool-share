<#
.SYNOPSIS
    Deploys Tool Share infrastructure to Azure

.DESCRIPTION
    This script deploys the Tool Share application infrastructure using Bicep templates.
    It handles environment-specific configurations and secure parameter handling.

.PARAMETER Environment
    The target environment (dev, uat, prod)

.PARAMETER Location
    Azure region for deployment (default: westus2)

.PARAMETER SqlAdminLogin
    SQL Server administrator login

.PARAMETER SqlAdminPassword
    SQL Server administrator password (will prompt if not provided)

.PARAMETER WhatIf
    Preview the deployment without making changes

.EXAMPLE
    .\deploy.ps1 -Environment dev -SqlAdminLogin sqladmin
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'uat', 'prod')]
    [string]$Environment,

    [string]$Location = 'westus2',

    [Parameter(Mandatory = $true)]
    [string]$SqlAdminLogin,

    [SecureString]$SqlAdminPassword,

    [string]$B2cTenantName = '',
    [string]$B2cClientId = '',

    [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

# Prompt for SQL password if not provided
if (-not $SqlAdminPassword) {
    $SqlAdminPassword = Read-Host -Prompt "Enter SQL Admin Password" -AsSecureString
}

# Convert SecureString to plain text for Bicep (Bicep handles securely)
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword)
$SqlAdminPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tool Share Infrastructure Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host ""

# Check Azure CLI login
Write-Host "Checking Azure CLI login..." -ForegroundColor Gray
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in to Azure CLI. Please run 'az login' first." -ForegroundColor Red
    exit 1
}
Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "Subscription: $($account.name)" -ForegroundColor Green
Write-Host ""

# Build deployment parameters
$deploymentName = "toolshare-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$templateFile = Join-Path $PSScriptRoot 'main.bicep'
$parameterFile = Join-Path $PSScriptRoot "parameters/$Environment.bicepparam"

Write-Host "Deployment Name: $deploymentName" -ForegroundColor Gray
Write-Host "Template: $templateFile" -ForegroundColor Gray
Write-Host "Parameters: $parameterFile" -ForegroundColor Gray
Write-Host ""

# Build az deployment command
$deployArgs = @(
    'deployment', 'sub', 'create',
    '--name', $deploymentName,
    '--location', $Location,
    '--template-file', $templateFile,
    '--parameters', $parameterFile,
    '--parameters', "sqlAdminLogin=$SqlAdminLogin",
    '--parameters', "sqlAdminPassword=$SqlAdminPasswordPlain"
)

if ($B2cTenantName) {
    $deployArgs += @('--parameters', "b2cTenantName=$B2cTenantName")
}
if ($B2cClientId) {
    $deployArgs += @('--parameters', "b2cClientId=$B2cClientId")
}

if ($WhatIf) {
    $deployArgs += '--what-if'
    Write-Host "Running What-If analysis..." -ForegroundColor Yellow
} else {
    Write-Host "Starting deployment..." -ForegroundColor Yellow
}

# Execute deployment
& az @deployArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

if (-not $WhatIf) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    # Get outputs
    Write-Host "Fetching deployment outputs..." -ForegroundColor Gray
    $outputs = az deployment sub show --name $deploymentName --query properties.outputs | ConvertFrom-Json

    Write-Host ""
    Write-Host "Resources Created:" -ForegroundColor Cyan
    Write-Host "  Resource Group: $($outputs.resourceGroupName.value)" -ForegroundColor White
    Write-Host "  SQL Server: $($outputs.sqlServerFqdn.value)" -ForegroundColor White
    Write-Host "  Database: $($outputs.sqlDatabaseName.value)" -ForegroundColor White
    Write-Host "  Storage: $($outputs.storageAccountName.value)" -ForegroundColor White
    Write-Host ""
    Write-Host "Application URLs:" -ForegroundColor Cyan
    Write-Host "  UI: $($outputs.uiAppUrl.value)" -ForegroundColor White
    Write-Host "  API: $($outputs.apiAppUrl.value)" -ForegroundColor White
    Write-Host "  DAB: $($outputs.dabAppUrl.value)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Run database schema: Connect to SQL Server and run database/schema.sql" -ForegroundColor White
    Write-Host "  2. Configure Azure AD B2C tenant and update app settings" -ForegroundColor White
    Write-Host "  3. Deploy application code via GitHub Actions" -ForegroundColor White
}
