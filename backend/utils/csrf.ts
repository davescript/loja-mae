/**
 * CSRF Protection utilities
 * 
 * Note: Cloudflare Workers doesn't support traditional CSRF tokens in the same way
 * as server-side applications. We use SameSite cookies and Origin verification instead.
 */

export function verifyOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('Origin');
  
  if (!origin) {
    // Same-origin requests don't have Origin header
    const referer = request.headers.get('Referer');
    if (!referer) {
      return false;
    }
    // Extract origin from referer
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      return allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        return refererOrigin === allowed || refererOrigin.includes(allowed);
      });
    } catch {
      return false;
    }
  }

  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    return origin === allowed || origin.includes(allowed);
  });
}

export function isSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function shouldVerifyCSRF(request: Request): boolean {
  // Only verify CSRF for state-changing methods
  return !isSafeMethod(request.method);
}

export function verifyCSRF(request: Request, env: any): boolean {
  // Skip CSRF check for safe methods
  if (isSafeMethod(request.method)) {
    return true;
  }

  // Get allowed origins from environment
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];
  
  // Verify origin
  return verifyOrigin(request, allowedOrigins);
}

