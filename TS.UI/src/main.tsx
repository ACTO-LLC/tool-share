import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import App from './App';
import { theme } from './theme';
import { msalConfig } from './config/auth';
import { setMsalInstance } from './services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for this long
      gcTime: 30 * 60 * 1000, // 30 minutes - cache data kept for this long (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      refetchOnReconnect: true, // Refetch when connection restored
    },
  },
});

const msalInstance = new PublicClientApplication(msalConfig);

// Set the MSAL instance for the API service so it can acquire tokens
setMsalInstance(msalInstance);

// Handle redirect promise for handling authentication responses
msalInstance.initialize().then(() => {
  // Set active account after redirect
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // Listen for login events and set active account
  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      msalInstance.setActiveAccount(payload.account);
    }
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </MsalProvider>
  </React.StrictMode>
);
