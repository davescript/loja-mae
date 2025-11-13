import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@shared/types'

interface FavoritesStore {
  favorites: number[] // Array de product IDs
  isLoading: boolean
  addFavorite: (productId: number) => void
  removeFavorite: (productId: number) => void
  toggleFavorite: (productId: number) => void
  isFavorite: (productId: number) => boolean
  clearFavorites: () => void
  getCount: () => number
}

const FAVORITES_KEY = 'loja-mae-favorites'

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,

      addFavorite: (productId: number) => {
        const { favorites } = get()
        if (!favorites.includes(productId)) {
          set({ favorites: [...favorites, productId] })
        }
      },

      removeFavorite: (productId: number) => {
        const { favorites } = get()
        set({ favorites: favorites.filter((id) => id !== productId) })
      },

      toggleFavorite: (productId: number) => {
        const { isFavorite, addFavorite, removeFavorite } = get()
        if (isFavorite(productId)) {
          removeFavorite(productId)
        } else {
          addFavorite(productId)
        }
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
    }),
    {
      name: FAVORITES_KEY,
    }
  )
)

