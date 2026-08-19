import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useBanners, type BannerPosition } from '../../../hooks/useBanners'
import { API_BASE_URL } from '../../../utils/api'

type BannerVariant = 'hero' | 'grid' | 'full' | 'sidebar'

interface BannerDisplayProps {
  position: BannerPosition
  variant?: BannerVariant
  limit?: number
  className?: string
}

const variantMap: Record<BannerPosition, BannerVariant> = {
  home_hero: 'hero',
  home_top: 'grid',
  home_bottom: 'grid',
  category: 'full',
  product: 'full',
  sidebar: 'sidebar',
}

function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

export default function BannerDisplay({
  position,
  variant,
  limit = position === 'home_top' || position === 'home_bottom' ? 3 : 1,
  className,
}: BannerDisplayProps) {
  const finalVariant = variant || variantMap[position] || 'full'
  const { data: banners = [], isLoading, error } = useBanners(position, limit)

  useEffect(() => {
    if (banners.length === 0) {
      console.log(`[BANNER_DISPLAY] Nenhum banner encontrado para posição "${position}"`)
      return
    }
    console.log(`[BANNER_DISPLAY] Renderizando ${banners.length} banner(s) para "${position}"`)
    banners.forEach((banner) => {
      fetch(`${API_BASE_URL}/api/banners/${banner.id}/impression`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => { })
    })
  }, [banners, position])

  if (error) {
    console.error(`[BANNER_DISPLAY] Erro ao carregar banners para "${position}":`, error)
  }

  if (isLoading) {
    return (
      <div className="w-full h-52 rounded-3xl animate-pulse bg-muted/60" />
    )
  }

  if (!banners || banners.length === 0) {
    return null
  }

  const handleClick = (bannerId: number) => {
    fetch(`${API_BASE_URL}/api/banners/${bannerId}/click`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => { })
  }

  const renderMedia = (banner: any, objectFit: 'cover' | 'contain' = 'cover') => {
    const isVideo = banner.media_type === 'video' && banner.video_url

    if (isVideo) {
      if (isYouTubeUrl(banner.video_url)) {
        const videoId = getYouTubeId(banner.video_url)
        if (videoId) {
          return (
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
                className="w-full h-full object-cover scale-150"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ pointerEvents: 'none' }}
              />
              {/* Overlay transparente para prevenir interação com o vídeo e permitir clique no link */}
              <div className="absolute inset-0 bg-transparent" />
            </div>
          )
        }
      }

      const getMediaUrl = (url: string | null | undefined) => {
        if (!url) return null
        if (url.startsWith('http')) return url
        if (url.startsWith('/api/images')) {
          return `${API_BASE_URL}${url}`
        }
        return `${API_BASE_URL}${url}`
      }

      return (
        <video
          src={getMediaUrl(banner.video_url) || ''}
          poster={banner.video_poster_url ? getMediaUrl(banner.video_poster_url) || undefined : undefined}
          className={`w-full h-full object-${objectFit}`}
          autoPlay
          loop
          muted
          playsInline
        />
      )
    }

    return (
      <img
        src={(() => {
          if (!banner.image_url) return '/placeholder.png'
          if (banner.image_url.startsWith('http')) return banner.image_url
          if (banner.image_url.startsWith('/api/images')) {
            return `${API_BASE_URL}${banner.image_url}`
          }
          return `${API_BASE_URL}${banner.image_url}`
        })()}
        alt={banner.title}
        className={`w-full h-full object-${objectFit}`}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = '/placeholder.png'
        }}
      />
    )
  }

  if (finalVariant === 'hero') {
    const banner = banners[0]

    return (
      <section className={className}>
        <motion.div
          className="relative overflow-hidden rounded-3xl aspect-[16/7] bg-muted group"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {renderMedia(banner)}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white max-w-3xl pointer-events-auto">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-lg">
              {banner.title}
            </h2>
            {banner.link_url && (
              <Link
                to={banner.link_url}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform"
                onClick={() => handleClick(banner.id)}
              >
                Aproveitar agora →
              </Link>
            )}
          </div>
        </motion.div>
      </section>
    )
  }

  if (finalVariant === 'grid') {
    const xlCols =
      banners.length >= 3 ? 'xl:grid-cols-3' : banners.length === 2 ? 'xl:grid-cols-2' : 'xl:grid-cols-1'

    return (
      <div className={`grid gap-4 md:gap-6 ${className || ''} grid-cols-1 md:grid-cols-2 ${xlCols}`}>
        {banners.map((banner) => (
          <motion.div
            key={banner.id}
            className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/6]"
            whileHover={{ scale: 1.01 }}
          >
            {renderMedia(banner)}
            {banner.link_url && (
              <Link
                to={banner.link_url}
                className="absolute inset-0 z-10"
                onClick={() => handleClick(banner.id)}
              >
                <span className="sr-only">{banner.title}</span>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  if (finalVariant === 'sidebar') {
    const banner = banners[0]

    return (
      <aside
        className={`rounded-2xl overflow-hidden bg-muted aspect-[3/4] relative ${className}`}
      >
        {renderMedia(banner)}
        {banner.link_url && (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 z-10"
            onClick={() => handleClick(banner.id)}
          >
            <span className="sr-only">{banner.title}</span>
          </a>
        )}
      </aside>
    )
  }

  // full variant
  return (
    <div className={`rounded-3xl overflow-hidden bg-muted ${className}`}>
      {banners.map((banner) => (
        <motion.div
          key={banner.id}
          className="relative aspect-[21/9]"
          whileHover={{ scale: 1.005 }}
        >
          {renderMedia(banner)}
          {banner.link_url && (
            <Link
              to={banner.link_url}
              className="absolute inset-0 z-10"
              onClick={() => handleClick(banner.id)}
            >
              <span className="sr-only">{banner.title}</span>
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  )
}

