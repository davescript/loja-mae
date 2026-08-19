import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: number;
  email: string;
  type: 'customer' | 'admin';
  role?: 'super_admin' | 'admin' | 'editor';
}

export function signToken(
  payload: JWTPayload,
  secret: string,
  expiresIn: string = '7d'
): string {
  return jwt.sign(payload, secret, { expiresIn } as any);
}

export function verifyToken(token: string, secret: string): JWTPayload {
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token expired') as any;
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }
    throw new Error('Invalid token');
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function getTokenFromCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

