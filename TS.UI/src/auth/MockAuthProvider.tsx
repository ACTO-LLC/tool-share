import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Mock user for local development - matches seed data user "test-user-1" (John Doe)
export const MOCK_USER = {
  id: 'test-user-1',
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe',
};

// Mock account that mimics MSAL AccountInfo
export const MOCK_ACCOUNT = {
  homeAccountId: MOCK_USER.id,
  localAccountId: MOCK_USER.id,
  environment: 'localhost',
  tenantId: 'mock-tenant',
  username: MOCK_USER.email,
  name: MOCK_USER.name,
  idTokenClaims: {
    sub: MOCK_USER.id,
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    preferred_username: MOCK_USER.username,
  },
};

// Mock authentication result
const MOCK_AUTH_RESULT = {
  authority: 'https://localhost/mock',
  uniqueId: MOCK_USER.id,
  tenantId: 'mock-tenant',
  scopes: ['openid', 'profile', 'email'],
  account: MOCK_ACCOUNT,
  idToken: 'mock-id-token',
  idTokenClaims: MOCK_ACCOUNT.idTokenClaims,
  accessToken: 'mock-access-token',
  fromCache: true,
  expiresOn: new Date(Date.now() + 3600000), // 1 hour from now
  tokenType: 'Bearer',
  correlationId: 'mock-correlation-id',
};

interface MockAuthContextType {
  isAuthenticated: boolean;
  user: typeof MOCK_USER | null;
  account: typeof MOCK_ACCOUNT | null;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

const MockAuthContext = createContext<MockAuthContextType | null>(null);

interface MockAuthProviderProps {
  children: ReactNode;
}

const MOCK_AUTH_STORAGE_KEY = 'mock_auth_authenticated';

export function MockAuthProvider({ children }: MockAuthProviderProps) {
  // Auto-login in E2E test mode (no manual sign-in required for tests)
  const isE2ETestMode = import.meta.env.VITE_E2E_TEST === 'true';

  // Initialize from localStorage to persist across page navigations
  const getInitialAuth = () => {
    // Auto-authenticate in E2E test mode
    if (isE2ETestMode) return true;
    try {
      return localStorage.getItem(MOCK_AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuth);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem(MOCK_AUTH_STORAGE_KEY, 'true');
    } catch {
      // localStorage not available
    }
    console.log('[MockAuth] User logged in:', MOCK_USER.email);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    } catch {
      // localStorage not available
    }
    console.log('[MockAuth] User logged out');
  }, []);

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return MOCK_AUTH_RESULT.accessToken;
  }, [isAuthenticated]);

  const value: MockAuthContextType = {
    isAuthenticated,
    user: isAuthenticated ? MOCK_USER : null,
    account: isAuthenticated ? MOCK_ACCOUNT : null,
    login,
    logout,
    getAccessToken,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}

// Hook that mimics useMsal() from @azure/msal-react
export function useMockMsal() {
  const { isAuthenticated, login, logout } = useMockAuth();

  return {
    instance: {
      loginRedirect: () => login(),
      loginPopup: async () => {
        login();
        return MOCK_AUTH_RESULT;
      },
      logout: () => logout(),
      logoutRedirect: () => logout(),
      logoutPopup: () => logout(),
      acquireTokenSilent: async () => MOCK_AUTH_RESULT,
      getAllAccounts: () => (isAuthenticated ? [MOCK_ACCOUNT] : []),
      getActiveAccount: () => (isAuthenticated ? MOCK_ACCOUNT : null),
      setActiveAccount: () => {},
    },
    accounts: isAuthenticated ? [MOCK_ACCOUNT] : [],
    inProgress: 'none' as const,
  };
}

// Hook that mimics useIsAuthenticated() from @azure/msal-react
export function useMockIsAuthenticated() {
  const { isAuthenticated } = useMockAuth();
  return isAuthenticated;
}

// Hook that mimics useAccount() from @azure/msal-react
export function useMockAccount() {
  const { account } = useMockAuth();
  return account;
}
