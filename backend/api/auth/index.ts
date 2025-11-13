import type { Env } from '../../types';
import { getDb } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import {
  createCustomer,
  verifyCustomerPassword,
  getCustomerByEmail,
} from '../../modules/customers';
import { registerSchema, loginSchema } from '../../validators/customers';
import { setAuthCookie, clearAuthCookie } from '../../utils/auth';
import { signToken } from '../../utils/jwt';

export async function handleAuthRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const db = getDb(env);
    const jwtSecret = env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Register: POST /api/auth/register
    if (method === 'POST' && path === '/api/auth/register') {
      const body = await request.json();
      const validated = registerSchema.parse(body);

      const customer = await createCustomer(db, {
        email: validated.email,
        password: validated.password,
        first_name: validated.first_name || null,
        last_name: validated.last_name || null,
      });

      const token = signToken(
        {
          id: customer.id,
          email: customer.email,
          type: 'customer',
        },
        jwtSecret,
        '90d' // Aumentar duração do token para 90 dias
      );

      // Build name from first_name and last_name
      const name = customer.first_name && customer.last_name
        ? `${customer.first_name} ${customer.last_name}`
        : customer.first_name || customer.last_name || customer.email.split('@')[0];

      const response = successResponse(
        {
          customer: {
            id: customer.id,
            email: customer.email,
            name,
            type: 'customer' as const,
          },
          token,
        },
        'Registration successful'
      );

      // Set HTTP-only cookie for customer (optional)
      response.headers.set('Set-Cookie', `customer_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${90 * 24 * 60 * 60}`);

      return response;
    }

    // Login: POST /api/auth/login
    if (method === 'POST' && path === '/api/auth/login') {
      const body = await request.json();
      const validated = loginSchema.parse(body);

      const customer = await verifyCustomerPassword(
        db,
        validated.email,
        validated.password
      );

      if (!customer) {
        return errorResponse('Invalid email or password', 401);
      }

      const token = signToken(
        {
          id: customer.id,
          email: customer.email,
          type: 'customer',
        },
        jwtSecret,
        '90d' // Aumentar duração do token para 90 dias
      );

      // Build name from first_name and last_name
      const name = customer.first_name && customer.last_name
        ? `${customer.first_name} ${customer.last_name}`
        : customer.first_name || customer.last_name || customer.email.split('@')[0];

      const response = successResponse(
        {
          customer: {
            id: customer.id,
            email: customer.email,
            name,
            type: 'customer' as const,
          },
          token,
        },
        'Login successful'
      );

      response.headers.set('Set-Cookie', `customer_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${90 * 24 * 60 * 60}`);

      return response;
    }

    // Admin Login: POST /api/auth/admin/login
    if (method === 'POST' && path === '/api/auth/admin/login') {
      const body = await request.json() as { email?: string; password?: string };
      const { email, password } = body;

      if (!email || !password) {
        return errorResponse('Email and password are required', 400);
      }

      // Check if admin exists in admins table
      const { executeOne } = await import('../../utils/db');
      const adminRecord = await executeOne<{
        id: number;
        email: string;
        password_hash: string;
        role: string;
        is_active: number;
      }>(db, 'SELECT * FROM admins WHERE email = ?', [email.toLowerCase()]);

      if (!adminRecord) {
        return errorResponse('Invalid email or password', 401);
      }

      const { comparePassword } = await import('../../utils/auth');
      const isValid = await comparePassword(password, adminRecord.password_hash);
      if (!isValid) {
        return errorResponse('Invalid email or password', 401);
      }

      if (adminRecord.is_active === 0) {
        return errorResponse('Admin access denied', 403);
      }

      const token = signToken(
        {
          id: adminRecord.id,
          email: adminRecord.email,
          type: 'admin',
          role: adminRecord.role as any,
        },
        jwtSecret,
        '7d'
      );

      const response = successResponse(
        {
          admin: {
            id: adminRecord.id,
            email: adminRecord.email,
            role: adminRecord.role,
          },
          token, // Also return token in JSON for API usage
        },
        'Admin login successful'
      );

      response.headers.set('Set-Cookie', setAuthCookie(token, 'admin_token', 7 * 24 * 60 * 60));

      return response;
    }

    // Logout: POST /api/auth/logout
    if (method === 'POST' && path === '/api/auth/logout') {
      const response = successResponse(null, 'Logout successful');
      response.headers.set('Set-Cookie', clearAuthCookie('customer_token'));
      response.headers.append('Set-Cookie', clearAuthCookie('admin_token'));
      return response;
    }

    // Me: GET /api/auth/me
    if (method === 'GET' && path === '/api/auth/me') {
      const authHeader = request.headers.get('Authorization');
      const cookieHeader = request.headers.get('Cookie');

      let token: string | null = null;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        for (const cookie of cookies) {
          const [key, value] = cookie.split('=');
          if (key === 'customer_token' || key === 'admin_token') {
            token = decodeURIComponent(value);
            break;
          }
        }
      }

      if (!token) {
        return errorResponse('Not authenticated', 401);
      }

      try {
        const { verifyToken } = await import('../../utils/jwt');
        const payload = verifyToken(token, jwtSecret);

        const { executeOne } = await import('../../utils/db');
        
        if (payload.type === 'customer') {
          const customer = await executeOne<{
            id: number;
            email: string;
            first_name: string | null;
            last_name: string | null;
            phone: string | null;
            is_active: number;
          }>(db, 'SELECT id, email, first_name, last_name, phone, is_active FROM customers WHERE id = ?', [payload.id]);

          if (!customer || customer.is_active === 0) {
            return errorResponse('Invalid token', 401);
          }

          // Build name from first_name and last_name
          const name = customer.first_name && customer.last_name
            ? `${customer.first_name} ${customer.last_name}`
            : customer.first_name || customer.last_name || customer.email.split('@')[0];

          return successResponse({ 
            user: {
              id: customer.id,
              email: customer.email,
              name,
              type: 'customer' as const,
            }, 
            type: 'customer' 
          });
        } else if (payload.type === 'admin') {
          const admin = await executeOne<{
            id: number;
            email: string;
            name: string;
            role: string;
            is_active: number;
          }>(db, 'SELECT id, email, name, role, is_active FROM admins WHERE id = ?', [payload.id]);

          if (!admin || admin.is_active === 0) {
            return errorResponse('Invalid token', 401);
          }

          return successResponse({ user: admin, type: 'admin' });
        }
      } catch (error) {
        return errorResponse('Invalid token', 401);
      }
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

