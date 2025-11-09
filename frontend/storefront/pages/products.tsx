import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Product, PaginatedResponse } from '@shared/types';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        status: 'active',
      });
      if (search) params.append('search', search);
      if (categoryId) params.append('category_id', categoryId.toString());

      const response = await apiRequest<PaginatedResponse<Product>>(`/api/products?${params}`);
      return response.data;
    },
  });

  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="mb-8">
        <h1 className="text-xl font-medium mb-4">Produtos</h1>
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 border rounded-xl bg-white"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-[var(--radius)] h-80" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {data?.items.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group bg-card rounded-xl shadow-soft overflow-hidden hover:shadow-elevated transition-shadow"
              >
                {product.images && product.images.length > 0 && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={product.images[0].image_url}
                      alt={product.images[0].alt_text || product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-2">{product.title}</h3>
                  <p className="text-primary font-semibold">
                    R$ {(product.price_cents / 100).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-xl disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2">
                Página {page} de {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 border rounded-xl disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
