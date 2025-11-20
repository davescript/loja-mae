import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { handleError } from '../utils/errorHandler';
import { useToast } from '../admin/hooks/useToast';

type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type LoginCredentials = {
  email: string;
  password: string;
};

export function useAdminAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [shouldCheckAuth, setShouldCheckAuth] = useState(true);

  // Check if admin is authenticated
  const { data: adminData, isLoading } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      try {
        console.log('[ADMIN_AUTH] Verificando autenticação...');
        const response = await apiRequest<{ user: AdminUser; type: 'admin' }>('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.data?.type === 'admin' && response.data?.user) {
          console.log('[ADMIN_AUTH] Admin autenticado:', response.data.user.email);
          setAdminUser(response.data.user);
          return response.data.user;
        }
        
        console.warn('[ADMIN_AUTH] Resposta não é de admin');
        setAdminUser(null);
        return null;
      } catch (error: any) {
        console.error('[ADMIN_AUTH] Erro ao verificar autenticação:', error);
        
        setAdminUser(null);
        
        return null;
      }
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: typeof window !== 'undefined' && shouldCheckAuth,
  });

  // Admin login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('[ADMIN_AUTH] Tentando fazer login com:', credentials.email);
      
      const response = await apiRequest<{ admin: AdminUser; token?: string }>(
        '/api/auth/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include', // Importante para cookies
        }
      );
      
      console.log('[ADMIN_AUTH] Resposta da API:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }
      
      if (!response.data) {
        throw new Error('No data returned from login');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      console.log('[ADMIN_AUTH] Login bem-sucedido! Data recebida:', data);
      
      // Salvar token no localStorage se fornecido pela API (mantido por compatibilidade com Authorization header)
      if (data?.token) {
        localStorage.setItem('admin_token', data.token);
        console.log('[ADMIN_AUTH] ✅ Token salvo no localStorage:', data.token.substring(0, 20) + '...');
      } else {
        console.warn('[ADMIN_AUTH] ⚠️ Nenhum token retornado pela API');
      }
      
      // Limpar tokens de customer para evitar conflitos
      localStorage.removeItem('customer_token');
      localStorage.removeItem('token');
      console.log('[ADMIN_AUTH] Tokens de customer removidos para evitar conflitos');
      
      // Invalidate and refetch admin data
      setShouldCheckAuth(true);
      setAdminUser(data?.admin || null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
      queryClient.setQueryData(['admin', 'me'], data?.admin);
      
      toast({
        title: "Login bem-sucedido!",
        description: `Bem-vindo de volta, ${data?.admin?.email}`,
      });
      
      console.log('[ADMIN_AUTH] Redirecionando para dashboard...');
      
      // Delay mínimo para garantir que o token foi salvo
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 100);
    },
    onError: (error: Error) => {
      const { message } = handleError(error);
      toast({
        title: "Erro no login",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Admin logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/admin/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      console.log('[ADMIN_AUTH] Logout bem-sucedido, limpando dados');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('customer_token');
      localStorage.removeItem('token');
      setShouldCheckAuth(false);
      setAdminUser(null);
      queryClient.removeQueries({ queryKey: ['admin', 'me'] });
      navigate('/admin/login');
    },
    onError: (error) => {
      // Mesmo com erro, limpar dados locais
      console.log('[ADMIN_AUTH] Logout (com erro), limpando dados localmente');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('customer_token');
      localStorage.removeItem('token');
      setShouldCheckAuth(false);
      setAdminUser(null);
      queryClient.removeQueries({ queryKey: ['admin', 'me'] });
      navigate('/admin/login');
    },
  });

  const login = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const admin = adminData || adminUser;

  return {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
