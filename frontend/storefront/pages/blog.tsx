import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../utils/api'
import type { BlogPost } from '@shared/types'
import { Link } from 'react-router-dom'

export default function BlogListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog', 'list'],
    queryFn: async () => {
      const res = await apiRequest<{ items: BlogPost[]; total: number }>(`/api/blog?page=1&pageSize=20`)
      return res.data || { items: [], total: 0 }
    },
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-heading font-bold mb-6">Blog</h1>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (<div key={i} className="card h-40 animate-pulse" />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(data?.items || []).map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="card p-6 hover:shadow-md transition">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              {post.excerpt && <p className="text-muted-foreground">{post.excerpt}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
