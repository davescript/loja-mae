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

  // Check if admin is authenticated
  const { data: admin, isLoading, error } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      try {
        // Verificar se há token antes de fazer a requisição
        const token = localStorage.getItem('admin_token');
        if (!token) {
          return null;
        }

        const response = await apiRequest<{ user: AdminUser; type: 'admin' }>('/api/auth/me');
        if (response.data?.type === 'admin') {
          return response.data.user;
        }
        throw new Error('Not an admin');
      } catch (error: any) {
        // Não limpar token automaticamente em caso de erro
        // O token pode estar válido, mas houve um erro de rede ou temporário
        // Só limpar token quando realmente necessário (token inválido/expirado)
        // Isso evita que hard refresh termine a sessão
        const errorMessage = error?.message || '';
        const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('401');
        
        // Só limpar se for realmente um erro de autenticação E o token não existir mais no servidor
        // Não limpar em caso de erro de rede ou outros erros temporários
        if (isAuthError && error?.response?.status === 401) {
          // Verificar se o token ainda existe no localStorage antes de limpar
          const token = localStorage.getItem('admin_token');
          if (token) {
            // Token existe mas foi rejeitado - pode ser expirado ou inválido
            // Mas não limpar imediatamente - deixar o usuário tentar novamente
            // Só limpar se for realmente necessário (ex: token malformado)
          }
        }
        // Silently fail if not authenticated - não limpar token
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount (including hard refresh)
  });

  // Admin login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest<{ admin: AdminUser; token: string }>(
        '/api/auth/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        }
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in localStorage for API requests
      if (data?.token) {
        localStorage.setItem('admin_token', data.token);
      }
      // Invalidate and refetch admin data
      queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
      navigate('/admin/dashboard');
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
      return apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      localStorage.removeItem('admin_token');
      queryClient.clear();
      navigate('/admin/login');
    },
  });

  const login = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

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

