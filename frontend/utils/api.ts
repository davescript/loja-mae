import type { ApiResponse } from '@shared/types';
import { ApiError, NetworkError, AuthenticationError, handleError as handleApiError } from './errorHandler';

// Get API base URL from environment or use default
// In production, this should be set in Cloudflare Pages environment variables
const getApiBaseUrl = (): string => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return 'http://localhost:8787';
  }
  // Force local API in development ONLY if explicitly set
  // Otherwise use production API even in dev mode
  const forceLocal = (import.meta as any).env?.VITE_FORCE_LOCAL_API === 'true';
  if (forceLocal && (import.meta as any).env?.DEV) {
    return 'http://localhost:8787';
  }

  // On the real production domain, always talk to api.leiasabores.pt — this must win
  // over VITE_API_BASE_URL, which is a CI-time secret that silently falls back to the
  // workers.dev URL when unset. Calling workers.dev from leiasabores.pt turns the auth
  // cookies into third-party cookies, which Safari/iOS (and increasingly Chrome) block,
  // breaking login persistence for anyone on that domain.
  const hostname = window.location.hostname;
  if (hostname.includes('leiasabores.pt')) {
    return 'https://api.leiasabores.pt';
  }

  // Try to get from environment variable (set at build time) for other environments
  const envUrl = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  // Default fallback (e.g. pages.dev preview deployments)
  return 'https://loja-mae-api.davecdl.workers.dev';
};

export const API_BASE_URL = getApiBaseUrl();

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Determine which token to use based on the endpoint
    // Customer endpoints should NEVER use admin_token
    const isAdminEndpoint = endpoint.startsWith('/api/admin/');
    const isCustomerDetailEndpoint = /^\/api\/customers\/\d+/.test(endpoint);
    const isCustomerSelfEndpoint =
      endpoint.startsWith('/api/customers/me') ||
      endpoint.startsWith('/api/customers/addresses') ||
      endpoint.startsWith('/api/customers/orders') ||
      endpoint.startsWith('/api/customers/payments') ||
      endpoint.startsWith('/api/customers/stats') ||
      endpoint.startsWith('/api/customers/notifications') ||
      endpoint.startsWith('/api/customers/support');
    const isCheckoutEndpoint = endpoint.startsWith('/api/stripe/create-intent');
    const isAuthLoginEndpoint = endpoint === '/api/auth/admin/login' || endpoint === '/api/auth/login';
    const isAuthMeEndpoint = endpoint.startsWith('/api/auth/me');
    const isCustomerEndpoint = isCustomerSelfEndpoint || endpoint.startsWith('/api/favorites') || isCheckoutEndpoint || endpoint.startsWith('/api/cart');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin_token');
      const customerToken = localStorage.getItem('customer_token') || localStorage.getItem('token');

      // Log para debug em desenvolvimento
      if (import.meta.env.DEV && isCustomerEndpoint) {
        console.log(`[API] Tokens disponíveis para ${endpoint}:`, {
          hasAdminToken: !!adminToken,
          hasCustomerToken: !!customerToken,
          customerTokenLength: customerToken?.length || 0,
        });
      }

      if (isAdminEndpoint) {
        // Admin endpoints: use admin_token only
        token = adminToken;
      } else if (isAuthMeEndpoint) {
        // /api/auth/me precisa identificar admin primeiro
        token = adminToken || customerToken;
      } else if (isCustomerDetailEndpoint) {
        // Admin detail endpoints (e.g., /api/customers/:id) should prefer admin token
        token = adminToken || customerToken;
      } else if (isCustomerEndpoint) {
        // Customer self-service endpoints devem usar somente token do cliente
        token = customerToken;
        if (!token && import.meta.env.DEV) {
          console.warn(`[API] ⚠️ Endpoint de customer (${endpoint}) sem token no localStorage!`);
        }
      } else if (endpoint.startsWith('/api/orders')) {
        // Orders endpoints: use admin token when available (for admin panel)
        // Use customer token only for customer self-service
        token = adminToken || customerToken;
      } else {
        // Other endpoints (auth, products, etc)
        // Prefer customer token when available to avoid admin context em checkout
        token = customerToken || adminToken;
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const shouldAttachAuthHeader =
      !!token &&
      !isAuthLoginEndpoint &&
      (isAdminEndpoint ||
        isCustomerDetailEndpoint ||
        endpoint.startsWith('/api/customers') ||
        endpoint.startsWith('/api/orders') ||
        isAuthMeEndpoint);

    if (shouldAttachAuthHeader && token) {
      headers['Authorization'] = `Bearer ${token}`;
      if (import.meta.env.DEV) {
        console.log(`[API] Request para ${endpoint} com token`, { 
          endpoint, 
          hasToken: !!token, 
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...'
        });
      }
    } else if (isCustomerEndpoint && !token) {
      // Log warning se endpoint de customer não tiver token
      console.warn(`[API] ⚠️ Endpoint de customer sem token: ${endpoint}`);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('API Request:', url, { hasToken: !!token, isCustomerEndpoint });
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as ApiResponse<T>;
      
      // Handle specific status codes
      if (response.status === 401) {
        console.warn(`[API] 401 Unauthorized para ${endpoint}. Tentando refresh...`);
        
        // NÃO limpar tokens imediatamente - pode ser um problema temporário de cookie
        // O token pode ainda ser válido, apenas os cookies podem estar faltando
        // Vamos tentar refresh primeiro antes de limpar
        console.warn(`[API] 401 Unauthorized - mantendo token para tentar refresh`);
        
        // Tentar refresh uma vez (apenas para customer, admin não tem refresh)
        // O refresh funciona via cookies, então se não houver cookie, não funcionará
        if (isCustomerEndpoint || isAuthMeEndpoint) {
          try {
            console.log('[API] Tentando refresh do token via cookie...');
            const refreshResp = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Cache-Control': 'no-store' }
            });

            if (refreshResp.ok) {
              const refreshData = await refreshResp.json().catch(() => ({})) as ApiResponse<{ token?: string; refreshed?: boolean }>;

              // Guardar o novo token no localStorage e actualizar o header
              if (refreshData.data?.token && typeof window !== 'undefined') {
                localStorage.setItem('customer_token', refreshData.data.token);
                headers['Authorization'] = `Bearer ${refreshData.data.token}`;
              } else {
                // Sem token no body — remover header expirado para o backend usar o cookie
                delete headers['Authorization'];
              }

              // Retry com token actualizado (ou sem header, usando cookie renovado)
              response = await fetch(url, { ...options, headers, credentials: 'include' });
              if (response.ok) {
                return await response.json() as ApiResponse<T>;
              }
            } else {
              console.warn('[API] Refresh falhou:', refreshResp.status);
              // Se o refresh falhou com 401 ou 403, limpa o token local pois a sessão expirou mesmo
              if (refreshResp.status === 401 || refreshResp.status === 403) {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('customer_token');
                  localStorage.removeItem('token');
                }
              }
            }
          } catch (refreshError) {
            console.error('[API] Erro ao fazer refresh:', refreshError);
          }
        }
        
        // Se chegou aqui, refresh falhou ou não foi possível
        throw new AuthenticationError(data.error || 'Não autenticado. Por favor, faça login novamente.');
      }
      
      if (response.status === 403) {
        throw new ApiError(data.error || 'Sem permissão', 403, 'FORBIDDEN');
      }
      
      if (response.status === 422) {
        throw new ApiError(data.error || 'Dados inválidos', 422, 'VALIDATION_ERROR', data);
      }
      
      throw new ApiError(
        data.error || `Erro HTTP ${response.status}`,
        response.status,
        (data as any).code
      );
    }

    const data = await response.json() as ApiResponse<T>;
    return data;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof ApiError || error instanceof AuthenticationError || error instanceof NetworkError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Erro de conexão com o servidor');
    }
    
    console.error('API Request failed:', error);
    throw error;
  }
}

export async function apiFormData<T = any>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Admin token takes priority, then customer token, then regular token
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('admin_token') || localStorage.getItem('customer_token') || localStorage.getItem('token')
    : null;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    // Log warning in development if no token found
    if (import.meta.env.DEV) {
      console.warn('No authentication token found for FormData request:', endpoint);
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  // Only log in development
  if (import.meta.env.DEV) {
    console.log('API FormData Request:', url, { hasToken: !!token });
  }

  const response = await fetch(url, {
    ...options,
    method: options.method || 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as ApiResponse<T>;
    
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('customer_token');
        localStorage.removeItem('token');
      }
      throw new AuthenticationError(errorData.error || 'Não autenticado');
    }
    
    if (response.status === 403) {
      throw new ApiError(errorData.error || 'Sem permissão', 403, 'FORBIDDEN');
    }
    
    if (response.status === 422) {
      throw new ApiError(errorData.error || 'Dados inválidos', 422, 'VALIDATION_ERROR', errorData);
    }
    
    throw new ApiError(
      errorData.error || `Erro HTTP ${response.status}`,
      response.status,
      (errorData as any).code
    );
  }

  return response.json() as Promise<ApiResponse<T>>;
}
