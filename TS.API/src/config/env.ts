import { cleanEnv, str, port, url } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export const config = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),

  // Azure AD B2C / Entra External ID
  AZURE_AD_B2C_TENANT_ID: str({ default: '' }),
  AZURE_AD_B2C_CLIENT_ID: str({ default: '' }),
  AZURE_AD_B2C_POLICY_NAME: str({ default: '' }),
  // Entra External ID specific (ciamlogin.com)
  AZURE_AD_AUTH_DOMAIN: str({ default: '' }),
  AZURE_AD_TENANT_GUID: str({ default: '' }),

  // E2E Testing - App-to-User mapping
  // When enabled, app-only tokens (client credentials) are mapped to the test user
  E2E_TEST_USER_MAPPING_ENABLED: str({ choices: ['true', 'false'], default: 'false' }),
  E2E_TEST_USER_ID: str({ default: '' }),
  E2E_TEST_USER_EMAIL: str({ default: 'e2e-test@example.com' }),
  E2E_TEST_USER_NAME: str({ default: 'E2E Test User' }),
  // The client ID of the service principal allowed to use test user mapping
  E2E_SERVICE_PRINCIPAL_CLIENT_ID: str({ default: '' }),

  // Database (DAB)
  DAB_GRAPHQL_URL: url({ default: 'http://localhost:5001/graphql' }),

  // Blob Storage
  AZURE_STORAGE_CONNECTION_STRING: str({ default: '' }),
  AZURE_STORAGE_CONTAINER_NAME: str({ default: 'tool-photos' }),
  AZURE_STORAGE_LOAN_CONTAINER_NAME: str({ default: 'loan-photos' }),

  // Stripe
  STRIPE_SECRET_KEY: str({ default: '' }),
  STRIPE_WEBHOOK_SECRET: str({ default: '' }),
  STRIPE_PRICE_ID: str({ default: '' }),

  // UPCitemdb
  UPCITEMDB_API_URL: url({ default: 'https://api.upcitemdb.com/prod/trial/lookup' }),

  // CORS
  CORS_ORIGIN: str({ default: 'http://localhost:5173' }),
});
