import { LIMITS } from '../config/limits';

/**
 * RATE LIMITER usando Cloudflare KV
 * 
 * Implementa Token Bucket Algorithm com sliding window
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  identifier: string; // IP, user_id, etc
}

/**
 * Gera chave única para o bucket
 */
function getBucketKey(identifier: string, type: 'ip' | 'customer' | 'admin' | 'critical'): string {
  return `ratelimit:${type}:${identifier}`;
}

/**
 * Verifica rate limit usando KV
 */
export async function checkRateLimit(
  kv: KVNamespace,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, identifier } = config;
  const key = getBucketKey(identifier, 'ip'); // Ajustar conforme tipo
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Buscar estado atual do bucket
    const data = await kv.get<{
      count: number;
      resetTime: number;
      requests: number[]; // Timestamps das requisições
    }>(key, 'json');

    let requests: number[] = [];
    let count = 0;

    if (data) {
      // Filtrar requisições antigas (fora da janela)
      requests = data.requests.filter(timestamp => timestamp > windowStart);
      count = requests.length;
    }

    // Verificar se excedeu o limite
    if (count >= maxRequests) {
      const oldestRequest = requests[0];
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000); // segundos

      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequest + windowMs,
        retryAfter,
      };
    }

    // Adicionar requisição atual
    requests.push(now);
    count++;

    // Salvar no KV com TTL
    await kv.put(
      key,
      JSON.stringify({
        count,
        resetTime: now + windowMs,
        requests,
      }),
      {
        expirationTtl: Math.ceil(windowMs / 1000) + 60, // TTL em segundos + buffer
      }
    );

    return {
      allowed: true,
      remaining: maxRequests - count,
      resetTime: now + windowMs,
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking rate limit:', error);
    // Em caso de erro, permitir a requisição (fail open)
    // Em produção, considere fail closed para segurança
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: now + windowMs,
    };
  }
}

/**
 * Middleware de rate limiting para Workers
 */
export async function rateLimitMiddleware(
  request: Request,
  env: any,
  type: 'ip' | 'customer' | 'admin' | 'critical' = 'ip'
): Promise<Response | null> {
  // Identificador baseado no tipo
  let identifier: string;
  let limits: { windowMs: number; maxRequests: number };

  switch (type) {
    case 'ip':
      identifier = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
      limits = {
        windowMs: LIMITS.RATE_LIMIT.IP.WINDOW_MS,
        maxRequests: LIMITS.RATE_LIMIT.IP.MAX_REQUESTS,
      };
      break;

    case 'customer':
      // Extrair customer_id do JWT
      const customerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!customerToken) {
        // Fallback para IP
        return rateLimitMiddleware(request, env, 'ip');
      }
      // TODO: Decodificar JWT para pegar ID
      identifier = `customer:${customerToken.substring(0, 20)}`; // Placeholder
      limits = {
        windowMs: LIMITS.RATE_LIMIT.CUSTOMER.WINDOW_MS,
        maxRequests: LIMITS.RATE_LIMIT.CUSTOMER.MAX_REQUESTS,
      };
      break;

    case 'admin':
      const adminToken = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!adminToken) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      identifier = `admin:${adminToken.substring(0, 20)}`;
      limits = {
        windowMs: LIMITS.RATE_LIMIT.ADMIN.WINDOW_MS,
        maxRequests: LIMITS.RATE_LIMIT.ADMIN.MAX_REQUESTS,
      };
      break;

    case 'critical':
      identifier = request.headers.get('CF-Connecting-IP') || 'unknown';
      limits = {
        windowMs: LIMITS.RATE_LIMIT.CRITICAL.WINDOW_MS,
        maxRequests: LIMITS.RATE_LIMIT.CRITICAL.MAX_REQUESTS,
      };
      break;

    default:
      limits = {
        windowMs: LIMITS.RATE_LIMIT.IP.WINDOW_MS,
        maxRequests: LIMITS.RATE_LIMIT.IP.MAX_REQUESTS,
      };
      identifier = 'unknown';
  }

  // Verificar rate limit
  const result = await checkRateLimit(env.RATE_LIMIT_KV, {
    windowMs: limits.windowMs,
    maxRequests: limits.maxRequests,
    identifier,
  });

  // Adicionar headers de rate limit
  const headers = {
    'X-RateLimit-Limit': limits.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  if (!result.allowed) {
    console.warn(`[RATE_LIMIT] Rate limit exceeded for ${type}: ${identifier}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '60',
          ...headers,
        },
      }
    );
  }

  // Anexar headers de rate limit à resposta futura
  // (o router deve adicionar esses headers)
  (request as any).__rateLimitHeaders = headers;

  return null; // Permitir requisição
}

/**
 * Helper para adicionar headers de rate limit à resposta
 */
export function addRateLimitHeaders(response: Response, request: Request): Response {
  const headers = (request as any).__rateLimitHeaders;
  if (!headers) return response;

  const newHeaders = new Headers(response.headers);
  Object.entries(headers).forEach(([key, value]) => {
    newHeaders.set(key, value as string);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

