import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';
import { useNavigate } from 'react-router-dom';

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

  // Check if admin is authenticated
  const { data: admin, isLoading, error } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ user: AdminUser; type: 'admin' }>('/api/auth/me');
        if (response.data?.type === 'admin') {
          return response.data.user;
        }
        throw new Error('Not an admin');
      } catch (error) {
        // Silently fail if not authenticated
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

