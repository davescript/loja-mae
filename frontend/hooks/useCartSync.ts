import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { apiRequest } from '../utils/api';
import { useAuth } from './useAuth';

/**
 * Hook to sync cart between localStorage and database for logged-in users
 */
export function useCartSync() {
  const { user } = useAuth();
  const { items, clearCart, loadFromServer, syncWithServer } = useCartStore();
  const queryClient = useQueryClient();

  // Fetch cart from server when user logs in
  const { data: serverCart } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: any[] }>('/api/cart');
        return response.data?.items || [];
      } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Sync cart to server
  const syncMutation = useMutation({
    mutationFn: async (cartItems: typeof items) => {
      return apiRequest('/api/cart', {
        method: 'PUT',
        body: JSON.stringify({ items: cartItems }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // When user logs in, merge localStorage cart with server cart
  useEffect(() => {
    if (user && serverCart) {
      // Merge: combine items, preferring server quantities if same product+variant
      const mergedItems = [...items];
      
      serverCart.forEach((serverItem: any) => {
        const existingIndex = mergedItems.findIndex(
          (item) =>
            item.product_id === serverItem.product_id &&
            item.variant_id === serverItem.variant_id
        );
        
        if (existingIndex >= 0) {
          // Merge quantities
          mergedItems[existingIndex].quantity += serverItem.quantity;
        } else {
          // Add new item
          mergedItems.push(serverItem);
        }
      });

      // Update local state and sync to server
      if (mergedItems.length > 0) {
        // Update cart store items directly
        mergedItems.forEach(item => {
          const existing = items.find(i => i.product_id === item.product_id && i.variant_id === item.variant_id);
          if (existing) {
            // Update quantity
            useCartStore.getState().updateQuantity(item.product_id, item.quantity, item.variant_id);
          } else {
            // Add new item
            useCartStore.getState().addItem(item);
          }
        });
        syncMutation.mutate(mergedItems);
      } else if (serverCart.length > 0) {
        // If local cart is empty but server has items, load from server
        loadFromServer();
      }
    }
  }, [user, serverCart]);

  // Sync cart to server whenever items change (for logged-in users)
  useEffect(() => {
    if (user && items.length > 0) {
      // Debounce sync to avoid too many requests
      const timeoutId = setTimeout(() => {
        syncMutation.mutate(items);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [items, user]);

  // Clear cart when user logs out
  useEffect(() => {
    if (!user) {
      clearCart();
    }
  }, [user]);
}

