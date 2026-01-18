// Tool Share - Main Infrastructure Template
// Deploys all Azure resources for the Tool Share application

targetScope = 'subscription'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (dev, uat, prod)')
@allowed(['dev', 'uat', 'prod'])
param environment string

@description('Azure region for resources')
param location string = 'westus2'

@description('Project name used for resource naming')
param projectName string = 'toolshare'

@description('SQL Server administrator login')
@secure()
param sqlAdminLogin string

@description('SQL Server administrator password')
@secure()
param sqlAdminPassword string

@description('Azure AD B2C tenant name (without .onmicrosoft.com)')
param b2cTenantName string = ''

@description('Azure AD B2C client ID for the API')
param b2cClientId string = ''

@description('Stripe secret key')
@secure()
param stripeSecretKey string = ''

@description('Stripe webhook secret')
@secure()
param stripeWebhookSecret string = ''

@description('Stripe price ID for subscription')
param stripePriceId string = ''

// ============================================================================
// VARIABLES
// ============================================================================

var resourceGroupName = 'rg-${projectName}-${environment}'
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
}

// Naming convention: {resource-type}-{project}-{environment}
var names = {
  sqlServer: 'sql-${projectName}-${environment}'
  sqlDatabase: 'sqldb-${projectName}-${environment}'
  storageAccount: 'st${projectName}${environment}' // No hyphens allowed
  appServicePlan: 'asp-${projectName}-${environment}'
  appServiceApi: 'app-${projectName}-api-${environment}'
  appServiceUi: 'app-${projectName}-ui-${environment}'
  appServiceDab: 'app-${projectName}-dab-${environment}'
  appInsights: 'appi-${projectName}-${environment}'
  logAnalytics: 'log-${projectName}-${environment}'
  keyVault: 'kv-${projectName}-${environment}'
}

// ============================================================================
// RESOURCE GROUP
// ============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ============================================================================
// MODULES
// ============================================================================

// Log Analytics Workspace (required for App Insights)
module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'logAnalytics'
  scope: resourceGroup
  params: {
    name: names.logAnalytics
    location: location
    tags: tags
  }
}

// Application Insights
module appInsights 'modules/app-insights.bicep' = {
  name: 'appInsights'
  scope: resourceGroup
  params: {
    name: names.appInsights
    location: location
    tags: tags
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// Storage Account for blob storage
module storage 'modules/storage-account.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    name: names.storageAccount
    location: location
    tags: tags
    containerNames: ['tool-photos', 'loan-photos']
  }
}

// SQL Server and Database
module sql 'modules/sql-server.bicep' = {
  name: 'sql'
  scope: resourceGroup
  params: {
    serverName: names.sqlServer
    databaseName: names.sqlDatabase
    location: location
    tags: tags
    adminLogin: sqlAdminLogin
    adminPassword: sqlAdminPassword
    // Use serverless for cost optimization
    skuName: environment == 'prod' ? 'GP_S_Gen5_1' : 'GP_S_Gen5_1'
    autoPauseDelay: environment == 'prod' ? 60 : 60 // Minutes
    minCapacity: '0.5'
  }
}

// App Service Plan (shared by all apps)
module appServicePlan 'modules/app-service-plan.bicep' = {
  name: 'appServicePlan'
  scope: resourceGroup
  params: {
    name: names.appServicePlan
    location: location
    tags: tags
    // B1 for dev/uat, S1 for prod
    skuName: environment == 'prod' ? 'S1' : 'B1'
    skuTier: environment == 'prod' ? 'Standard' : 'Basic'
  }
}

// API App Service
module apiApp 'modules/app-service.bicep' = {
  name: 'apiApp'
  scope: resourceGroup
  params: {
    name: names.appServiceApi
    location: location
    tags: tags
    appServicePlanId: appServicePlan.outputs.planId
    appInsightsConnectionString: appInsights.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    nodeVersion: '20-lts'
    appSettings: [
      { name: 'NODE_ENV', value: environment == 'prod' ? 'production' : 'development' }
      { name: 'DAB_GRAPHQL_URL', value: 'https://${names.appServiceDab}.azurewebsites.net/graphql' }
      { name: 'AZURE_STORAGE_CONNECTION_STRING', value: storage.outputs.connectionString }
      { name: 'AZURE_STORAGE_CONTAINER_NAME', value: 'tool-photos' }
      { name: 'AZURE_AD_B2C_TENANT_ID', value: b2cTenantName }
      { name: 'AZURE_AD_B2C_CLIENT_ID', value: b2cClientId }
      { name: 'STRIPE_SECRET_KEY', value: stripeSecretKey }
      { name: 'STRIPE_WEBHOOK_SECRET', value: stripeWebhookSecret }
      { name: 'STRIPE_PRICE_ID', value: stripePriceId }
      { name: 'CORS_ORIGIN', value: 'https://${names.appServiceUi}.azurewebsites.net' }
    ]
  }
}

// UI App Service (Static Web App would be cheaper, but keeping consistent with stack)
module uiApp 'modules/app-service.bicep' = {
  name: 'uiApp'
  scope: resourceGroup
  params: {
    name: names.appServiceUi
    location: location
    tags: tags
    appServicePlanId: appServicePlan.outputs.planId
    appInsightsConnectionString: appInsights.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    nodeVersion: '20-lts'
    appSettings: [
      { name: 'VITE_API_BASE_URL', value: 'https://${names.appServiceApi}.azurewebsites.net' }
      { name: 'VITE_GRAPHQL_URL', value: 'https://${names.appServiceDab}.azurewebsites.net/graphql' }
      { name: 'VITE_AZURE_AD_B2C_CLIENT_ID', value: b2cClientId }
      { name: 'VITE_AZURE_AD_B2C_TENANT_NAME', value: b2cTenantName }
    ]
  }
}

// Data API Builder App Service
module dabApp 'modules/app-service-dab.bicep' = {
  name: 'dabApp'
  scope: resourceGroup
  params: {
    name: names.appServiceDab
    location: location
    tags: tags
    appServicePlanId: appServicePlan.outputs.planId
    appInsightsConnectionString: appInsights.outputs.connectionString
    sqlConnectionString: sql.outputs.connectionString
    b2cTenantName: b2cTenantName
    b2cClientId: b2cClientId
    corsOrigins: 'https://${names.appServiceUi}.azurewebsites.net,https://${names.appServiceApi}.azurewebsites.net'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output resourceGroupName string = resourceGroup.name
output sqlServerFqdn string = sql.outputs.serverFqdn
output sqlDatabaseName string = sql.outputs.databaseName
output storageAccountName string = storage.outputs.accountName
output apiAppUrl string = 'https://${names.appServiceApi}.azurewebsites.net'
output uiAppUrl string = 'https://${names.appServiceUi}.azurewebsites.net'
output dabAppUrl string = 'https://${names.appServiceDab}.azurewebsites.net'
output appInsightsName string = appInsights.outputs.name
