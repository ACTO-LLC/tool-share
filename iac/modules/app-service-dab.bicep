// App Service Module for Data API Builder (Container)

@description('Name of the App Service')
param name string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('App Service Plan ID')
param appServicePlanId string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('SQL Database connection string')
@secure()
param sqlConnectionString string

@description('Azure AD B2C tenant name')
param b2cTenantName string

@description('Azure AD B2C client ID')
param b2cClientId string

@description('CORS allowed origins')
param corsOrigins string

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOCKER|mcr.microsoft.com/azure-databases/data-api-builder:1.7.0-rc' // v1.7 RC for MCP support
      alwaysOn: false
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'DATABASE_CONNECTION_STRING'
          value: sqlConnectionString
        }
        {
          name: 'AZURE_AD_B2C_TENANT_NAME'
          value: b2cTenantName
        }
        {
          name: 'AZURE_AD_B2C_CLIENT_ID'
          value: b2cClientId
        }
        {
          name: 'AZURE_AD_B2C_TENANT_ID'
          value: b2cTenantName // Will be replaced with actual tenant ID
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://mcr.microsoft.com'
        }
      ]
      cors: {
        allowedOrigins: split(corsOrigins, ',')
        supportCredentials: true
      }
    }
  }
}

output name string = appService.name
output defaultHostName string = appService.properties.defaultHostName
output url string = 'https://${appService.properties.defaultHostName}'
