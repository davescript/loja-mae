export function handleCORS(response: Response, env: any, request?: Request): Response {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'];
  
  // Get origin from request, not response
  const origin = request?.headers.get('Origin') || '';

  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.some((allowed: string) => {
    const trimmed = allowed.trim();
    return trimmed === '*' || origin === trimmed || origin.includes(trimmed);
  });

  const headers = new Headers(response.headers);
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
