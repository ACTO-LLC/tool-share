/**
 * Jest test setup file
 * Configure global mocks and test environment
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DAB_GRAPHQL_URL = 'http://localhost:5000/graphql';
process.env.AZURE_STORAGE_CONNECTION_STRING = '';
process.env.AZURE_STORAGE_CONTAINER_NAME = 'tool-photos';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
process.env.STRIPE_PRICE_ID = 'price_test_mock';
process.env.UPCITEMDB_API_URL = 'https://api.upcitemdb.com/prod/trial/lookup';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.AZURE_AD_B2C_TENANT_ID = '';
process.env.AZURE_AD_B2C_CLIENT_ID = '';

// Clear all timers after each test
afterEach(() => {
  jest.clearAllTimers();
});

// Suppress console logs in tests unless explicitly testing logging
const originalConsole = { ...console };

beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // Keep console.error for debugging test failures
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
});
