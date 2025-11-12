import { Link } from 'react-router-dom';
import type { Product } from '@shared/types';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

type Props = {
  product: Product;
  onQuickView?: (product: Product) => void;
};

export default function ProductCard({ product, onQuickView }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0].image_url 
    : 'https://via.placeholder.com/400x400?text=Produto';

  const price = (product.price_cents / 100).toFixed(2).replace('.', ',');
  const comparePrice = product.compare_at_price_cents 
    ? (product.compare_at_price_cents / 100).toFixed(2).replace('.', ',')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <div className="card overflow-hidden h-full flex flex-col">
        {/* Image Container */}
        <Link to={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-muted">
          <motion.img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500"
            animate={{
              scale: isHovered ? 1.05 : 1,
            }}
          />
          
          {/* Badge de destaque */}
          {product.featured && (
            <div className="absolute top-3 left-3 badge bg-primary text-primary-foreground">
              Destaque
            </div>
          )}

          {/* Badge de desconto */}
          {comparePrice && (
            <div className="absolute top-3 right-3 badge bg-destructive text-destructive-foreground">
              -{Math.round(((product.compare_at_price_cents - product.price_cents) / product.compare_at_price_cents) * 100)}%
            </div>
          )}

          {/* Overlay com ações - aparece no hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(product);
              }}
              className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              aria-label="Visualização rápida"
            >
              <Eye className="w-5 h-5 text-foreground" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
              className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg transition-colors ${
                isFavorite 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-white/90 hover:bg-white'
              }`}
              aria-label="Adicionar aos favoritos"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
          </motion.div>
        </Link>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>

          {product.short_description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {product.short_description}
            </p>
          )}

          {/* Price */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">
                R$ {price}
              </span>
              {comparePrice && (
                <span className="text-sm text-muted-foreground line-through">
                  R$ {comparePrice}
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Stock indicator */}
          {product.stock_quantity !== undefined && (
            <div className="mt-2 text-xs text-muted-foreground">
              {product.stock_quantity > 0 ? (
                <span className="text-green-600">✓ Em estoque</span>
              ) : (
                <span className="text-destructive">✗ Esgotado</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
