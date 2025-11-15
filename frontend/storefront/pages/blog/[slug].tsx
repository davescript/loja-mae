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

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-4">{data.title}</h1>
      {data.excerpt && <p className="text-muted-foreground mb-6">{data.excerpt}</p>}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.content }} />
    </div>
  )
}
