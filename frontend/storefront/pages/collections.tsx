import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Category } from '@shared/types';
import { Link } from 'react-router-dom';

export default function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories', 'collections'],
    queryFn: async () => {
      const res = await apiRequest<{ items: Category[] }>('/api/categories?is_active=1&pageSize=24');
      return res.data?.items || [];
    },
  });

  return (
    <div className="container mx-auto px-4 md:px-8 py-16">
      <div className="flex items-end justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-heading">Coleções</h1>
        <Link to="/products" className="text-sm underline hover:text-primary">Ver todos os produtos</Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-[var(--radius)] h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {data?.map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.slug}`} className="group rounded-[var(--radius)] overflow-hidden bg-card shadow-soft hover:shadow-elevated transition-shadow">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=1200&auto=format&fit=crop'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="font-medium text-lg">{cat.name}</h3>
                {cat.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

