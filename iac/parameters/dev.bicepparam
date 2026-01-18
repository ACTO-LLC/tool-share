using '../main.bicep'

param environment = 'dev'
param location = 'westus2'
param projectName = 'toolshare'

// These should be provided at deployment time or via Key Vault
param sqlAdminLogin = '' // Set via --parameters or environment variable
param sqlAdminPassword = '' // Set via --parameters or environment variable

// Azure AD B2C (configure after tenant creation)
param b2cTenantName = ''
param b2cClientId = ''

// Stripe (configure after Stripe account setup)
param stripeSecretKey = ''
param stripeWebhookSecret = ''
param stripePriceId = ''
