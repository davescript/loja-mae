import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiRequest } from '../utils/api'

export type BannerPosition =
  | 'home_hero'
  | 'home_top'
  | 'home_bottom'
  | 'category'
  | 'product'
  | 'sidebar'

export type Banner = {
  id: number
  title: string
  image_url?: string | null
  link_url?: string | null
  position: BannerPosition
  order: number
  is_active: boolean
  start_date?: string | null
  end_date?: string | null
  clicks?: number
  impressions?: number
  created_at: string
  updated_at: string
}

interface UseBannersOptions
  extends Omit<
    UseQueryOptions<Banner[], Error>,
    'queryKey' | 'queryFn'
  > {
  enabled?: boolean
}

export function useBanners(
  position: BannerPosition,
  limit: number = 1,
  options?: UseBannersOptions
) {
  return useQuery<Banner[], Error>({
    queryKey: ['banners', position, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        position,
        page: '1',
        pageSize: limit.toString(),
        is_active: 'true',
      })

      const url = `/api/banners?${params.toString()}`
      console.log(`[BANNERS] Buscando banners para posição "${position}":`, url)
      
      const response = await apiRequest<{ items: Banner[] }>(url)
      
      const banners = response.data?.items || []
      console.log(`[BANNERS] Encontrados ${banners.length} banner(s) para "${position}":`, banners.map(b => ({ id: b.id, title: b.title, image_url: b.image_url })))
      
      return banners
    },
    staleTime: 1000 * 30, // 30 segundos (reduzido para atualizar mais rápido)
    refetchOnMount: true, // Sempre buscar ao montar componente
    refetchOnWindowFocus: true, // Refetch quando janela ganha foco
    ...options,
  })
}

