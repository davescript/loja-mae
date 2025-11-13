import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import type { Product } from '@shared/types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Carousel from '../../components/app/Carousel';
import { Star } from 'lucide-react';
import { formatPrice } from '../../../utils/format';
import { sanitizeHtml } from '../../../utils/sanitize';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await apiRequest<Product>(`/api/products/${slug}?include=all`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 0, // Sempre buscar dados atualizados do servidor
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
    try {
      const priceCents = selectedVariant
        ? (product.variants?.find(v => v.id === selectedVariant)?.price_cents || product.price_cents)
        : product.price_cents;
      const title = selectedVariant
        ? `${product.title} - ${product.variants?.find(v => v.id === selectedVariant)?.title ?? ''}`
        : product.title;
      const imageUrl = product.images?.[0]?.image_url || null;
      const { addItem } = require('../../../utils/cart');
      addItem({
        product_id: product.id,
        variant_id: selectedVariant || null,
        title,
        price_cents: priceCents,
        quantity,
        image_url: imageUrl,
      });
    } catch (e) {
      console.error('Falha ao adicionar ao carrinho', e);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Galeria com zoom + miniaturas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-[var(--radius)] overflow-hidden shadow-elevated">
            {product.images && product.images.length > 0 ? (
              <div>
                <div className="group relative">
                  <img
                    src={product.images[activeImage]?.image_url}
                    alt={product.images[activeImage]?.alt_text || product.title}
                    className="w-full h-[420px] md:h-[560px] object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {/* Zoom hint */}
                  <div className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full bg-black/30 text-white">Zoom</div>
                </div>
                {/* Miniaturas */}
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {product.images.map((img, idx) => (
                    <button key={img.id} onClick={() => setActiveImage(idx)} className={`rounded-md overflow-hidden border ${activeImage===idx ? 'border-primary' : 'border-border'}`}>
                      <img src={img.image_url} alt={img.alt_text || product.title} className="w-full h-16 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[420px] md:h-[560px] bg-secondary flex items-center justify-center">
                <span className="text-6xl text-muted-foreground">📦</span>
              </div>
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
          {/* Avaliações */}
          <div className="mt-3 flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round((product as any).average_rating || 4) ? '' : 'opacity-30'}`} />
            ))}
            <span className="ml-2 text-xs text-muted-foreground">{(product as any).reviews_count || 24} avaliações</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-primary">
            {formatPrice(price)}
          </p>
          {product.compare_at_price_cents && (
            <p className="mt-1 text-sm text-muted-foreground line-through">
              {formatPrice(product.compare_at_price_cents)}
            </p>
          )}
          {product.description && (
            <div 
              className="mt-6 text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
            />
          )}

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

          <motion.button
            onClick={handleAddToCart}
            disabled={stock === 0}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-full font-semibold shadow-soft hover:shadow-elevated transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stock === 0 ? 'Fora de estoque' : 'Adicionar ao Carrinho'}
          </motion.button>
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
