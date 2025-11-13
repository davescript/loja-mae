import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';
import type { AuthUser } from '@shared/types';

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);

  // Check if token exists on mount to enable query
  const hasToken = typeof window !== 'undefined' && 
    (localStorage.getItem('token') || localStorage.getItem('customer_token'));

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
        console.log('[AUTH] Verificando autenticação, token:', token ? token.substring(0, 20) + '...' : 'NENHUM');
        
        const response = await apiRequest<{ user: AuthUser; type: string }>('/api/auth/me');
        if (response.success && response.data) {
          console.log('[AUTH] Autenticação bem-sucedida:', response.data.user.email);
          setUser(response.data.user);
          return response.data;
        }
        // NÃO limpar tokens automaticamente - apenas quando o usuário clicar em "Sair"
        // Preservar sessão mesmo se a resposta não for sucesso
        console.warn('[AUTH] Resposta não foi sucesso, mas preservando token');
        setUser(null);
        return null;
      } catch (error: any) {
        // NUNCA limpar tokens automaticamente - apenas quando o usuário clicar em "Sair"
        // Isso preserva a sessão mesmo em caso de erro de rede ou hard refresh
        const errorMessage = error?.message || '';
        console.error('[AUTH] Erro ao verificar autenticação:', errorMessage);
        
        if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('Invalid or expired token')) {
          // Token pode estar inválido, mas não limpar automaticamente
          // Deixar o usuário decidir quando fazer logout
          console.warn('[AUTH] Token pode estar inválido, mas preservando para o usuário decidir');
        } else {
          // Não limpar tokens em caso de erro de rede ou outros erros temporários
          console.warn('[AUTH] Erro temporário, preservando token');
        }
        // Não limpar tokens - preservar sessão
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    enabled: typeof window !== 'undefined' && !!hasToken, // Only run if token exists
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest<{ customer: AuthUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (response.success && response.data) {
        // Save token for customer
        localStorage.setItem('customer_token', response.data.token);
        localStorage.setItem('token', response.data.token); // Also save as token for compatibility
        setUser(response.data.customer);
        return response.data;
      }
      throw new Error(response.error || 'Login failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; first_name?: string; last_name?: string }) => {
      const response = await apiRequest<{ customer: AuthUser; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.success && response.data) {
        // Save token for customer
        localStorage.setItem('customer_token', response.data.token);
        localStorage.setItem('token', response.data.token); // Also save as token for compatibility
        setUser(response.data.customer);
        return response.data;
      }
      throw new Error(response.error || 'Registration failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Aguardar um pouco para garantir que qualquer operação pendente seja concluída
      // Isso garante que endereços sejam salvos antes do logout
      await new Promise(resolve => setTimeout(resolve, 500));
      await apiRequest('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      // Limpar tokens apenas quando o usuário explicitamente clicar em "Sair"
      localStorage.removeItem('token');
      localStorage.removeItem('customer_token');
      setUser(null);
      queryClient.clear();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  // Use data from query if available, otherwise use state
  const currentUser = data?.user || user;
  
  return {
    user: currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login: (credentials: { email: string; password: string }, options?: { onSuccess?: () => void; onError?: (err: Error) => void }) => {
      loginMutation.mutate(credentials, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
        onError: (err: Error) => {
          options?.onError?.(err);
        },
      });
    },
    register: (data: { email: string; password: string; first_name?: string; last_name?: string }, options?: { onSuccess?: () => void; onError?: (err: Error) => void }) => {
      registerMutation.mutate(data, {
        onSuccess: () => {
          options?.onSuccess?.();
        },
        onError: (err: Error) => {
          options?.onError?.(err);
        },
      });
    },
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}

