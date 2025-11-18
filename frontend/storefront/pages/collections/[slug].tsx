import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import { Loader2 } from 'lucide-react';
import ProductCard from '../../components/app/ProductCard';

type Collection = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  products?: Array<{
    id: number;
    title: string;
    slug: string;
    price_cents: number;
    compare_at_price_cents?: number;
    image_url?: string;
    is_active: number;
  }>;
};

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug não fornecido');
      const response = await apiRequest<Collection>(`/api/collections/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Coleção não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A coleção que você está procurando não existe ou foi removida.
          </p>
          <Link to="/collections" className="text-primary hover:underline">
            Voltar para Coleções
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading mb-4">{collection.name}</h1>
        {collection.description && (
          <p className="text-muted-foreground text-lg max-w-3xl">{collection.description}</p>
        )}
      </div>

      {collection.products && collection.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Esta coleção ainda não possui produtos.</p>
        </div>
      )}
    </div>
  );
}

