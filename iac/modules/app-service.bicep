// App Service Module (for Node.js apps)

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

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string

@description('Node.js version')
param nodeVersion string = '20-lts'

@description('Additional app settings')
param appSettings array = []

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: false // Can enable in prod if needed
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: concat([
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: nodeVersion
        }
      ], appSettings)
    }
  }
}

// Staging slot for blue-green deployments (optional, only in prod)
// resource stagingSlot 'Microsoft.Web/sites/slots@2023-01-01' = if (contains(tags, 'environment') && tags.environment == 'prod') {
//   parent: appService
//   name: 'staging'
//   location: location
//   tags: tags
//   properties: {
//     serverFarmId: appServicePlanId
//     httpsOnly: true
//   }
// }

output name string = appService.name
output defaultHostName string = appService.properties.defaultHostName
output url string = 'https://${appService.properties.defaultHostName}'
