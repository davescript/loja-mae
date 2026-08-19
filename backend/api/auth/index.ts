import type { Env } from '../../types';
import { getDb, executeOne, executeRun, executeQuery } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import {
  createCustomer,
  verifyCustomerPassword,
  getCustomerByEmail,
} from '../../modules/customers';
import { registerSchema, loginSchema } from '../../validators/customers';
import { setAuthCookie, clearAuthCookie, hashPassword, hashRefreshToken, compareRefreshTokenHash } from '../../utils/auth';
import { signToken } from '../../utils/jwt';
import { sendEmail, generatePasswordResetEmail } from '../../utils/email';

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

      const access = signToken({ id: customer.id, email: customer.email, type: 'customer' }, jwtSecret, '15m');
      const refreshRaw = crypto.randomUUID() + '.' + crypto.randomUUID();
      const refreshHash = await hashRefreshToken(refreshRaw);
      await executeRun(db, 'INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)', [
        customer.id,
        refreshHash,
        request.headers.get('User-Agent') || '',
        request.headers.get('CF-Connecting-IP') || '',
        new Date().toISOString(),
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      ]);

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
          token: access, // Incluir token para salvar no localStorage
        },
        'Registration successful'
      );
      const domain = url.hostname;
      response.headers.set('Set-Cookie', `session_access=${access}; Path=/; Domain=${domain}; HttpOnly; Secure; SameSite=Lax; Max-Age=${15 * 60}`);
      response.headers.append('Set-Cookie', `session_refresh=${encodeURIComponent(refreshRaw)}; Path=/; Domain=${domain}; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 24 * 60 * 60}`);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Vary', 'Authorization, Cookie');
      return response;
    }

    // Login: POST /api/auth/login (cookies: session_access + session_refresh)
    if (method === 'POST' && path === '/api/auth/login') {
      const body = await request.json();
      const validated = loginSchema.parse(body);

      const customer = await verifyCustomerPassword(
        db,
        validated.email,
        validated.password
      );

      if (!customer) {
        const res = errorResponse('Invalid email or password', 401);
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.headers.set('Pragma', 'no-cache');
        res.headers.set('Expires', '0');
        res.headers.set('Vary', 'Authorization, Cookie');
        return res;
      }

      const access = signToken({ id: customer.id, email: customer.email, type: 'customer' }, jwtSecret, '15m');
      const refreshRaw = crypto.randomUUID() + '.' + crypto.randomUUID();
      const refreshHash = await hashRefreshToken(refreshRaw);
      const now = new Date().toISOString();
      const exp = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      await executeRun(db, 'INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)', [
        customer.id,
        refreshHash,
        request.headers.get('User-Agent') || '',
        request.headers.get('CF-Connecting-IP') || '',
        now,
        exp,
      ]);

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
          token: access, // Incluir token para salvar no localStorage
        },
        'Login successful'
      );

      // Configurar cookies para funcionar cross-domain
      // Se o domínio for leiasabores.pt, usar .leiasabores.pt para compartilhar entre subdomínios
      // Se for workers.dev, não usar Domain (cookies funcionam apenas no mesmo domínio)
      const requestHostname = url.hostname;
      let cookieDomain = '';
      let sameSite: 'Lax' | 'None' = 'Lax';
      let secure = true;

      if (requestHostname.includes('leiasabores.pt')) {
        // Para leiasabores.pt, usar .leiasabores.pt para compartilhar entre www e api
        cookieDomain = 'Domain=.leiasabores.pt; ';
        sameSite = 'Lax';
      } else if (requestHostname.includes('workers.dev')) {
        // Para workers.dev, não usar Domain (cookies só funcionam no mesmo domínio)
        // Mas precisamos usar SameSite=None e Secure para cross-site
        cookieDomain = '';
        sameSite = 'None';
        secure = true;
      } else {
        // Fallback: usar o domínio da requisição
        cookieDomain = `Domain=${requestHostname}; `;
      }

      const accessCookie = `session_access=${access}; Path=/; ${cookieDomain}HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=${sameSite}; Max-Age=${15 * 60}`;
      const refreshCookie = `session_refresh=${encodeURIComponent(refreshRaw)}; Path=/; ${cookieDomain}HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=${sameSite}; Max-Age=${60 * 24 * 60 * 60}`;

      response.headers.set('Set-Cookie', accessCookie);
      response.headers.append('Set-Cookie', refreshCookie);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Vary', 'Authorization, Cookie');

      console.log('[AUTH] Login cookies configurados:', {
        domain: cookieDomain || 'sem domain',
        sameSite,
        secure,
        hostname: requestHostname,
      });

      return response;
    }

    // Forgot Password: POST /api/auth/forgot-password
    if (method === 'POST' && path === '/api/auth/forgot-password') {
      const body = await request.json() as { email?: string };
      if (!body.email) {
        return errorResponse('Email é obrigatório', 400);
      }
      const email = body.email.toLowerCase().trim();
      const customer = await executeOne<{ id: number; first_name: string | null; last_name: string | null }>(
        db,
        'SELECT id, first_name, last_name FROM customers WHERE email = ? AND is_active = 1',
        [email]
      );
      // Always return success to avoid user enumeration
      if (!customer) {
        return successResponse({ sent: true });
      }
      const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await executeRun(
        db,
        'INSERT OR REPLACE INTO customer_password_resets (email, token, expires_at, created_at) VALUES (?, ?, ?, datetime("now"))',
        [email, token, expiresAt]
      );
      const appUrl = env.APP_URL || 'https://www.leiasabores.pt';
      const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const name = customer.first_name || email.split('@')[0];
      await sendEmail(env, {
        to: email,
        subject: 'Recuperação de senha — Leiasabores',
        html: generatePasswordResetEmail(name, resetUrl),
      });
      return successResponse({ sent: true });
    }

    // Reset Password: POST /api/auth/reset-password
    if (method === 'POST' && path === '/api/auth/reset-password') {
      const body = await request.json() as { email?: string; token?: string; password?: string };
      if (!body.email || !body.token || !body.password) {
        return errorResponse('Email, token e senha são obrigatórios', 400);
      }
      if (body.password.length < 8) {
        return errorResponse('A senha deve ter pelo menos 8 caracteres', 400);
      }
      const email = body.email.toLowerCase().trim();
      const row = await executeOne<{ token: string; expires_at: string }>(
        db,
        'SELECT token, expires_at FROM customer_password_resets WHERE email = ?',
        [email]
      );
      if (!row || row.token !== body.token) {
        return errorResponse('Link inválido ou expirado', 400);
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return errorResponse('Link expirado. Solicite um novo.', 400);
      }
      const customer = await executeOne<{ id: number }>(
        db,
        'SELECT id FROM customers WHERE email = ? AND is_active = 1',
        [email]
      );
      if (!customer) {
        return errorResponse('Conta não encontrada', 404);
      }
      const passwordHash = await hashPassword(body.password);
      await executeRun(db, 'UPDATE customers SET password_hash = ?, updated_at = datetime("now") WHERE id = ?', [passwordHash, customer.id]);
      await executeRun(db, 'DELETE FROM customer_password_resets WHERE email = ?', [email]);
      // Revoke all sessions for security
      await executeRun(db, 'UPDATE user_sessions SET revoked_at = datetime("now") WHERE user_id = ?', [customer.id]);
      return successResponse({ reset: true }, 'Senha atualizada com sucesso');
    }

    if (method === 'POST' && path === '/api/auth/admin/register') {
      const body = await request.json() as { email: string; password: string; name?: string };
      const existing = await executeOne<{ count: number }>(db, 'SELECT COUNT(*) as count FROM admins');
      if ((existing?.count || 0) > 0) {
        return errorResponse('Admin registration disabled', 403);
      }
      const passwordHash = await hashPassword(body.password);
      const result = await executeRun(
        db,
        'INSERT INTO admins (email, password_hash, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime("now"), datetime("now"))',
        [body.email.toLowerCase(), passwordHash, body.name || body.email.split('@')[0], 'super_admin']
      );
      const token = signToken({ id: result.meta.last_row_id, email: body.email.toLowerCase(), type: 'admin', role: 'super_admin' as any }, jwtSecret, '7d');
      const response = successResponse({ admin: { id: result.meta.last_row_id, email: body.email.toLowerCase(), name: body.name || body.email.split('@')[0], role: 'super_admin' }, token }, 'Admin registration successful');
      response.headers.set('Set-Cookie', setAuthCookie(token, 'admin_token', 7 * 24 * 60 * 60));
      return response;
    }

    if (method === 'POST' && path === '/api/auth/admin/forgot') {
      const body = await request.json() as { email: string };
      const admin = await executeOne<{ id: number; email: string }>(db, 'SELECT id, email FROM admins WHERE email = ?', [body.email.toLowerCase()]);
      if (!admin) {
        return errorResponse('Admin not found', 404);
      }
      await executeRun(db, 'CREATE TABLE IF NOT EXISTS admin_password_resets (email TEXT PRIMARY KEY, code TEXT, expires_at TEXT, created_at TEXT)');
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await executeRun(db, 'INSERT OR REPLACE INTO admin_password_resets (email, code, expires_at, created_at) VALUES (?, ?, ?, datetime("now"))', [admin.email, code, expiresAt]);
      const ok = await sendEmail(env, { to: admin.email, subject: 'Código de recuperação de senha', html: `<p>Seu código de verificação é <strong>${code}</strong>. Ele expira em 15 minutos.</p>` });
      if (!ok) {
        return errorResponse('Failed to send email', 500);
      }
      return successResponse({ sent: true });
    }

    if (method === 'POST' && path === '/api/auth/admin/reset') {
      const body = await request.json() as { email: string; code: string; new_password: string };
      const row = await executeOne<{ email: string; code: string; expires_at: string }>(db, 'SELECT email, code, expires_at FROM admin_password_resets WHERE email = ?', [body.email.toLowerCase()]);
      if (!row || row.code !== body.code) {
        return errorResponse('Invalid code', 400);
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return errorResponse('Code expired', 400);
      }
      const admin = await executeOne<{ id: number }>(db, 'SELECT id FROM admins WHERE email = ?', [body.email.toLowerCase()]);
      if (!admin) {
        return errorResponse('Admin not found', 404);
      }
      const passwordHash = await hashPassword(body.new_password);
      await executeRun(db, 'UPDATE admins SET password_hash = ?, updated_at = datetime("now") WHERE id = ?', [passwordHash, admin.id]);
      await executeRun(db, 'DELETE FROM admin_password_resets WHERE email = ?', [body.email.toLowerCase()]);
      return successResponse({ reset: true }, 'Password updated');
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
      const isBcrypt = adminRecord.password_hash?.startsWith('$2a$') || adminRecord.password_hash?.startsWith('$2b$');
      const isValid = isBcrypt
        ? await comparePassword(password, adminRecord.password_hash)
        : password === adminRecord.password_hash;
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

      // Get admin name if available
      const adminWithName = await executeOne<{ name: string | null }>(
        db,
        'SELECT name FROM admins WHERE id = ?',
        [adminRecord.id]
      );
      const adminName = adminWithName?.name || adminRecord.email.split('@')[0];

      const response = successResponse(
        {
          admin: {
            id: adminRecord.id,
            email: adminRecord.email,
            name: adminName,
            role: adminRecord.role,
          },
          token, // Also return token in JSON for API usage
        },
        'Admin login successful'
      );

      // Set cookie with proper configuration
      const cookieValue = setAuthCookie(token, 'admin_token', 7 * 24 * 60 * 60);
      response.headers.set('Set-Cookie', cookieValue);

      return response;
    }

    // Logout: POST /api/auth/logout
    if (method === 'POST' && path === '/api/auth/logout') {
      const cookieHeader = request.headers.get('Cookie') || '';
      const refreshMatch = cookieHeader.match(/session_refresh=([^;]+)/);
      const accessMatch = cookieHeader.match(/session_access=([^;]+)/);

      let userId: number | null = null;
      if (accessMatch) {
        try {
          const token = decodeURIComponent(accessMatch[1]);
          const { verifyToken } = await import('../../utils/jwt');
          const payload = verifyToken(token, jwtSecret);
          if (payload?.type === 'customer') {
            userId = payload.id;
          }
        } catch (err) {
          console.warn('[AUTH] Logout: falha ao verificar token de acesso', err);
        }
      }

      if (userId) {
        await executeRun(db, 'UPDATE user_sessions SET revoked_at = datetime("now") WHERE user_id = ?', [userId]);
      } else if (refreshMatch) {
        const raw = decodeURIComponent(refreshMatch[1]);
        const session = await findSessionByRefreshToken(db, raw);
        if (session) {
          await executeRun(db, 'UPDATE user_sessions SET revoked_at = datetime("now") WHERE id = ?', [session.id]);
        } else {
          console.warn('[AUTH] Logout: refresh token não encontrado para revogação');
        }
      }

      const response = successResponse(null, 'Logout successful');

      // Clear-Site-Data header forces browser to clear cookies and storage
      // This is the most reliable way to ensure logout
      response.headers.set('Clear-Site-Data', '"cookies", "storage"');

      // Also manually clear cookies for compatibility
      const requestHostname = url.hostname;
      const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';

      // Helper to build clear cookie string
      const buildClearCookie = (name: string, domain?: string) =>
        `${name}=; Path=/; ${domain ? `Domain=${domain}; ` : ''}HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=${expires}`;

      const cookiesToClear = [
        // 1. Clear for current hostname (most common)
        buildClearCookie('session_access', requestHostname),
        buildClearCookie('session_refresh', requestHostname),

        // 2. Clear without domain (host-only cookie)
        buildClearCookie('session_access'),
        buildClearCookie('session_refresh'),
      ];

      // 3. Clear for root domain if on subdomain
      if (requestHostname.includes('leiasabores.pt')) {
        cookiesToClear.push(buildClearCookie('session_access', '.leiasabores.pt'));
        cookiesToClear.push(buildClearCookie('session_refresh', '.leiasabores.pt'));
      }

      // Set the first cookie
      response.headers.set('Set-Cookie', cookiesToClear[0]);

      // Append the rest
      for (let i = 1; i < cookiesToClear.length; i++) {
        response.headers.append('Set-Cookie', cookiesToClear[i]);
      }

      // Also clear admin token
      response.headers.append('Set-Cookie', clearAuthCookie('admin_token'));

      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    }

    // Logout global: POST /api/auth/logout-all
    if (method === 'POST' && path === '/api/auth/logout-all') {
      const cookieHeader = request.headers.get('Cookie') || '';
      const m = cookieHeader.match(/session_access=([^;]+)/);
      if (!m) {
        return errorResponse('Not authenticated', 401);
      }
      try {
        const access = decodeURIComponent(m[1]);
        const { verifyToken } = await import('../../utils/jwt');
        const payload = verifyToken(access, jwtSecret);
        if (payload.type !== 'customer') {
          return errorResponse('Not authenticated', 401);
        }
        await executeRun(db, 'UPDATE user_sessions SET revoked_at = datetime("now") WHERE user_id = ?', [payload.id]);
        const domain = url.hostname;
        const response = successResponse(null, 'Logout all successful');
        response.headers.set('Set-Cookie', `session_access=; Path=/; Domain=${domain}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
        response.headers.append('Set-Cookie', `session_refresh=; Path=/; Domain=${domain}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('Vary', 'Authorization, Cookie');
        return response;
      } catch {
        return errorResponse('Not authenticated', 401);
      }
    }

    // Refresh: POST /api/auth/refresh
    if (method === 'POST' && path === '/api/auth/refresh') {
      const cookieHeader = request.headers.get('Cookie') || '';
      const m = cookieHeader.match(/session_refresh=([^;]+)/);
      if (!m) {
        const r = errorResponse('Unauthorized', 401);
        r.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        r.headers.set('Pragma', 'no-cache');
        r.headers.set('Expires', '0');
        r.headers.set('Vary', 'Authorization, Cookie');
        return r;
      }
      const raw = decodeURIComponent(m[1]);
      const session = await findSessionByRefreshToken(db, raw);
      if (!session || session.revoked_at || new Date(session.expires_at).getTime() < Date.now()) {
        const r = errorResponse('Unauthorized', 401);
        r.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        r.headers.set('Pragma', 'no-cache');
        r.headers.set('Expires', '0');
        r.headers.set('Vary', 'Authorization, Cookie');
        return r;
      }
      const cust = await executeOne<{ email: string }>(db, 'SELECT email FROM customers WHERE id = ?', [session.user_id]);
      const access = signToken({ id: session.user_id, email: cust?.email || '', type: 'customer' }, jwtSecret, '15m');
      const rotate = crypto.randomUUID() + '.' + crypto.randomUUID();
      const rotateHash = await hashRefreshToken(rotate);
      await executeRun(db, 'UPDATE user_sessions SET refresh_token_hash = ?, updated_at = datetime("now") WHERE id = ?', [rotateHash, session.id]);
      const requestHostname = url.hostname;
      let cookieDomain = '';
      let sameSite: 'Lax' | 'None' = 'Lax';
      if (requestHostname.includes('leiasabores.pt')) {
        cookieDomain = 'Domain=.leiasabores.pt; ';
        sameSite = 'Lax';
      } else if (requestHostname.includes('workers.dev')) {
        cookieDomain = '';
        sameSite = 'None';
      } else {
        cookieDomain = `Domain=${requestHostname}; `;
      }
      const res = successResponse({ refreshed: true, token: access });
      res.headers.set('Set-Cookie', `session_access=${access}; Path=/; ${cookieDomain}HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${15 * 60}`);
      res.headers.append('Set-Cookie', `session_refresh=${encodeURIComponent(rotate)}; Path=/; ${cookieDomain}HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${60 * 24 * 60 * 60}`);
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.headers.set('Pragma', 'no-cache');
      res.headers.set('Expires', '0');
      res.headers.set('Vary', 'Authorization, Cookie');
      return res;
    }

    // Me: GET /api/auth/me
    if (method === 'GET' && path === '/api/auth/me') {
      let token: string | null = null;
      let fromAuthHeader = false;

      // Ler cookies (admin_token e session_access)
      let cookieToken: string | null = null;
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        let adminTokenCookie: string | null = null;
        let sessionAccessCookie: string | null = null;
        for (const cookie of cookies) {
          const eqIdx = cookie.indexOf('=');
          if (eqIdx === -1) continue;
          const key = cookie.substring(0, eqIdx).trim();
          const value = cookie.substring(eqIdx + 1);
          if (key === 'admin_token') adminTokenCookie = decodeURIComponent(value);
          else if (key === 'session_access') sessionAccessCookie = decodeURIComponent(value);
        }
        cookieToken = adminTokenCookie || sessionAccessCookie;
      }

      // Authorization header tem prioridade, mas se o token estiver expirado
      // fazemos fallback para o cookie (que pode ter sido renovado via refresh)
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        fromAuthHeader = true;
      } else {
        token = cookieToken;
      }

      if (!token) {
        return errorResponse('Not authenticated', 401);
      }

      try {
        const { verifyToken } = await import('../../utils/jwt');
        let payload;
        try {
          payload = verifyToken(token, jwtSecret);
        } catch (tokenErr: any) {
          // Se o token do Authorization header estiver expirado, tenta o cookie
          if (tokenErr.code === 'TOKEN_EXPIRED' && fromAuthHeader && cookieToken && cookieToken !== token) {
            try {
              payload = verifyToken(cookieToken, jwtSecret);
            } catch {
              const r = errorResponse('Not authenticated', 401);
              r.headers.set('Cache-Control', 'no-store');
              return r;
            }
          } else {
            throw tokenErr;
          }
        }

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

          const renewedAccess = signToken(
            { id: customer.id, email: customer.email, type: 'customer' },
            jwtSecret,
            '15m'
          );

          const res = successResponse({
            user: {
              id: customer.id,
              email: customer.email,
              name,
              type: 'customer' as const,
            },
            type: 'customer',
            token: renewedAccess,
          });
          res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          res.headers.set('Pragma', 'no-cache');
          res.headers.set('Expires', '0');
          res.headers.set('Vary', 'Authorization, Cookie');
          return res;
        } else if (payload.type === 'admin') {
          const admin = await executeOne<{
            id: number;
            email: string;
            name: string | null;
            role: string;
            is_active: number;
          }>(db, 'SELECT id, email, name, role, is_active FROM admins WHERE id = ?', [payload.id]);

          if (!admin || admin.is_active === 0) {
            return errorResponse('Invalid token', 401);
          }

          const renewedAccess = signToken(
            { id: admin.id, email: admin.email, type: 'admin', role: admin.role as any },
            jwtSecret,
            '15m'
          );

          // Build name from email if name is null
          const adminName = admin.name || admin.email.split('@')[0];

          const res = successResponse({
            user: {
              id: admin.id,
              email: admin.email,
              name: adminName,
              role: admin.role,
              type: 'admin' as const,
            },
            type: 'admin',
            token: renewedAccess
          });
          res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          res.headers.set('Pragma', 'no-cache');
          res.headers.set('Expires', '0');
          res.headers.set('Vary', 'Authorization, Cookie');
          return res;
        }
      } catch (error) {
        const res = errorResponse('Invalid token', 401);
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.headers.set('Pragma', 'no-cache');
        res.headers.set('Expires', '0');
        res.headers.set('Vary', 'Authorization, Cookie');
        return res;
      }
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

type SessionRecord = {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

async function findSessionByRefreshToken(db: ReturnType<typeof getDb>, rawToken: string): Promise<SessionRecord | null> {
  const hashed = await hashRefreshToken(rawToken);
  const session = await executeOne<SessionRecord>(
    db,
    'SELECT id, user_id, refresh_token_hash, expires_at, revoked_at FROM user_sessions WHERE refresh_token_hash = ?',
    [hashed]
  );
  if (session) {
    return session;
  }

  const legacySessions = await executeQuery<SessionRecord>(
    db,
    'SELECT id, user_id, refresh_token_hash, expires_at, revoked_at FROM user_sessions WHERE refresh_token_hash LIKE "$2%" AND revoked_at IS NULL ORDER BY id DESC LIMIT 200'
  );

  for (const legacy of legacySessions) {
    if (legacy.refresh_token_hash && await compareRefreshTokenHash(rawToken, legacy.refresh_token_hash)) {
      return legacy;
    }
  }

  return null;
}
