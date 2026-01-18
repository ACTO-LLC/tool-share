// App Service Plan Module

@description('Name of the App Service Plan')
param name string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('SKU name (B1, S1, P1v3, etc.)')
param skuName string = 'B1'

@description('SKU tier (Basic, Standard, Premium, etc.)')
param skuTier string = 'Basic'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: name
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    reserved: true // Required for Linux
  }
}

output planId string = appServicePlan.id
output planName string = appServicePlan.name
