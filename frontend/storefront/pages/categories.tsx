import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Category } from '@shared/types';
import { Link } from 'react-router-dom';

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories', 'app'],
    queryFn: async () => {
      const res = await apiRequest<{ items: Category[] }>('/api/categories?is_active=1&pageSize=24');
      return res.data?.items || [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium">Categorias</h1>
      {/* Chips de filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        {['creme','rosa','lilás','dourado','branco'].map((c) => (
          <button key={c} className="chip">{c}</button>
        ))}
        {['papel','acetato','plástico','metal','madeira'].map((m) => (
          <button key={m} className="chip">{m}</button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data?.map((cat) => (
            <Link key={cat.id} to={`/products?category=${cat.slug}`} className="card p-4 hover:shadow-elevated transition">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-secondary">
                {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />}
              </div>
              <p className="mt-3 text-sm font-medium">{cat.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
