import bcrypt from 'bcryptjs';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb, executeOne, executeQuery } from './db';
import { verifyToken, getTokenFromHeader, getTokenFromCookie, type JWTPayload } from './jwt';
import { UnauthorizedError, ForbiddenError } from './errors';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCustomerFromToken(
  db: D1Database,
  token: string,
  jwtSecret: string
): Promise<{ id: number; email: string } | null> {
  try {
    console.log(`[AUTH] Verificando token JWT: ${token.substring(0, 20)}...`);
    const payload = verifyToken(token, jwtSecret);
    console.log(`[AUTH] Payload decodificado:`, { id: payload.id, email: payload.email, type: payload.type });
    
    if (payload.type !== 'customer') {
      console.error(`[AUTH] Token não é de cliente, tipo: ${payload.type}`);
      return null;
    }

    const customer = await executeOne<{ id: number; email: string; is_active: number }>(
      db,
      'SELECT id, email, is_active FROM customers WHERE id = ?',
      [payload.id]
    );

    if (!customer) {
      console.error(`[AUTH] Cliente não encontrado no banco: ID ${payload.id}`);
      return null;
    }

    if (customer.is_active === 0) {
      console.error(`[AUTH] Cliente inativo: ID ${payload.id}`);
      return null;
    }

    console.log(`[AUTH] Cliente encontrado: ${customer.email} (ID: ${customer.id})`);
    return { id: customer.id, email: customer.email };
  } catch (error: any) {
    console.error(`[AUTH] Erro ao verificar token:`, error.message);
    return null;
  }
}

export async function getAdminFromToken(
  db: D1Database,
  token: string,
  jwtSecret: string
): Promise<{ id: number; email: string; role: string } | null> {
  try {
    const payload = verifyToken(token, jwtSecret);
    if (payload.type !== 'admin') {
      return null;
    }

    const admin = await executeOne<{ id: number; email: string; role: string; is_active: number }>(
      db,
      'SELECT id, email, role, is_active FROM admins WHERE id = ?',
      [payload.id]
    );

    if (!admin || admin.is_active === 0) {
      return null;
    }

    return { id: admin.id, email: admin.email, role: admin.role };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(
  request: Request,
  env: any,
  type: 'customer' | 'admin' | 'both' = 'both'
): Promise<{ id: number; email: string; type: 'customer' | 'admin'; role?: string }> {
  const db = getDb(env);
  const jwtSecret = env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  // Try to get token from header or cookie
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  
  let token: string | null = null;
  
  if (type === 'admin') {
    // Admin can use either Authorization header or cookie
    token = getTokenFromHeader(authHeader) || getTokenFromCookie(cookieHeader, 'admin_token');
  } else {
    // Customer uses session_access cookie (set by login) or Authorization header
    token = getTokenFromHeader(authHeader) || getTokenFromCookie(cookieHeader, 'session_access');
  }

  // Log para debug
  console.log(`[AUTH] RequireAuth - type: ${type}, hasToken: ${!!token}, authHeader: ${!!authHeader}, cookieHeader: ${!!cookieHeader}`);

  if (!token) {
    console.error('[AUTH] No token found in request');
    throw new UnauthorizedError('Authentication required');
  }

  // Verify token and get user
  if (type === 'customer') {
    try {
      console.log(`[AUTH] Verificando token de cliente: ${token.substring(0, 20)}...`);
      const customer = await getCustomerFromToken(db, token, jwtSecret);
      if (!customer) {
        console.error('[AUTH] Cliente não encontrado ou token inválido');
        throw new UnauthorizedError('Invalid or expired token');
      }
      console.log(`[AUTH] Cliente autenticado: ${customer.email} (ID: ${customer.id})`);
      return { ...customer, type: 'customer' };
    } catch (error: any) {
      console.error('[AUTH] Erro ao verificar token de cliente:', error.message);
      // Se for erro de JWT, dar mensagem mais clara
      if (error.message && error.message.includes('Invalid or expired token')) {
        throw new UnauthorizedError('Token inválido ou expirado. Por favor, faça login novamente.');
      }
      throw error;
    }
  } else if (type === 'admin') {
    try {
      const admin = await getAdminFromToken(db, token, jwtSecret);
      if (!admin) {
        throw new UnauthorizedError('Invalid or expired token');
      }
      return { ...admin, type: 'admin' };
    } catch (error: any) {
      if (error.message && error.message.includes('Invalid or expired token')) {
        throw new UnauthorizedError('Token inválido ou expirado. Por favor, faça login novamente.');
      }
      throw error;
    }
  } else {
    // Try admin first, then customer
    try {
      const admin = await getAdminFromToken(db, token, jwtSecret);
      if (admin) {
        return { ...admin, type: 'admin' };
      }
      const customer = await getCustomerFromToken(db, token, jwtSecret);
      if (customer) {
        return { ...customer, type: 'customer' };
      }
      throw new UnauthorizedError('Invalid or expired token');
    } catch (error: any) {
      if (error.message && error.message.includes('Invalid or expired token')) {
        throw new UnauthorizedError('Token inválido ou expirado. Por favor, faça login novamente.');
      }
      throw error;
    }
  }
}

export async function requireAdmin(
  request: Request,
  env: any,
  roles: ('super_admin' | 'admin' | 'editor')[] = ['admin', 'super_admin']
): Promise<{ id: number; email: string; role: string }> {
  const user = await requireAuth(request, env, 'admin');
  
  if (!roles.includes(user.role as any)) {
    throw new ForbiddenError('Insufficient permissions');
  }

  return user as { id: number; email: string; role: string };
}

export function setAuthCookie(
  token: string,
  name: string = 'admin_token',
  maxAge: number = 7 * 24 * 60 * 60 // 7 days
): string {
  // SameSite=None garante que cookies funcionem em chamadas cross-site (admin hospedado em domínio diferente)
  return `${name}=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}

export function clearAuthCookie(name: string = 'admin_token'): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

export function setCookieKV(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
