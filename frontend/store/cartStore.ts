import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiRequest } from '../utils/api'

export interface CartItem {
  product_id: number
  variant_id?: number | null
  title: string
  price_cents: number
  quantity: number
  image_url?: string | null
  sku?: string | null
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: number, variantId?: number | null) => void
  updateQuantity: (productId: number, quantity: number, variantId?: number | null) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  syncWithServer: () => Promise<void>
  loadFromServer: () => Promise<void>
}

const CART_KEY = 'loja-mae-cart'

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      // Carregar do servidor na inicialização se usuário estiver logado
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
        if (token) {
          // Carregar do servidor após um pequeno delay para garantir que a store está inicializada
          setTimeout(() => {
            get().loadFromServer().catch(err => {
              console.error('Erro ao carregar carrinho na inicialização:', err);
            });
          }, 100);
        }
      }

      return {
        items: [],
        isLoading: false,

        addItem: (item) => {
        try {
          console.log('🛒 addItem chamado com:', item);
          const { items } = get()
          console.log('📦 Itens atuais no carrinho:', items);
          
          const existingIndex = items.findIndex(
            (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
          )

          if (existingIndex >= 0) {
            // Atualizar quantidade se já existe
            const updatedItems = [...items]
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + (item.quantity || 1),
            }
            console.log('➕ Atualizando quantidade do item existente');
            set({ items: updatedItems })
          } else {
            // Adicionar novo item
            const newItem = { ...item, quantity: item.quantity || 1 };
            console.log('➕ Adicionando novo item:', newItem);
            set({
              items: [...items, newItem],
            })
          }

          // Sincronizar com servidor se usuário estiver logado
          const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
          if (token) {
            console.log('🔄 Sincronizando carrinho com servidor...');
            get().syncWithServer().catch(err => {
              console.error('❌ Erro ao sincronizar carrinho:', err);
            });
          } else {
            console.log('ℹ️ Usuário não logado, carrinho apenas no localStorage');
          }
          
          console.log('✅ addItem concluído. Novo estado:', get().items);
        } catch (error) {
          console.error('❌ Erro em addItem:', error);
          throw error;
        }
      },

      removeItem: (productId, variantId = null) => {
        const { items } = get()
        set({
          items: items.filter(
            (item) => !(item.product_id === productId && item.variant_id === variantId)
          ),
        })

        // Sincronizar com servidor
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (token) {
          get().syncWithServer()
        }
      },

      updateQuantity: (productId, quantity, variantId = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }

        const { items } = get()
        const updatedItems = items.map((item) =>
          item.product_id === productId && item.variant_id === variantId
            ? { ...item, quantity }
            : item
        )
        set({ items: updatedItems })

        // Sincronizar com servidor
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (token) {
          get().syncWithServer()
        }
      },

      clearCart: () => {
        set({ items: [] })
        
        // Limpar no servidor também
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (token) {
          get().syncWithServer()
        }
      },

      getTotal: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.price_cents * item.quantity, 0)
      },

      getItemCount: () => {
        const { items } = get()
        return items.reduce((count, item) => count + item.quantity, 0)
      },

      syncWithServer: async () => {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (!token) return

        try {
          const { items } = get()
          await apiRequest('/api/cart', {
            method: 'PUT',
            body: JSON.stringify({ items }),
          })
        } catch (error) {
          console.error('Erro ao sincronizar carrinho:', error)
        }
      },

      loadFromServer: async () => {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (!token) {
          console.log('🛒 Usuário não logado, mantendo carrinho do localStorage');
          return
        }

        set({ isLoading: true })
        try {
          console.log('🛒 Carregando carrinho do servidor...');
          const response = await apiRequest<{ items: CartItem[] }>('/api/cart')
          if (response.data?.items && Array.isArray(response.data.items)) {
            console.log('🛒 Carrinho carregado do servidor:', response.data.items.length, 'itens');
            set({ items: response.data.items })
          } else {
            console.log('🛒 Nenhum item no carrinho do servidor, mantendo localStorage');
          }
        } catch (error) {
          console.error('❌ Erro ao carregar carrinho do servidor:', error);
          // Em caso de erro, manter itens do localStorage
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: CART_KEY,
      partialize: (state) => ({ items: state.items }),
    }
  )
)

