import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../utils/api'
import type { BlogPost } from '@shared/types'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

export default function BlogListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog', 'list'],
    queryFn: async () => {
      const res = await apiRequest<{ items: BlogPost[]; total: number }>(`/api/blog?page=1&pageSize=24`)
      return res.data || { items: [], total: 0 }
    },
  })
  const posts = data?.items || []
  const featured = useMemo(() => posts.slice(0, Math.min(5, posts.length)), [posts])
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (featured.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % featured.length), 5000)
    return () => clearInterval(t)
  }, [featured.length])

  return (
    <div className="">
      <section className="relative border-b">
        <div className="absolute inset-0">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: featured.length
                ? `url(${featured[index]?.cover_image_url || ''})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/70 to-white/40" />
        </div>
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-600 text-white text-sm mb-4">Blog</span>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-3">Ideias, novidades e inspiração</h1>
            <p className="text-gray-700 max-w-2xl">Descubra conteúdos frescos sobre produtos, tendências e dicas para o seu dia a dia.</p>
          </div>
          {featured.length > 0 && (
            <div className="mt-8 max-w-4xl bg-white/70 backdrop-blur-lg rounded-xl p-6 shadow">
              <Link to={`/blog/${featured[index].slug}`} className="block">
                <h2 className="text-2xl font-semibold mb-2">{featured[index].title}</h2>
                {featured[index].excerpt && <p className="text-gray-600 line-clamp-3">{featured[index].excerpt}</p>}
              </Link>
              <div className="mt-4 flex items-center gap-3">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir para destaque ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-2 w-2 rounded-full ${i === index ? 'bg-orange-600' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          )}
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
                {post.cover_image_url ? (
                  <div
                    className="h-36 bg-cover bg-center"
                    style={{ backgroundImage: `url(${post.cover_image_url})` }}
                  />
                ) : (
                  <div className="h-36 bg-gradient-to-br from-orange-200 to-amber-300 group-hover:from-orange-300 group-hover:to-amber-400 transition" />
                )}
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

      <section className="bg-white border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="rounded-xl border bg-gradient-to-r from-orange-50 to-amber-100 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-2">Assine a nossa newsletter</h3>
              <p className="text-gray-600">Receba novidades e promoções diretamente no seu email.</p>
            </div>
            <form className="flex w-full md:w-auto gap-3">
              <input type="email" placeholder="Seu email" className="flex-1 md:w-96 px-4 py-3 rounded-lg border" />
              <button className="px-5 py-3 bg-orange-600 text-white rounded-lg">Assinar</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
