import { useMsal, useIsAuthenticated, useAccount } from '@azure/msal-react';
import { useMockMsal, useMockAuth } from './MockAuthProvider';
import { isMockAuth } from './AuthProvider';
import { loginRequest } from '../config/auth';

/**
 * Unified auth hook that works with both MSAL and mock auth.
 * Use this instead of importing from @azure/msal-react directly.
 */
export function useAuth() {
  // Call all hooks unconditionally (React rules of hooks)
  const msalResult = useMsalSafe();
  const mockResult = useMockAuthSafe();

  if (isMockAuth) {
    return mockResult;
  }

  return msalResult;
}

// Safe wrapper for real MSAL hooks (returns null values if mock auth)
function useMsalSafe() {
  if (isMockAuth) {
    // Return dummy values - won't be used
    return {
      isAuthenticated: false,
      account: null,
      user: null,
      login: () => {},
      logout: () => {},
      instance: null,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { instance, accounts, inProgress } = useMsal();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isAuthenticated = useIsAuthenticated();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const account = useAccount(accounts[0] || {});

  console.log('[useAuth] MSAL state:', { isAuthenticated, accounts, inProgress, activeAccount: instance.getActiveAccount() });

  const login = () => {
    console.log('[useAuth] Starting login redirect...');
    instance.loginRedirect(loginRequest);
  };

  const logout = () => {
    instance.logoutRedirect();
  };

  const user = account
    ? {
        id: account.localAccountId,
        name: account.name || 'User',
        email: account.username,
        username: account.username,
      }
    : null;

  return {
    isAuthenticated,
    account,
    user,
    login,
    logout,
    instance,
  };
}

// Safe wrapper for mock auth hooks (returns null values if real auth)
function useMockAuthSafe() {
  if (!isMockAuth) {
    // Return dummy values - won't be used
    return {
      isAuthenticated: false,
      account: null,
      user: null,
      login: () => {},
      logout: () => {},
      instance: null,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mockAuth = useMockAuth();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { instance } = useMockMsal();

  return {
    isAuthenticated: mockAuth.isAuthenticated,
    account: mockAuth.account,
    user: mockAuth.user,
    login: mockAuth.login,
    logout: mockAuth.logout,
    instance,
  };
}
