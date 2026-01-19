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
}

// Cache the JWKS client to avoid recreating it on every request
let jwksClientInstance: jwksClient.JwksClient | null = null;

/**
 * Get or create the JWKS client for Azure AD B2C
 */
function getJwksClient(): jwksClient.JwksClient {
  if (!jwksClientInstance) {
    const tenantName = config.AZURE_AD_B2C_TENANT_ID || 'YOUR_TENANT';
    const policyName = config.AZURE_AD_B2C_POLICY_NAME || 'B2C_1_signupsignin';

    // Azure AD B2C JWKS URI format
    const jwksUri = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${policyName}/discovery/v2.0/keys`;

    jwksClientInstance = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return jwksClientInstance;
}

/**
 * Get the signing key from JWKS endpoint
 */
function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = getJwksClient();
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
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
 * Verify JWT token against Azure AD B2C
 * In development mode (no tenant configured), falls back to decode-only
 */
async function verifyToken(token: string): Promise<AzureB2CTokenClaims> {
  const tenantId = config.AZURE_AD_B2C_TENANT_ID;
  const clientId = config.AZURE_AD_B2C_CLIENT_ID;

  // Development mode: decode without verification if no Azure AD B2C configured
  if (!tenantId || !clientId || tenantId === '' || clientId === '') {
    console.warn('Azure AD B2C not configured - using development mode (token not verified)');
    const decoded = jwt.decode(token) as AzureB2CTokenClaims | null;
    if (!decoded) {
      throw new Error('Invalid token format');
    }
    return decoded;
  }

  // Production mode: full JWT verification
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header) {
    throw new Error('Invalid token format');
  }

  const signingKey = await getSigningKey(decodedHeader.header);

  const issuer = `https://${tenantId}.b2clogin.com/${tenantId}/v2.0/`;

  const verifyOptions: VerifyOptions = {
    algorithms: ['RS256'],
    audience: clientId,
    issuer: issuer,
  };

  return new Promise((resolve, reject) => {
    jwt.verify(token, signingKey, verifyOptions, (err, decoded) => {
      if (err) {
        reject(new Error(`Token verification failed: ${err.message}`));
        return;
      }
      resolve(decoded as AzureB2CTokenClaims);
    });
  });
}

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
  if (securityName !== 'Bearer') {
    throw new Error('Unknown security scheme');
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await verifyToken(token);

    if (!decoded) {
      throw new Error('Invalid token');
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
    throw new Error(`Authentication failed: ${message}`);
  }
}
