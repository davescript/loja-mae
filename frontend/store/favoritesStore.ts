import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiRequest } from '../utils/api'
import { AuthenticationError } from '../utils/errorHandler'

interface FavoritesStore {
  favorites: number[] // Array de product IDs
  isLoading: boolean
  addFavorite: (productId: number) => Promise<void>
  removeFavorite: (productId: number) => Promise<void>
  toggleFavorite: (productId: number) => Promise<void>
  isFavorite: (productId: number) => boolean
  clearFavorites: () => void
  getCount: () => number
  loadFromServer: () => Promise<void>
  syncWithServer: () => Promise<void>
}

const FAVORITES_KEY = 'loja-mae-favorites'

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,

      addFavorite: async (productId: number) => {
        const { favorites } = get()
        console.log('❤️ addFavorite chamado para produto:', productId, 'Favoritos atuais:', favorites)
        
        if (favorites.includes(productId)) {
          console.log('❤️ Produto já está nos favoritos, ignorando')
          return // Já está nos favoritos
        }

        // Atualizar localmente primeiro (otimistic update)
        const newFavorites = [...favorites, productId]
        console.log('❤️ Atualizando favoritos localmente:', newFavorites)
        set({ favorites: newFavorites })

        try {
          console.log('❤️ Sincronizando com servidor...')
          const response = await apiRequest('/api/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId }),
          })
          console.log('✅ Resposta do servidor:', response)
          
          if (!response.success) {
            throw new Error(response.error || 'Erro ao adicionar favorito')
          }
          
          console.log('✅ Favorito adicionado no servidor com sucesso')
        } catch (error: any) {
          if (error instanceof AuthenticationError) {
            console.warn('Usuário não autenticado. Favorito ficará apenas local até fazer login.')
            return
          }
          console.error('❌ Erro ao adicionar favorito no servidor:', error)
          console.error('❌ Detalhes do erro:', error.message)
          if (error.response) {
            console.error('❌ Resposta do servidor:', error.response)
          }
          console.log('❤️ Revertendo favoritos para estado anterior:', favorites)
          set({ favorites })
        }
      },

      removeFavorite: async (productId: number) => {
        const { favorites } = get()
        console.log('💔 removeFavorite chamado para produto:', productId, 'Favoritos atuais:', favorites)
        
        if (!favorites.includes(productId)) {
          console.log('💔 Produto não está nos favoritos, ignorando')
          return
        }

        const updatedFavorites = favorites.filter((id) => id !== productId)
        console.log('💔 Atualizando favoritos localmente:', updatedFavorites)

        // Atualizar localmente primeiro (otimistic update)
        set({ favorites: updatedFavorites })

        try {
          console.log('💔 Removendo do servidor...')
          const response = await apiRequest(`/api/favorites/${productId}`, {
            method: 'DELETE',
          })
          console.log('✅ Resposta do servidor:', response)
          console.log('✅ Favorito removido do servidor com sucesso')
        } catch (error: any) {
          if (error instanceof AuthenticationError) {
            console.warn('Usuário não autenticado. Remoção aplicada apenas localmente.')
            return
          }
          console.error('❌ Erro ao remover favorito do servidor:', error)
          console.error('❌ Detalhes do erro:', error.message)
          if (error.response) {
            console.error('❌ Resposta do servidor:', error.response)
          }
          console.log('💔 Revertendo favoritos para estado anterior:', favorites)
          set({ favorites })
        }
      },

      toggleFavorite: async (productId: number) => {
        const { favorites } = get()
        const isCurrentlyFavorite = favorites.includes(productId)
        console.log('❤️ toggleFavorite chamado para produto:', productId, 'Atualmente favorito:', isCurrentlyFavorite)
        
        if (isCurrentlyFavorite) {
          console.log('❤️ Removendo dos favoritos...')
          await get().removeFavorite(productId)
        } else {
          console.log('❤️ Adicionando aos favoritos...')
          await get().addFavorite(productId)
        }
        
        // Verificar estado final
        const finalFavorites = get().favorites
        console.log('❤️ Estado final dos favoritos:', finalFavorites)
      },

      isFavorite: (productId: number) => {
        const { favorites } = get()
        return favorites.includes(productId)
      },

      clearFavorites: () => {
        console.log('🧹 Limpando favoritos do estado e localStorage...');
        set({ favorites: [] });
        // Limpar localStorage diretamente para garantir que não seja re-hidratado
        if (typeof window !== 'undefined') {
          localStorage.removeItem(FAVORITES_KEY);
          console.log('✅ localStorage de favoritos removido');
        }
      },

      getCount: () => {
        const { favorites } = get()
        return favorites.length
      },

      loadFromServer: async () => {
        set({ isLoading: true })
        try {
          console.log('❤️ Carregando favoritos do servidor...')
          const { favorites: currentFavorites } = get()
          console.log('❤️ Favoritos atuais no localStorage:', currentFavorites.length)

          const response = await apiRequest<{ favorites: number[] }>('/api/favorites')
          if (response.data?.favorites && Array.isArray(response.data.favorites) && response.data.favorites.length > 0) {
            console.log('❤️ Favoritos carregados do servidor:', response.data.favorites.length, 'itens')
            // Servidor tem favoritos - usar do servidor
            set({ favorites: response.data.favorites })
          } else {
            // Servidor não tem favoritos - manter do localStorage se houver
            if (currentFavorites.length > 0) {
              console.log('❤️ Servidor vazio, mantendo', currentFavorites.length, 'favoritos do localStorage')
              // Não fazer set, manter como está
            } else {
              console.log('❤️ Servidor vazio e localStorage vazio')
            }
          }
        } catch (error) {
          if (error instanceof AuthenticationError) {
            console.warn('❤️ Usuário não autenticado ao carregar favoritos. Mantendo apenas local.')
          } else {
            console.error('❌ Erro ao carregar favoritos do servidor:', error)
            const { favorites: currentFavorites } = get()
            console.log('❤️ Mantendo', currentFavorites.length, 'favoritos do localStorage após erro')
          }
        } finally {
          set({ isLoading: false })
        }
      },

      syncWithServer: async () => {
        const { favorites } = get()
        if (favorites.length === 0) {
          return
        }

        try {
          console.log('❤️ Sincronizando favoritos com servidor...')
          // Carregar favoritos do servidor e fazer merge
          const response = await apiRequest<{ favorites: number[] }>('/api/favorites')
          const serverFavorites = response.data?.favorites || []

          // Fazer merge: adicionar favoritos locais que não estão no servidor
          const localOnly = favorites.filter((id) => !serverFavorites.includes(id))
          for (const productId of localOnly) {
            try {
              await apiRequest('/api/favorites', {
                method: 'POST',
                body: JSON.stringify({ product_id: productId }),
              })
            } catch (error) {
              console.error(`❌ Erro ao sincronizar favorito ${productId}:`, error)
            }
          }

          // Atualizar com favoritos do servidor (fonte da verdade)
          if (serverFavorites.length > 0) {
            set({ favorites: serverFavorites })
          }
        } catch (error) {
          if (error instanceof AuthenticationError) {
            console.warn('❤️ Usuário não autenticado ao sincronizar favoritos.')
            return
          }
          console.error('❌ Erro ao sincronizar favoritos:', error)
        }
      },
    }),
    {
      name: FAVORITES_KEY,
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
)

