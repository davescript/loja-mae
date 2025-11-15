/**
 * CSRF Protection utilities
 * 
 * Note: Cloudflare Workers doesn't support traditional CSRF tokens in the same way
 * as server-side applications. We use SameSite cookies and Origin verification instead.
 */

export function verifyOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  
  // Lista padrão de origens permitidas (mesma do CORS)
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://www.leiasabores.pt',
    'https://leiasabores.pt',
    'https://loja-mae.pages.dev',
  ];
  
  // Combinar origens padrão com as do env
  const allAllowedOrigins = [...defaultOrigins, ...allowedOrigins];
  
  // Função auxiliar para verificar se uma origem é permitida
  const isOriginAllowed = (checkOrigin: string): boolean => {
    if (!checkOrigin) return false;
    
    return allAllowedOrigins.some(allowed => {
      const trimmed = allowed.trim();
      
      // Wildcard completo
      if (trimmed === '*') return true;
      
      // Match exato
      if (checkOrigin === trimmed) return true;
      
      // Wildcard pattern (ex: https://*.loja-mae.pages.dev)
      if (trimmed.includes('*')) {
        const pattern = trimmed.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(checkOrigin);
      }
      
      // Verificar se a origem contém o domínio (para www e não-www)
      const domainWithoutWww = trimmed.replace(/^https?:\/\/(www\.)?/, '');
      const checkDomainWithoutWww = checkOrigin.replace(/^https?:\/\/(www\.)?/, '');
      if (checkDomainWithoutWww === domainWithoutWww) return true;
      
      // Fallback: includes
      return checkOrigin.includes(domainWithoutWww);
    });
  };
  
  // Verificar Origin header primeiro
  if (origin) {
    if (isOriginAllowed(origin)) {
      return true;
    }
  }
  
  // Se não houver Origin ou não foi permitido, verificar Referer
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (isOriginAllowed(refererOrigin)) {
        return true;
      }
    } catch {
      // URL inválida, continuar
    }
  }
  
  // Se não houver Origin nem Referer, pode ser same-origin request
  // Nesse caso, verificar se a requisição vem de um domínio permitido via Host header
  const host = request.headers.get('Host');
  if (host) {
    // Para same-origin, verificar se o host está na lista
    const hostOrigin = `https://${host}`;
    if (isOriginAllowed(hostOrigin)) {
      return true;
    }
  }
  
  // Fallback: permitir se não houver Origin nem Referer (pode ser same-origin)
  // Mas apenas se não for uma requisição cross-origin explícita
  if (!origin && !referer) {
    // Log para debug
    console.log('[CSRF] Sem Origin nem Referer, permitindo (same-origin possível)');
    return true;
  }
  
  return false;
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
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map((o: string) => o.trim()) || [];
  
  // Verify origin
  const isValid = verifyOrigin(request, allowedOrigins);
  
  if (!isValid) {
    const origin = request.headers.get('Origin') || 'N/A';
    const referer = request.headers.get('Referer') || 'N/A';
    console.log('[CSRF] Verificação falhou:', {
      origin,
      referer,
      method: request.method,
      url: request.url,
      allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : 'usando padrões',
    });
  }
  
  return isValid;
}

