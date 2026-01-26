import { Request } from 'express';
import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config/env';

/**
 * Authenticated user information extracted from Azure AD B2C JWT token
 */
export interface AuthenticatedUser {
  /** Azure AD B2C object ID (oid claim) */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
}

/**
 * Azure AD B2C JWT token claims
 */
interface AzureB2CTokenClaims extends JwtPayload {
  oid?: string;
  sub?: string;
  email?: string;
  emails?: string[];
  name?: string;
  given_name?: string;
  family_name?: string;
  tfp?: string; // Policy name
  // Additional claims for app-only token detection
  azp?: string; // Authorized party (client ID that requested the token)
  appid?: string; // Application ID (for v1 tokens)
  idtyp?: string; // Token type ('app' for app-only tokens)
}

// Cache the JWKS clients to avoid recreating them on every request
const jwksClients: Map<string, jwksClient.JwksClient> = new Map();

/**
 * Get or create a JWKS client for a given URI
 */
function getJwksClientForUri(jwksUri: string): jwksClient.JwksClient {
  let client = jwksClients.get(jwksUri);
  if (!client) {
    client = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
    jwksClients.set(jwksUri, client);
  }
  return client;
}

/**
 * Get JWKS URI for user tokens (CIAM/B2C)
 */
function getUserTokenJwksUri(): string {
  const tenantName = config.AZURE_AD_B2C_TENANT_ID || 'YOUR_TENANT';
  const authDomain = config.AZURE_AD_AUTH_DOMAIN;
  const policyName = config.AZURE_AD_B2C_POLICY_NAME;
  const tenantGuid = config.AZURE_AD_TENANT_GUID;

  if (authDomain && authDomain.includes('ciamlogin.com') && tenantGuid) {
    // Entra External ID (CIAM) JWKS URI format - uses tenant GUID as subdomain
    return `https://${tenantGuid}.ciamlogin.com/${tenantGuid}/discovery/v2.0/keys`;
  } else if (policyName) {
    // Legacy Azure AD B2C JWKS URI format
    return `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${policyName}/discovery/v2.0/keys`;
  } else {
    // Entra External ID without explicit domain
    return `https://${tenantName}.ciamlogin.com/${tenantName}.onmicrosoft.com/discovery/v2.0/keys`;
  }
}

/**
 * Get JWKS URI for app-only tokens (Azure AD - used for E2E testing)
 */
function getAppTokenJwksUri(): string {
  const tenantGuid = config.AZURE_AD_TENANT_GUID || config.AZURE_AD_B2C_TENANT_ID;
  return `https://login.microsoftonline.com/${tenantGuid}/discovery/v2.0/keys`;
}

/**
 * Get the signing key from a specific JWKS endpoint
 */
function getSigningKey(header: jwt.JwtHeader, jwksUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = getJwksClientForUri(jwksUri);
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        console.error('[Auth] JWKS key fetch error:', err.message);
        reject(err);
        return;
      }
      if (!key) {
        reject(new Error('Signing key not found'));
        return;
      }
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
}

/**
 * Check if a token is an app-only token (client credentials flow)
 * App-only tokens have azp === aud and no user-specific claims
 */
function isAppOnlyToken(claims: AzureB2CTokenClaims): boolean {
  // App-only tokens: azp equals aud, oid equals sub, no email/name claims
  const azpEqualsAud = claims.azp === claims.aud;
  const oidEqualsSub = claims.oid === claims.sub;
  const noEmail = !claims.email && (!claims.emails || claims.emails.length === 0);
  const noName = !claims.name && !claims.given_name && !claims.family_name;

  return azpEqualsAud && oidEqualsSub && noEmail && noName;
}

/**
 * Verify an app-only token (client credentials flow) for E2E testing
 */
async function verifyAppToken(token: string): Promise<AzureB2CTokenClaims> {
  const clientId = config.AZURE_AD_B2C_CLIENT_ID;
  const tenantGuid = config.AZURE_AD_TENANT_GUID || config.AZURE_AD_B2C_TENANT_ID;

  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header) {
    throw new Error('Invalid token format');
  }

  const jwksUri = getAppTokenJwksUri();
  const signingKey = await getSigningKey(decodedHeader.header, jwksUri);

  // App tokens use login.microsoftonline.com issuer
  const issuers = [
    `https://login.microsoftonline.com/${tenantGuid}/v2.0`,
    `https://login.microsoftonline.com/${tenantGuid}/v2.0/`,
  ];

  const verifyOptions: VerifyOptions = {
    algorithms: ['RS256'],
    audience: clientId,
    issuer: issuers as [string, ...string[]],
  };

  return new Promise((resolve, reject) => {
    jwt.verify(token, signingKey, verifyOptions, (err, decoded) => {
      if (err) {
        console.error('[Auth] App token verify error:', err.message);
        reject(new Error(`App token verification failed: ${err.message}`));
        return;
      }
      console.log('[Auth] App token verified for service principal:', (decoded as AzureB2CTokenClaims)?.oid);
      resolve(decoded as AzureB2CTokenClaims);
    });
  });
}

/**
 * Verify JWT token against Azure AD B2C / Entra External ID
 * In development mode (no tenant configured), falls back to decode-only
 */
async function verifyToken(token: string): Promise<AzureB2CTokenClaims> {
  const tenantId = config.AZURE_AD_B2C_TENANT_ID;
  const clientId = config.AZURE_AD_B2C_CLIENT_ID;

  console.log('[Auth] Config:', { tenantId, clientId, authDomain: config.AZURE_AD_AUTH_DOMAIN, tenantGuid: config.AZURE_AD_TENANT_GUID });

  // Development mode: decode without verification if no Azure AD B2C configured
  if (!tenantId || !clientId || tenantId === '' || clientId === '') {
    console.warn('Azure AD B2C not configured - using development mode (token not verified)');
    const decoded = jwt.decode(token) as AzureB2CTokenClaims | null;
    if (!decoded) {
      throw new Error('Invalid token format');
    }
    return decoded;
  }

  // Decode token to see actual claims for debugging
  const tokenPayload = jwt.decode(token) as AzureB2CTokenClaims | null;
  console.log('[Auth] Token claims:', {
    iss: tokenPayload?.iss,
    aud: tokenPayload?.aud,
    sub: tokenPayload?.sub,
    oid: tokenPayload?.oid,
    azp: tokenPayload?.azp,
    exp: tokenPayload?.exp ? new Date(tokenPayload.exp * 1000).toISOString() : undefined,
  });

  // Check if this might be an E2E app-only token (from login.microsoftonline.com)
  const tenantGuid = config.AZURE_AD_TENANT_GUID || tenantId;
  const isE2EEnabled = config.E2E_TEST_USER_MAPPING_ENABLED === 'true';
  const isAppIssuer = tokenPayload?.iss?.includes('login.microsoftonline.com');

  if (isE2EEnabled && isAppIssuer) {
    console.log('[Auth] Detected app-only token, attempting E2E verification...');
    return verifyAppToken(token);
  }

  // Production mode: full JWT verification for user tokens
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header) {
    throw new Error('Invalid token format');
  }

  const jwksUri = getUserTokenJwksUri();
  const signingKey = await getSigningKey(decodedHeader.header, jwksUri);

  // Determine issuer based on auth domain
  const authDomain = config.AZURE_AD_AUTH_DOMAIN;
  let issuers: string[];
  if (authDomain && authDomain.includes('ciamlogin.com')) {
    // Entra External ID issuer format
    // Note: The issuer uses the tenant GUID as subdomain, not the tenant name
    issuers = [
      `https://${tenantGuid}.ciamlogin.com/${tenantGuid}/v2.0`,
      `https://${tenantGuid}.ciamlogin.com/${tenantGuid}/v2.0/`,
      // Also accept tenant name format just in case
      `https://${authDomain}/${tenantGuid}/v2.0`,
      `https://${authDomain}/${tenantGuid}/v2.0/`,
    ];
  } else {
    // Legacy Azure AD B2C issuer format
    issuers = [
      `https://${tenantId}.b2clogin.com/${tenantId}/v2.0/`,
      `https://${tenantId}.b2clogin.com/${tenantId}/v2.0`,
    ];
  }

  console.log('[Auth] Expected audience:', clientId);
  console.log('[Auth] Expected issuers:', issuers);

  const verifyOptions: VerifyOptions = {
    algorithms: ['RS256'],
    audience: clientId,
    issuer: issuers as [string, ...string[]],
  };

  return new Promise((resolve, reject) => {
    jwt.verify(token, signingKey, verifyOptions, (err, decoded) => {
      if (err) {
        console.error('[Auth] JWT verify error:', err.message);
        reject(new Error(`Token verification failed: ${err.message}`));
        return;
      }
      console.log('[Auth] Token verified successfully for user:', (decoded as AzureB2CTokenClaims)?.oid);
      resolve(decoded as AzureB2CTokenClaims);
    });
  });
}

// Mock user for development bypass mode
const MOCK_DEV_USER: AuthenticatedUser = {
  id: 'mock-user-001',
  email: 'dev@localhost.com',
  name: 'Dev User',
};

/**
 * TSOA authentication handler for Express
 * Validates Bearer tokens against Azure AD B2C
 *
 * @param request - Express request object
 * @param securityName - Security scheme name (must be 'Bearer')
 * @param _scopes - Optional scopes (not used currently)
 * @returns Authenticated user information
 * @throws Error if authentication fails
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[]
): Promise<AuthenticatedUser> {
  console.log('[Auth] expressAuthentication called for:', request.path);

  // Bypass auth in development mode
  if (process.env.BYPASS_AUTH === 'true') {
    console.log('[Auth] BYPASS_AUTH enabled - returning mock user');
    return MOCK_DEV_USER;
  }

  if (securityName !== 'Bearer') {
    throw new Error('Unknown security scheme');
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.substring(7);

  // Accept mock token from frontend mock auth
  if (token === 'mock-access-token') {
    console.log('[Auth] Mock token detected - returning mock user');
    return MOCK_DEV_USER;
  }

  try {
    const decoded = await verifyToken(token);

    if (!decoded) {
      throw new Error('Invalid token');
    }

    // E2E Test User Mapping: Map app-only tokens to a configured test user
    if (isAppOnlyToken(decoded) && config.E2E_TEST_USER_MAPPING_ENABLED === 'true') {
      const allowedClientId = config.E2E_SERVICE_PRINCIPAL_CLIENT_ID;
      const tokenClientId = decoded.azp || decoded.appid;

      // Verify the token is from the allowed service principal (if configured)
      if (allowedClientId && tokenClientId !== allowedClientId) {
        console.warn('[Auth] E2E mapping rejected: token client ID does not match allowed service principal');
        throw new Error('App-only token not authorized for E2E test user mapping');
      }

      const testUserId = config.E2E_TEST_USER_ID;
      if (!testUserId) {
        throw new Error('E2E_TEST_USER_ID not configured for test user mapping');
      }

      console.log('[Auth] E2E Test Mode: Mapping app-only token to test user:', testUserId);
      return {
        id: testUserId,
        email: config.E2E_TEST_USER_EMAIL,
        name: config.E2E_TEST_USER_NAME,
      };
    }

    // Extract user information from token claims
    const userId = decoded.oid || decoded.sub;
    if (!userId) {
      throw new Error('Token missing user identifier (oid/sub claim)');
    }

    // Build display name from claims
    let displayName = decoded.name || '';
    if (!displayName && (decoded.given_name || decoded.family_name)) {
      displayName = [decoded.given_name, decoded.family_name].filter(Boolean).join(' ');
    }

    return {
      id: userId,
      email: decoded.email || decoded.emails?.[0] || '',
      name: displayName,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token validation failed';
    console.error('[Auth] Authentication error:', message);
    throw new Error(`Authentication failed: ${message}`);
  }
}
