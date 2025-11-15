export function handleCORS(response: Response, env: any, request?: Request): Response {
  // Lista padrão + env
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://www.leiasabores.pt',
    'https://leiasabores.pt',
    'https://loja-mae.pages.dev',
  ];
  
  const envOrigins = env.ALLOWED_ORIGINS?.split(',').map((o: string) => o.trim()) || [];
  const allowedOrigins = [...defaultOrigins, ...envOrigins];
  
  // Get origin from request
  const origin = request?.headers.get('Origin') || '';

  // Check if origin is allowed (suporta wildcards)
  const isAllowed = origin && allowedOrigins.some((allowed: string) => {
    const trimmed = allowed.trim();
    
    // Wildcard completo
    if (trimmed === '*') return true;
    
    // Match exato
    if (origin === trimmed) return true;
    
    // Wildcard pattern (ex: https://*.loja-mae.pages.dev)
    if (trimmed.includes('*')) {
      const pattern = trimmed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    
    // Fallback: includes (para dominios similares)
    return origin.includes(trimmed.replace('www.', ''));
  });

  const headers = new Headers(response.headers);
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    headers.set('Access-Control-Allow-Origin', '*');
  } else {
    // Por padrão, permitir Pages do Cloudflare se não houver match
    if (origin.includes('.pages.dev') || origin.includes('leiasabores.pt')) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin'); // Importante para cache correto

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
