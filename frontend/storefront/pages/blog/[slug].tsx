import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../../utils/api'
import type { BlogPost } from '@shared/types'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      const res = await apiRequest<BlogPost>(`/api/blog/${slug}`)
      return res.data as BlogPost
    },
    enabled: !!slug,
  })

  if (isLoading) return <div className="container mx-auto px-4 py-12">Carregando...</div>
  if (!data) return <div className="container mx-auto px-4 py-12">Post não encontrado</div>

  const published = data.published_at ? new Date(data.published_at) : null
  const words = String(data.content || '').replace(/<[^>]*>/g, '').trim().split(/\s+/).length
  const reading = Math.max(1, Math.round(words / 200))

  return (
    <div className="">
      <div className="bg-gradient-to-r from-orange-50 to-amber-100 border-b">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-3">{data.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {published && <span>{published.toLocaleDateString('pt-PT')}</span>}
              <span>•</span>
              <span>{reading} min de leitura</span>
            </div>
            {data.excerpt && <p className="text-gray-700 mt-4">{data.excerpt}</p>}
          </div>
        </div>
      </div>

      <article className="container mx-auto px-4 py-10">
        <div className="prose prose-orange max-w-none">
          <div dangerouslySetInnerHTML={{ __html: data.content }} />
        </div>
      </article>
    </div>
  )
}
