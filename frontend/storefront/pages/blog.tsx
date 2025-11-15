import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../utils/api'
import type { BlogPost } from '@shared/types'
import { Link } from 'react-router-dom'

export default function BlogListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog', 'list'],
    queryFn: async () => {
      const res = await apiRequest<{ items: BlogPost[]; total: number }>(`/api/blog?page=1&pageSize=24`)
      return res.data || { items: [], total: 0 }
    },
  })

  const posts = data?.items || []

  return (
    <div className="">
      <section className="bg-gradient-to-r from-orange-50 to-amber-100 border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/60 text-orange-600 text-sm mb-4">Blog</span>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-3">Ideias, novidades e inspiração</h1>
            <p className="text-gray-600">Descubra conteúdos frescos sobre produtos, tendências e dicas para o seu dia a dia.</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-14">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (<div key={i} className="rounded-xl border bg-white h-48 animate-pulse" />))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">Nenhum post publicado</h2>
            <p className="text-gray-600">Volte em breve — em breve teremos novidades por aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="h-36 bg-gradient-to-br from-orange-200 to-amber-300 group-hover:from-orange-300 group-hover:to-amber-400 transition" />
                <div className="p-5">
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-orange-600 transition">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
