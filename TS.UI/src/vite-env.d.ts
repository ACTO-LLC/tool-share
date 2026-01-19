/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_E2E_TEST: string;
  readonly VITE_API_URL: string;
  readonly VITE_B2C_CLIENT_ID: string;
  readonly VITE_B2C_AUTHORITY: string;
  readonly VITE_B2C_KNOWN_AUTHORITY: string;
  readonly VITE_B2C_REDIRECT_URI: string;
  readonly VITE_B2C_SCOPE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
