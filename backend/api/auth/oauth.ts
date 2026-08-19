import type { Env } from '../../types';
import { getDb, executeOne, executeRun } from '../../utils/db';
import { successResponse, errorResponse } from '../../utils/response';
import { handleError } from '../../utils/errors';
import { createCustomer, getCustomerByEmail } from '../../modules/customers';
import { signToken } from '../../utils/jwt';
import { hashRefreshToken } from '../../utils/auth';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const APPLE_ISSUER = 'https://appleid.apple.com';
const appleJWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

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
    if (method === 'GET' && path.match(/^\/api\/auth\/oauth\/(google|apple|microsoft)$/)) {
      const provider = path.split('/').pop() as 'google' | 'apple' | 'microsoft';
      const redirect = url.searchParams.get('redirect') || '/account';

      // Determine API Origin
      let apiOrigin: string;
      if (url.hostname.includes('leiasabores.pt')) {
        apiOrigin = 'https://api.leiasabores.pt';
      } else if (url.hostname.includes('workers.dev')) {
        apiOrigin = 'https://loja-mae-api.davecdl.workers.dev';
      } else {
        apiOrigin = url.origin;
      }

      // Google OAuth
      if (provider === 'google') {
        const clientId = env.GOOGLE_CLIENT_ID;
        if (!clientId) {
          return new Response(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Configuração Necessária — Google OAuth</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; background: #000; color: #fff; }
                    .glass { 
                        background: rgba(255, 255, 255, 0.03); 
                        backdrop-filter: blur(20px); 
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    }
                    .gradient-text {
                        background: linear-gradient(135deg, #fff 0%, #888 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                </style>
            </head>
            <body class="min-h-screen flex items-center justify-center p-6">
                <div class="glass max-w-2xl w-full rounded-[32px] p-12 text-center">
                    <div class="mb-8 flex justify-center">
                        <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                            <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.97l3.69-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/></svg>
                        </div>
                    </div>
                    <h1 class="text-4xl font-semibold mb-4 gradient-text">Configuração Necessária</h1>
                    <p class="text-gray-400 mb-10 leading-relaxed text-lg">
                        As credenciais do <b>Google OAuth</b> não foram encontradas no ambiente de produção. Para ativar o login com Google, configure os segredos no Cloudflare.
                    </p>
                    
                    <div class="text-left bg-black/40 rounded-2xl p-6 mb-10 border border-white/5 font-mono text-sm overflow-x-auto">
                        <p class="text-emerald-400 mb-2"># Execute estes comandos no seu terminal:</p>
                        <p class="text-white">wrangler secret put GOOGLE_CLIENT_ID --env production</p>
                        <p class="text-white">wrangler secret put GOOGLE_CLIENT_SECRET --env production</p>
                    </div>

                    <a href="/login" class="inline-block bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all active:scale-95">
                        Voltar ao Login
                    </a>
                </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          });
        }

        const redirectUri = `${apiOrigin}/api/auth/oauth/google/callback`;
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

      // Apple OAuth
    if (provider === 'apple') {
      const clientId = env.APPLE_CLIENT_ID;
      if (!clientId) {
        return new Response(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Configuração Necessária — Apple OAuth</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
              <style>
                  body { font-family: 'Inter', sans-serif; background: #000; color: #fff; }
                  .glass { 
                      background: rgba(255, 255, 255, 0.03); 
                      backdrop-filter: blur(20px); 
                      border: 1px solid rgba(255, 255, 255, 0.05);
                      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                  }
                  .gradient-text {
                      background: linear-gradient(135deg, #fff 0%, #888 100%);
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                  }
              </style>
          </head>
          <body class="min-h-screen flex items-center justify-center p-6">
              <div class="glass max-w-2xl w-full rounded-[32px] p-12 text-center">
                  <div class="mb-8 flex justify-center">
                      <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.152 6.896c-.548 0-1.711-.516-2.822-.516-1.463 0-2.827.83-3.587 2.148-1.53 2.659-.39 6.59 1.096 8.73.729 1.045 1.591 2.213 2.718 2.213 1.071 0 1.483-.656 2.774-.656 1.292 0 1.657.656 2.774.656 1.147 0 1.905-1.066 2.612-2.091.817-1.189 1.155-2.34 1.173-2.399-.025-.012-2.252-.865-2.276-3.412-.021-2.13 1.738-3.153 1.815-3.203-1.002-1.464-2.548-1.631-3.09-.656-.051.02-.102.041-.153.064-.017.008-.035.016-.052.024-.548.243-1.011.516-1.011.516s-.463-.273-1.011-.516c-.017-.008-.035-.016-.052-.024-.051-.023-.102-.044-.153-.064zm2.147-3.466c.49-.594.81-1.419.81-2.24 0-.115-.01-.23-.029-.34-.741.03-1.637.494-2.17 1.121-.479.554-.898 1.398-.898 2.21 0 .126.015.25.044.366.822.064 1.644-.413 2.243-1.117z"/></svg>
                      </div>
                  </div>
                  <h1 class="text-4xl font-semibold mb-4 gradient-text">Configuração Necessária</h1>
                  <p class="text-gray-400 mb-10 leading-relaxed text-lg">
                      As credenciais do <b>Apple OAuth</b> não foram encontradas no ambiente de produção. Para ativar o login com Apple, configure os segredos no Cloudflare.
                  </p>
                  
                  <div class="text-left bg-black/40 rounded-2xl p-6 mb-10 border border-white/5 font-mono text-sm overflow-x-auto">
                      <p class="text-emerald-400 mb-2"># Execute estes comandos no seu terminal:</p>
                      <p class="text-white">wrangler secret put APPLE_CLIENT_ID --env production</p>
                      <p class="text-white">wrangler secret put APPLE_TEAM_ID --env production</p>
                      <p class="text-white">wrangler secret put APPLE_KEY_ID --env production</p>
                      <p class="text-white">wrangler secret put APPLE_PRIVATE_KEY --env production</p>
                  </div>

                  <a href="/login" class="inline-block bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all active:scale-95">
                      Voltar ao Login
                  </a>
              </div>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        });
      }

        const redirectUri = `${apiOrigin}/api/auth/oauth/apple/callback`;
        const scope = 'openid email name';
        const state = Buffer.from(JSON.stringify({ redirect })).toString('base64url');

        const authUrl = `https://appleid.apple.com/auth/authorize?` +
          `client_id=${encodeURIComponent(clientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code id_token&` +
          `scope=${encodeURIComponent(scope)}&` +
          `state=${state}&` +
          `response_mode=form_post`;

        return Response.redirect(authUrl, 302);
      }

      // Microsoft OAuth
      if (provider === 'microsoft') {
        const clientId = env.MICROSOFT_CLIENT_ID;
        if (!clientId) return errorResponse('Microsoft OAuth not configured', 500);

        const redirectUri = `${apiOrigin}/api/auth/oauth/microsoft/callback`;
        const scope = 'openid profile email User.Read';
        const state = Buffer.from(JSON.stringify({ redirect })).toString('base64url');

        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${encodeURIComponent(clientId)}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scope)}&` +
          `state=${state}`;

        return Response.redirect(authUrl, 302);
      }
    }

    // OAuth Callback: GET/POST /api/auth/oauth/:provider/callback
    if (path.match(/^\/api\/auth\/oauth\/(google|apple|microsoft)\/callback$/)) {
      const provider = path.split('/')[4] as 'google' | 'apple' | 'microsoft';

      let code: string | null = null;
      let state: string | null = null;
      let idToken: string | null = null;
      let userBody: any = null;

      // Handle GET (Google, Microsoft) and POST (Apple)
      if (method === 'GET') {
        code = url.searchParams.get('code');
        state = url.searchParams.get('state');
      } else if (method === 'POST') {
        const formData = await request.formData();
        code = formData.get('code') as string | null;
        state = formData.get('state') as string | null;
        idToken = formData.get('id_token') as string | null;
        const userStr = formData.get('user') as string | null;
        if (userStr) {
          try {
            userBody = JSON.parse(userStr);
          } catch (e) {
            console.warn('Failed to parse Apple user object', e);
          }
        }
      }

      if (!state) {
        return errorResponse('Missing state', 400);
      }

      let redirect = '/account';
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
        redirect = stateData.redirect || '/account';
      } catch {
        // Use default redirect
      }

      // Determine API Origin (same logic as initiate)
      let apiOrigin: string;
      if (url.hostname.includes('leiasabores.pt')) {
        apiOrigin = 'https://api.leiasabores.pt';
      } else if (url.hostname.includes('workers.dev')) {
        apiOrigin = 'https://loja-mae-api.davecdl.workers.dev';
      } else {
        apiOrigin = url.origin;
      }

      let userInfo: { email: string; name?: string; given_name?: string; family_name?: string } | null = null;

      // Google Callback
      if (provider === 'google') {
        if (!code) return errorResponse('Missing code', 400);
        const clientId = env.GOOGLE_CLIENT_ID;
        const clientSecret = env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) return errorResponse('Google OAuth not configured', 500);

        const redirectUri = `${apiOrigin}/api/auth/oauth/google/callback`;

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

        if (!tokenResponse.ok) return errorResponse('Failed to exchange token', 400);
        const tokens = await tokenResponse.json() as { access_token: string };

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) return errorResponse('Failed to get user info', 400);
        userInfo = await userResponse.json();
      }

      // Apple Callback
      else if (provider === 'apple') {
        if (!idToken) {
          console.error('[AUTH] Apple OAuth Error: Missing id_token in POST body');
          return errorResponse('Missing id_token from Apple', 400);
        }

        const appleClientId = env.APPLE_CLIENT_ID;
        if (!appleClientId) {
          return errorResponse('Apple OAuth not configured', 500);
        }

        // Verify the id_token's signature against Apple's published JWKS — never trust
        // an unverified decode here, since the email claim would otherwise be forgeable.
        try {
          const { payload } = await jwtVerify(idToken, appleJWKS, {
            issuer: APPLE_ISSUER,
            audience: appleClientId,
          });
          const decoded = payload as { email?: string; sub?: string; email_verified?: string | boolean };

          if (!decoded.email) {
            return errorResponse('Invalid id_token: email missing', 400);
          }

          userInfo = {
            email: decoded.email,
          };
        } catch (err: any) {
          console.error('[AUTH] Apple Token Verification Error:', err.message);
          return errorResponse('Failed to verify Apple token', 400);
        }

        // Apple only sends name on first login via 'user' form field
        if (userBody && userBody.name) {
          userInfo.given_name = userBody.name.firstName;
          userInfo.family_name = userBody.name.lastName;
          userInfo.name = `${userBody.name.firstName} ${userBody.name.lastName}`.trim();
        }
      }

      // Microsoft Callback
      else if (provider === 'microsoft') {
        if (!code) return errorResponse('Missing code', 400);
        const clientId = env.MICROSOFT_CLIENT_ID;
        const clientSecret = env.MICROSOFT_CLIENT_SECRET;
        if (!clientId || !clientSecret) return errorResponse('Microsoft OAuth not configured', 500);

        const redirectUri = `${apiOrigin}/api/auth/oauth/microsoft/callback`;

        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            scope: 'openid profile email User.Read',
          }),
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          console.error('Microsoft Token Error:', errText);
          return errorResponse('Failed to exchange token', 400);
        }
        const tokens = await tokenResponse.json() as { access_token: string };

        const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) return errorResponse('Failed to get user info', 400);
        const msUser = await userResponse.json() as { mail?: string; userPrincipalName?: string; displayName?: string; givenName?: string; surname?: string };

        userInfo = {
          email: msUser.mail || msUser.userPrincipalName || '',
          name: msUser.displayName,
          given_name: msUser.givenName,
          family_name: msUser.surname,
        };
      }

      if (!userInfo || !userInfo.email) {
        return errorResponse('Email not provided by OAuth provider', 400);
      }

      // Common Login/Register Logic
      let customer = await getCustomerByEmail(db, userInfo.email);

      if (!customer) {
        // Create new customer
        const firstName = userInfo.given_name || userInfo.name?.split(' ')[0] || null;
        const lastName = userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || null;

        const newCustomer = await createCustomer(db, {
          email: userInfo.email,
          password: crypto.randomUUID(),
          first_name: firstName,
          last_name: lastName,
        });

        try {
          await executeRun(
            db,
            'UPDATE customers SET oauth_provider = ?, password_hash = NULL WHERE id = ?',
            [provider, newCustomer.id]
          );
        } catch {
          // Ignore if column doesn't exist
        }

        customer = await getCustomerByEmail(db, userInfo.email);
      }

      if (!customer) {
        return errorResponse('Failed to create or find customer', 500);
      }

      // Create Session
      const access = signToken({ id: customer.id, email: customer.email, type: 'customer' }, jwtSecret, '7d');
      const refreshRaw = crypto.randomUUID() + '.' + crypto.randomUUID();
      const refreshHash = await hashRefreshToken(refreshRaw);

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

      // Set Cookies
      const requestHostname = url.hostname;
      let cookieDomain = '';
      let sameSite: 'Lax' | 'None' = 'Lax';
      let secure = true;

      if (requestHostname.includes('leiasabores.pt')) {
        cookieDomain = 'Domain=.leiasabores.pt; ';
        sameSite = 'None'; // Usar None para garantir que o cookie seja aceito após o POST do Apple
        secure = true;
      } else if (requestHostname.includes('workers.dev')) {
        cookieDomain = '';
        sameSite = 'None';
        secure = true;
      } else {
        cookieDomain = `Domain=${requestHostname}; `;
      }

      const accessCookie = `session_access=${access}; Path=/; ${cookieDomain}HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=${sameSite}; Max-Age=${7 * 24 * 60 * 60}`;
      const refreshCookie = `session_refresh=${encodeURIComponent(refreshRaw)}; Path=/; ${cookieDomain}HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=${sameSite}; Max-Age=${60 * 24 * 60 * 60}`;

      // Determine Frontend Redirect URL
      const frontendOrigin = redirect.startsWith('http')
        ? redirect
        : requestHostname.includes('api.') || requestHostname.includes('workers.dev')
          ? `https://www.leiasabores.pt${redirect}`
          : `${url.origin}${redirect}`;

      const redirectResponse = new Response(null, {
        status: 302,
        headers: {
          Location: frontendOrigin,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
          Vary: 'Authorization, Cookie',
        },
      });
      redirectResponse.headers.append('Set-Cookie', accessCookie);
      redirectResponse.headers.append('Set-Cookie', refreshCookie);

      return redirectResponse;
    }

    return errorResponse('Not found', 404);
  } catch (error) {
    const { message, status, details } = handleError(error);
    return errorResponse(message, status, details);
  }
}

