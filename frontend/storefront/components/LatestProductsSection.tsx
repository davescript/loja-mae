import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Product } from '@shared/types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/format';

export default function LatestProductsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'featured-premium'],
    queryFn: async () => {
      const response = await apiRequest<{ items: Product[] }>(
        '/api/products?featured=1&status=active&pageSize=8&include=images'
      );
      return response.data?.items || [];
    },
  });

  return (
    <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-3xl md:text-4xl font-heading">Latest Products</h2>
        <Link to="/products" className="text-sm underline hover:text-primary">Ver todos</Link>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-[var(--radius)] h-80" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {data?.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.03 }}
            >
              <Link
                to={`/product/${product.slug}`}
                className="group rounded-[var(--radius)] bg-card overflow-hidden shadow-soft hover:shadow-elevated transition-shadow"
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
                <div className="p-5">
                  <h3 className="font-medium text-lg">{product.title}</h3>
                  <p className="mt-2 text-primary font-semibold text-xl">
                    {formatPrice(product.price_cents)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

