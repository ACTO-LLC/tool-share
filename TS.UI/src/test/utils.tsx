import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, IPublicClientApplication, AccountInfo } from '@azure/msal-browser';

// Create a default theme for testing
const defaultTheme = createTheme();

// Mock MSAL configuration
const mockMsalConfig = {
  auth: {
    clientId: 'test-client-id',
    authority: 'https://login.microsoftonline.com/test-tenant-id',
    redirectUri: 'http://localhost:5173',
  },
};

// Create a mock MSAL instance
export function createMockMsalInstance(): IPublicClientApplication {
  const mockMsalInstance = new PublicClientApplication(mockMsalConfig);

  // Mock account for testing
  const mockAccount: AccountInfo = {
    homeAccountId: 'test-home-account-id',
    localAccountId: 'test-local-account-id',
    environment: 'login.microsoftonline.com',
    tenantId: 'test-tenant-id',
    username: 'test@example.com',
    name: 'Test User',
  };

  // Override methods for testing
  mockMsalInstance.getAllAccounts = () => [mockAccount];
  mockMsalInstance.getActiveAccount = () => mockAccount;
  mockMsalInstance.setActiveAccount = () => {};

  return mockMsalInstance;
}

// Create a test QueryClient with disabled retries
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  msalInstance?: IPublicClientApplication;
  routerProps?: MemoryRouterProps;
}

/**
 * Wrapper component that provides all necessary context providers
 */
export function AllProviders({
  children,
  queryClient = createTestQueryClient(),
  msalInstance = createMockMsalInstance(),
  routerProps = { initialEntries: ['/'] },
}: AllProvidersProps) {
  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={defaultTheme}>
          <MemoryRouter {...routerProps}>{children}</MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  msalInstance?: IPublicClientApplication;
  routerProps?: MemoryRouterProps;
}

/**
 * Custom render function that wraps the component with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, msalInstance, routerProps, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders
      queryClient={queryClient}
      msalInstance={msalInstance}
      routerProps={routerProps}
    >
      {children}
    </AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

/**
 * Wrapper for testing hooks with React Query
 */
interface HookWrapperOptions {
  queryClient?: QueryClient;
}

export function createHookWrapper(options: HookWrapperOptions = {}) {
  const queryClient = options.queryClient || createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { Wrapper, queryClient };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
