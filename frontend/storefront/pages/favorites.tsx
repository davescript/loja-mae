import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Product } from '@shared/types';
import ProductCard from '../components/app/ProductCard';
import QuickViewModal from '../components/app/QuickViewModal';
import { useState } from 'react';
import { Heart, Package } from 'lucide-react';
import { useFavoritesStore } from '../../store/favoritesStore';
import { motion } from 'framer-motion';

export default function FavoritesPage() {
  const { favorites, getCount } = useFavoritesStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  // Fetch favorite products
  const { data: products, isLoading } = useQuery({
    queryKey: ['favorites', favorites],
    queryFn: async () => {
      if (favorites.length === 0) {
        return [];
      }

      try {
        // Fetch products by IDs
        const productPromises = favorites.map((id) =>
          apiRequest<Product>(`/api/products/${id}?include=all`).catch(() => null)
        );
        
        const results = await Promise.all(productPromises);
        return results
          .filter((result) => result !== null && result !== undefined && result.data !== null && result.data !== undefined)
          .map((result) => result!.data);
      } catch (error) {
        console.error('Error loading favorites:', error);
        return [];
      }
    },
    enabled: favorites.length > 0,
    staleTime: 0,
  });

  const favoriteCount = getCount();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (favoriteCount === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Heart className="w-24 h-24 mx-auto text-muted-foreground/30 mb-4" />
            <h1 className="text-3xl font-bold mb-4">Nenhum favorito ainda</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Comece a adicionar produtos aos seus favoritos para encontrá-los facilmente depois!
            </p>
            <a
              href="/products"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              Explorar Produtos
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary fill-current" />
          Meus Favoritos
        </h1>
        <p className="text-muted-foreground">
          {favoriteCount} {favoriteCount === 1 ? 'produto favorito' : 'produtos favoritos'}
        </p>
      </div>

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            if (!product) return null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(product) => {
                  setSelectedProduct(product);
                  setQuickOpen(true);
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        product={selectedProduct}
      />
    </div>
  );
}
