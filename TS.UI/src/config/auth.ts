import { Configuration, LogLevel } from '@azure/msal-browser';

// Microsoft Entra External ID configuration (successor to Azure AD B2C)
// Replace these values with your actual Entra External ID tenant details
// See: https://learn.microsoft.com/en-us/entra/external-id/customers/
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_B2C_CLIENT_ID || 'YOUR_CLIENT_ID',
    // For Entra External ID, use: https://TENANT.ciamlogin.com/TENANT.onmicrosoft.com
    // For legacy B2C, use: https://TENANT.b2clogin.com/TENANT.onmicrosoft.com/B2C_1_signupsignin
    authority: import.meta.env.VITE_AZURE_AD_B2C_AUTHORITY || 'https://YOUR_TENANT.ciamlogin.com/YOUR_TENANT.onmicrosoft.com',
    knownAuthorities: [import.meta.env.VITE_AZURE_AD_B2C_KNOWN_AUTHORITY || 'YOUR_TENANT.ciamlogin.com'],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};

export const apiRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE || 'api://YOUR_API_CLIENT_ID/access_as_user'],
};
