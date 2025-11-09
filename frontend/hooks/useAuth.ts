import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../utils/api';
import type { AuthUser } from '@shared/types';

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ user: AuthUser; type: string }>('/api/auth/me');
        if (response.success && response.data) {
          setUser(response.data.user);
          return response.data;
        }
        return null;
      } catch (error) {
        // Silently fail - user is not authenticated
        console.log('User not authenticated');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest<{ customer: AuthUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
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
        localStorage.setItem('token', response.data.token);
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
      await apiRequest('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      setUser(null);
      queryClient.clear();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: data?.user || user,
    isLoading,
    isAuthenticated: !!user,
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

