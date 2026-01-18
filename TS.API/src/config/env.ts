import { cleanEnv, str, port, url } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export const config = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),

  // Azure AD B2C
  AZURE_AD_B2C_TENANT_ID: str({ default: '' }),
  AZURE_AD_B2C_CLIENT_ID: str({ default: '' }),
  AZURE_AD_B2C_POLICY_NAME: str({ default: 'B2C_1_signupsignin' }),

  // Database (DAB)
  DAB_GRAPHQL_URL: url({ default: 'http://localhost:5000/graphql' }),

  // Blob Storage
  AZURE_STORAGE_CONNECTION_STRING: str({ default: '' }),
  AZURE_STORAGE_CONTAINER_NAME: str({ default: 'tool-photos' }),

  // Stripe
  STRIPE_SECRET_KEY: str({ default: '' }),
  STRIPE_WEBHOOK_SECRET: str({ default: '' }),
  STRIPE_PRICE_ID: str({ default: '' }),

  // UPCitemdb
  UPCITEMDB_API_URL: url({ default: 'https://api.upcitemdb.com/prod/trial/lookup' }),

  // CORS
  CORS_ORIGIN: str({ default: 'http://localhost:5173' }),
});
