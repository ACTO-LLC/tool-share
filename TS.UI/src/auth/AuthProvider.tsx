import { ReactNode } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { MockAuthProvider } from './MockAuthProvider';
import { msalConfig } from '../config/auth';
import { setMsalInstance, setMockAuth } from '../services/api';

// Check if we should use mock auth
export const isMockAuth = import.meta.env.VITE_MOCK_AUTH === 'true';

interface AuthProviderProps {
  children: ReactNode;
}

// Initialize MSAL only if not using mock auth
let msalInstance: PublicClientApplication | null = null;

if (!isMockAuth) {
  msalInstance = new PublicClientApplication(msalConfig);
  setMsalInstance(msalInstance);

  // Handle redirect promise for handling authentication responses
  msalInstance.initialize().then(() => {
    const accounts = msalInstance!.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance!.setActiveAccount(accounts[0]);
    }

    msalInstance!.addEventCallback((event: EventMessage) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        msalInstance!.setActiveAccount(payload.account);
      }
    });
  });
} else {
  console.log('[Auth] Using mock authentication for local development');
  setMockAuth(true);
}

export function AuthProvider({ children }: AuthProviderProps) {
  if (isMockAuth) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return <MsalProvider instance={msalInstance!}>{children}</MsalProvider>;
}

export { msalInstance };
