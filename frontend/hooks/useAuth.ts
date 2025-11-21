import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';
import type { AuthUser } from '@shared/types';

const clearClientStores = () => {
  if (typeof window === 'undefined') return;

  try {
    const { useFavoritesStore } = require('../store/favoritesStore');
    const favoritesStore = useFavoritesStore.getState();
    favoritesStore.clearFavorites();
    localStorage.removeItem('loja-mae-favorites');
    console.log('[AUTH] Favoritos limpos após logout');
  } catch (error) {
    console.error('[AUTH] Falha ao limpar favoritos no logout:', error);
  }

  try {
    const { useCartStore } = require('../store/cartStore');
    const cartStore = useCartStore.getState();
    cartStore.clearCart();
    localStorage.removeItem('loja-mae-cart');
    console.log('[AUTH] Carrinho limpo após logout');
  } catch (error) {
    console.error('[AUTH] Falha ao limpar carrinho no logout:', error);
  }
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);

  // Estado para controlar se devemos verificar autenticação (desabilitar após logout)
  const [shouldCheckAuth, setShouldCheckAuth] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        console.log('[AUTH] Verificando autenticação via cookies...');
        
        // Usar credentials: 'include' para enviar cookies
        const response = await apiRequest<{ user: AuthUser; type: string }>('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.success && response.data) {
          console.log('[AUTH] Autenticação bem-sucedida:', response.data.user.email);
          setUser(response.data.user);
          return response.data;
        }
        
        console.warn('[AUTH] Resposta não foi sucesso');
        setUser(null);
        return null;
      } catch (error: any) {
        const errorMessage = error?.message || '';
        console.error('[AUTH] Erro ao verificar autenticação:', errorMessage);
        
        // Se for erro 401, usuário não está autenticado
        if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('Not authenticated')) {
          console.log('[AUTH] Usuário não autenticado');
          setUser(null);
        }
        
        return null;
      }
    },
    retry: false,
    staleTime: 0, // Sempre refetch para verificar cookies atualizados
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: typeof window !== 'undefined' && shouldCheckAuth, // Desabilitar após logout
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest<{ customer: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        credentials: 'include', // Importante: enviar cookies
      });
      if (response.success && response.data) {
        // Cookies HttpOnly serão definidos pela API
        // Também salvar token no localStorage para requisições cross-origin
        if ((response.data as any).token) {
          localStorage.setItem('customer_token', (response.data as any).token);
        }
        // Aguardar um pouco para garantir que cookies foram definidos
        await new Promise(resolve => setTimeout(resolve, 100));
        setUser(response.data.customer as any);
        return response.data as any;
      }
      throw new Error(response.error || 'Login failed');
    },
    onSuccess: async () => {
      // Reabilitar verificação de autenticação
      setShouldCheckAuth(true);
      
      // Invalidar e refetch imediatamente após login
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Forçar refetch para verificar autenticação via cookies
      await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
      try {
        // Sincronizar favoritos locais com servidor após login
        const { useFavoritesStore } = require('../store/favoritesStore');
        const store = useFavoritesStore.getState();
        // Carregar do servidor e fazer merge
        store.syncWithServer();
      } catch {}
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; first_name?: string; last_name?: string }) => {
      const response = await apiRequest<{ customer: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.success && response.data) {
        // Salvar token no localStorage para requisições cross-origin
        if ((response.data as any).token) {
          localStorage.setItem('customer_token', (response.data as any).token);
        }
        setUser(response.data.customer as any);
        return response.data as any;
      }
      throw new Error(response.error || 'Registration failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      try {
        const { useFavoritesStore } = require('../store/favoritesStore');
        useFavoritesStore.getState().syncWithServer();
      } catch {}
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Aguardar um pouco para garantir que qualquer operação pendente seja concluída
      // Isso garante que endereços sejam salvos antes do logout
      await new Promise(resolve => setTimeout(resolve, 500));
      await apiRequest('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include', // Importante: enviar cookies para serem removidos
      });
    },
    onSuccess: async () => {
      console.log('[AUTH] Logout bem-sucedido, limpando estado...');
      
      // Desabilitar verificação de autenticação
      setShouldCheckAuth(false);
      
      // Limpar tokens e estado local PRIMEIRO
      localStorage.removeItem('token');
      localStorage.removeItem('customer_token');
      setUser(null);
      clearClientStores();
      
      // Limpar todas as queries do cache
      queryClient.clear();
      
      // Invalidar queries específicas de favoritos e carrinho
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.removeQueries({ queryKey: ['favorites'] });
      
      // Invalidar e cancelar a query de autenticação para evitar refetch
      queryClient.cancelQueries({ queryKey: ['auth', 'me'] });
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      
      // Redirecionar para a home após logout (recarregar página para garantir limpeza)
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    },
    onError: async (error) => {
      console.error('[AUTH] Erro no logout:', error);
      // Desabilitar verificação de autenticação
      setShouldCheckAuth(false);
      
      // Mesmo com erro, limpar estado local e redirecionar
      localStorage.removeItem('token');
      localStorage.removeItem('customer_token');
      setUser(null);
      clearClientStores();
      queryClient.clear();
      
      // Invalidar queries específicas de favoritos e carrinho
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.removeQueries({ queryKey: ['favorites'] });
      
      queryClient.cancelQueries({ queryKey: ['auth', 'me'] });
      queryClient.setQueryData(['auth', 'me'], null);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
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
    isLoggingOut: logoutMutation.isPending,
  };
}
