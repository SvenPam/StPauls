targetScope = 'resourceGroup'

// The deploy identity needs two custom roles from infra/roles/ to deploy this file:
// 'StPauls template deployer' on the resource group (Microsoft.Resources/deployments/*) and
// 'StPauls Static Web App deployer' on the Static Web App (staticSites read, write, customDomains, listSecrets).
// A new resource type here may need another action. Add it to the role file and its test.

@description('Static Web App name.')
param name string

@description('Azure region. Free Static Web Apps are limited to a few regions.')
param location string = 'westeurope'

@description('Tags applied to the Static Web App.')
param tags object = {}

// provider 'Custom': deployed by our own workflow with a token, not linked to a repo by Azure.
resource site 'Microsoft.Web/staticSites@2025-03-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    provider: 'Custom'
  }
}

output name string = site.name
output defaultHostname string = site.properties.defaultHostname
