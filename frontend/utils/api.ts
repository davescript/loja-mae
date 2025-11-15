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
  
  // Try to get from environment variable (set at build time)
  const envUrl = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback: use current origin for API (assuming API is on same domain)
  // Or use production API URL as fallback
  const hostname = window.location.hostname;
  
  // If on custom domain, assume API is on api subdomain
  if (hostname.includes('leiasabores.pt')) {
    return 'https://api.leiasabores.pt';
  }
  
  // If on pages.dev, use workers.dev API
  if (hostname.includes('pages.dev')) {
    return 'https://loja-mae-api.davecdl.workers.dev';
  }
  
  // Default fallback (production)
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
    const isCustomerEndpoint = isCustomerSelfEndpoint || endpoint.startsWith('/api/favorites') || isCheckoutEndpoint;
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin_token');
      const customerToken = localStorage.getItem('customer_token') || localStorage.getItem('token');

      if (isAdminEndpoint) {
        // Admin endpoints: use admin_token only
        token = adminToken;
      } else if (isCustomerDetailEndpoint) {
        // Admin detail endpoints (e.g., /api/customers/:id) should prefer admin token
        token = adminToken || customerToken;
      } else if (isCustomerEndpoint) {
        // Customer self-service endpoints devem usar somente token do cliente
        token = customerToken;
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
        endpoint.startsWith('/api/orders'));

    if (shouldAttachAuthHeader && token) {
      headers['Authorization'] = `Bearer ${token}`;
      if (import.meta.env.DEV) console.log(`[API] Admin request para ${endpoint} com token`);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('API Request:', url, { hasToken: !!token });
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
        // Tentar refresh uma vez
        const refreshResp = await fetch(`${API_BASE_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include', headers: { 'Cache-Control': 'no-store' } })
        if (refreshResp.ok) {
          response = await fetch(url, { ...options, headers, credentials: 'include' })
          if (!response.ok) {
            const d2 = await response.json().catch(() => ({})) as ApiResponse<T>
            throw new AuthenticationError(d2.error || 'Não autenticado')
          }
        } else {
          throw new AuthenticationError(data.error || 'Não autenticado')
        }
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
