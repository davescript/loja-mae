import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Category } from '@shared/types';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type Collection = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  product_count?: number;
  image_url?: string;
};

export default function CollectionsPage() {
  const { data: collections, isLoading: loadingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      try {
        const res = await apiRequest<Collection[]>('/api/collections');
        return res.data || [];
      } catch (error) {
        console.error('Erro ao carregar coleções:', error);
        return [];
      }
    },
  });

  // Fallback para categorias se não houver coleções
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', 'fallback'],
    queryFn: async () => {
      try {
        const res = await apiRequest<{ items: Category[] }>('/api/categories?is_active=1&pageSize=24');
        return res.data?.items || [];
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        return [];
      }
    },
    enabled: !collections || collections.length === 0,
  });

  const isLoading = loadingCollections || loadingCategories;
  const displayData = (collections && collections.length > 0) ? collections : categories || [];

  return (
    <div className="container mx-auto px-4 md:px-8 py-16">
      <div className="flex items-end justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-heading">Coleções</h1>
        <Link to="/products" className="text-sm underline hover:text-primary">Ver todos os produtos</Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-64" />
          ))}
        </div>
      ) : displayData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma coleção disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayData.map((item) => {
            const isCollection = 'product_count' in item;
            const linkTo = isCollection 
              ? `/collections/${item.slug}` 
              : `/products?category=${(item as Category).slug}`;
            
            return (
              <Link 
                key={item.id} 
                to={linkTo} 
                className="group rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={(item as any).image_url || 'https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=1200&auto=format&fit=crop'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-medium text-lg">{item.name}</h3>
                  {item.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  {isCollection && (item as Collection).product_count !== undefined && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {(item as Collection).product_count} produto{(item as Collection).product_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

