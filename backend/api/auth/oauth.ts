import type { Env } from '../../types';
import { getDb, executeOne, executeRun } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { createCustomer, getCustomerByEmail } from '../../modules/customers';
import { signToken } from '../../utils/jwt';

export async function handleOAuthRoutes(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const db = getDb(env);
    const jwtSecret = env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // OAuth Initiate: GET /api/auth/oauth/:provider
    if (method === 'GET' && path.match(/^\/api\/auth\/oauth\/(google|apple)$/)) {
      const provider = path.split('/').pop() as 'google' | 'apple';
      const redirect = url.searchParams.get('redirect') || '/account';
      
      // Para Google OAuth
      if (provider === 'google') {
        const clientId = env.GOOGLE_CLIENT_ID;
        if (!clientId) {
          return errorResponse('Google OAuth not configured', 500);
        }

        const redirectUri = `${url.origin}/api/auth/oauth/google/callback`;
        const scope = 'openid email profile';
        const state = Buffer.from(JSON.stringify({ redirect })).toString('base64url');
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(clientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scope)}&` +
          `state=${state}`;

        return Response.redirect(authUrl, 302);
      }

      // Para Apple OAuth
      if (provider === 'apple') {
        const clientId = env.APPLE_CLIENT_ID;
        if (!clientId) {
          return errorResponse('Apple OAuth not configured', 500);
        }

        const redirectUri = `${url.origin}/api/auth/oauth/apple/callback`;
        const state = Buffer.from(JSON.stringify({ redirect })).toString('base64url');
        
        const authUrl = `https://appleid.apple.com/auth/authorize?` +
          `client_id=${encodeURIComponent(clientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=email%20name&` +
          `state=${state}&` +
          `response_mode=form_post`;

        return Response.redirect(authUrl, 302);
      }
    }

    // OAuth Callback: GET /api/auth/oauth/:provider/callback
    if (method === 'GET' && path.match(/^\/api\/auth\/oauth\/(google|apple)\/callback$/)) {
      const provider = path.split('/')[4] as 'google' | 'apple';
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        return errorResponse('Missing code or state', 400);
      }

      let redirect = '/account';
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
        redirect = stateData.redirect || '/account';
      } catch {
        // Usar redirect padrão se state inválido
      }

      let userInfo: { email: string; name?: string; given_name?: string; family_name?: string };

      if (provider === 'google') {
        const clientId = env.GOOGLE_CLIENT_ID;
        const clientSecret = env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return errorResponse('Google OAuth not configured', 500);
        }

        const redirectUri = `${url.origin}/api/auth/oauth/google/callback`;
        
        // Trocar código por token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          return errorResponse('Failed to exchange token', 400);
        }

        const tokens = await tokenResponse.json() as { access_token: string };
        const accessToken = tokens.access_token;

        // Obter informações do usuário
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
          return errorResponse('Failed to get user info', 400);
        }

        userInfo = await userResponse.json();
      } else if (provider === 'apple') {
        // Apple OAuth é mais complexo e requer JWT
        // Por enquanto, retornar erro indicando que precisa ser configurado
        return errorResponse('Apple OAuth requires additional configuration. Please use email/password or Google login.', 501);
      } else {
        return errorResponse('Invalid provider', 400);
      }

      if (!userInfo.email) {
        return errorResponse('Email not provided by OAuth provider', 400);
      }

      // Verificar se cliente já existe
      let customer = await getCustomerByEmail(db, userInfo.email);

      if (!customer) {
        // Criar novo cliente
        const firstName = userInfo.given_name || userInfo.name?.split(' ')[0] || null;
        const lastName = userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || null;

        const newCustomer = await createCustomer(db, {
          email: userInfo.email,
          password: crypto.randomUUID(), // Senha aleatória (não será usada)
          first_name: firstName,
          last_name: lastName,
        });

        // Marcar como OAuth user (sem senha) - se a coluna existir
        try {
          await executeRun(
            db,
            'UPDATE customers SET oauth_provider = ?, password_hash = NULL WHERE id = ?',
            [provider, newCustomer.id]
          );
        } catch {
          // Coluna pode não existir ainda - ignorar
        }

        // Buscar cliente atualizado
        customer = await getCustomerByEmail(db, userInfo.email);
      }

      if (!customer) {
        return errorResponse('Failed to create or find customer', 500);
      }

      // Criar sessão
      const access = signToken({ id: customer.id, email: customer.email, type: 'customer' }, jwtSecret, '15m');
      const refreshRaw = crypto.randomUUID() + '.' + crypto.randomUUID();
      const { hashPassword } = await import('../../utils/auth');
      const refreshHash = await hashPassword(refreshRaw);
      
      await executeRun(
        db,
        'INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          customer.id,
          refreshHash,
          request.headers.get('User-Agent') || '',
          request.headers.get('CF-Connecting-IP') || '',
          new Date().toISOString(),
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        ]
      );

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
        },
        'OAuth login successful'
      );

      // Usar a mesma lógica de cookies do login normal
      const requestHostname = url.hostname;
      let cookieDomain = '';
      let sameSite: 'Lax' | 'None' = 'Lax';
      let secure = true;
      
      if (requestHostname.includes('leiasabores.pt')) {
        cookieDomain = 'Domain=.leiasabores.pt; ';
        sameSite = 'Lax';
      } else if (requestHostname.includes('workers.dev')) {
        cookieDomain = '';
        sameSite = 'None';
        secure = true;
      } else {
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
      
      // Redirecionar para o frontend com cookies
      // Se o redirect for relativo, usar origin do frontend (não do API)
      const frontendOrigin = redirect.startsWith('http') 
        ? redirect 
        : requestHostname.includes('api.') 
          ? `https://www.leiasabores.pt${redirect}`
          : `${url.origin}${redirect}`;
      
      return Response.redirect(frontendOrigin, 302);
    }

    return errorResponse('Not found', 404);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

