import type { ApiResponse } from '@shared/types';

// Get API base URL from environment or use default
// In production, this should be set in Cloudflare Pages environment variables
const getApiBaseUrl = (): string => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return 'http://localhost:8787';
  }
  // Force local API in development to avoid workers.dev fallback
  if ((import.meta as any).env?.DEV) {
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

const API_BASE_URL = getApiBaseUrl();

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('API Request:', url);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      const errorMessage = (errorData as { error?: string }).error || `HTTP error! status: ${response.status}`;
      console.error('API Error:', errorMessage, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export async function apiFormData<T = any>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    method: options.method || 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    const errorMessage = (errorData as { error?: string }).error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}
