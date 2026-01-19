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
  console.log('[Auth] Initializing MSAL with config:', {
    clientId: msalConfig.auth.clientId,
    authority: msalConfig.auth.authority,
    redirectUri: window.location.origin,
  });

  msalInstance = new PublicClientApplication(msalConfig);
  setMsalInstance(msalInstance);

  // Handle redirect promise for handling authentication responses
  msalInstance.initialize().then(() => {
    console.log('[Auth] MSAL initialized, checking for redirect response...');
    console.log('[Auth] Current URL:', window.location.href);
    console.log('[Auth] URL hash:', window.location.hash);

    // CRITICAL: Process the redirect response from Entra
    msalInstance!.handleRedirectPromise().then((response) => {
      console.log('[Auth] handleRedirectPromise result:', response);
      if (response) {
        // User just logged in via redirect
        console.log('[Auth] Login successful, setting active account:', response.account);
        msalInstance!.setActiveAccount(response.account);
      } else {
        // Check for existing accounts
        const accounts = msalInstance!.getAllAccounts();
        console.log('[Auth] No redirect response, existing accounts:', accounts);
        if (accounts.length > 0) {
          msalInstance!.setActiveAccount(accounts[0]);
        }
      }
    }).catch((error) => {
      console.error('[Auth] Error handling redirect:', error);
    });

    msalInstance!.addEventCallback((event: EventMessage) => {
      console.log('[Auth] MSAL event:', event.eventType, event);
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
