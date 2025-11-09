import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import type { Product } from '@shared/types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Carousel from '../../components/app/Carousel';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await apiRequest<Product>(`/api/products/${slug}?include=all`);
      return response.data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Carregando...</div>;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Produto não encontrado</div>;
  }

  const price = selectedVariant
    ? product.variants?.find((v) => v.id === selectedVariant)?.price_cents || product.price_cents
    : product.price_cents;

  const stock = selectedVariant
    ? product.variants?.find((v) => v.id === selectedVariant)?.stock_quantity || product.stock_quantity
    : product.stock_quantity;

  const handleAddToCart = () => {
    // TODO: Implement add to cart
    console.log('Add to cart', { productId: product.id, variantId: selectedVariant, quantity });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Galeria em carrossel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-[var(--radius)] overflow-hidden shadow-elevated">
            {product.images && product.images.length > 0 ? (
              <Carousel>
                {product.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt={img.alt_text || product.title}
                    className="snap-start w-full h-[420px] md:h-[560px] object-cover"
                  />
                ))}
              </Carousel>
            ) : (
              <div className="h-[420px] md:h-[560px] bg-secondary" />
            )}
          </div>
        </motion.div>

        {/* Informações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-[var(--radius)] bg-card p-6 md:p-8 shadow-soft"
        >
          <h1 className="text-2xl md:text-3xl font-heading">{product.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            {product.featured ? <span className="badge">Novo</span> : null}
            {product.compare_at_price_cents ? <span className="badge">Promo</span> : null}
            <span className="chip">{stock > 0 ? 'Em stock' : 'Fora de stock'}</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-primary">
            R$ {(price / 100).toFixed(2).replace('.', ',')}
          </p>
          {product.compare_at_price_cents && (
            <p className="mt-1 text-sm text-muted-foreground line-through">
              R$ {(product.compare_at_price_cents / 100).toFixed(2).replace('.', ',')}
            </p>
          )}
          <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <p className="font-medium mb-2">Variações</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`px-3 py-2 rounded-full text-sm ${selectedVariant === variant.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    {variant.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="block font-medium mb-2">Quantidade</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-24 px-4 py-3 border rounded-xl"
              />
              <p className="text-sm text-muted-foreground">Estoque: {stock}</p>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-full font-semibold shadow-soft hover:shadow-elevated transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stock === 0 ? 'Fora de estoque' : 'Adicionar ao Carrinho'}
          </button>
          <div className="mt-8">
            <p className="font-medium mb-3">Itens que combinam</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(product.images?.slice(0,3) || []).map((img, i) => (
                <div key={i} className="rounded-xl bg-secondary h-24 overflow-hidden">
                  <img src={img.image_url} alt="Sugestão" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
