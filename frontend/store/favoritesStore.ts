import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiRequest } from '../utils/api'

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

        // Sincronizar com servidor se autenticado
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (token) {
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
            
            // Verificar se a resposta foi bem-sucedida
            if (!response.success) {
              throw new Error(response.error || 'Erro ao adicionar favorito')
            }
            
            console.log('✅ Favorito adicionado no servidor com sucesso')
          } catch (error: any) {
            console.error('❌ Erro ao adicionar favorito no servidor:', error)
            console.error('❌ Detalhes do erro:', error.message)
            if (error.response) {
              console.error('❌ Resposta do servidor:', error.response)
            }
            // Reverter se falhar
            console.log('❤️ Revertendo favoritos para estado anterior:', favorites)
            set({ favorites })
          }
        } else {
          console.log('❤️ Usuário não autenticado, favorito apenas no localStorage')
        }
      },

      removeFavorite: async (productId: number) => {
        const { favorites } = get()
        const updatedFavorites = favorites.filter((id) => id !== productId)

        // Atualizar localmente primeiro (otimistic update)
        set({ favorites: updatedFavorites })

        // Sincronizar com servidor se autenticado
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (token) {
          try {
            await apiRequest(`/api/favorites/${productId}`, {
              method: 'DELETE',
            })
            console.log('✅ Favorito removido do servidor')
          } catch (error) {
            console.error('❌ Erro ao remover favorito do servidor:', error)
            // Reverter se falhar
            set({ favorites })
          }
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
        set({ favorites: [] })
      },

      getCount: () => {
        const { favorites } = get()
        return favorites.length
      },

      loadFromServer: async () => {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (!token) {
          console.log('❤️ Usuário não logado, mantendo favoritos do localStorage')
          return
        }

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
          console.error('❌ Erro ao carregar favoritos do servidor:', error)
          // Em caso de erro, manter favoritos do localStorage (não fazer nada)
          const { favorites: currentFavorites } = get()
          console.log('❤️ Mantendo', currentFavorites.length, 'favoritos do localStorage após erro')
        } finally {
          set({ isLoading: false })
        }
      },

      syncWithServer: async () => {
        const token = localStorage.getItem('customer_token') || localStorage.getItem('token')
        if (!token) {
          return
        }

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

