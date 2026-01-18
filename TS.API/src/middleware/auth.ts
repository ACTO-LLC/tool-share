import { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

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
    // In production, validate against Azure AD B2C
    // For now, decode without verification for development
    const decoded = jwt.decode(token) as {
      oid?: string;
      sub?: string;
      email?: string;
      emails?: string[];
      name?: string;
    } | null;

    if (!decoded) {
      throw new Error('Invalid token');
    }

    return {
      id: decoded.oid || decoded.sub || '',
      email: decoded.email || decoded.emails?.[0] || '',
      name: decoded.name || '',
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
