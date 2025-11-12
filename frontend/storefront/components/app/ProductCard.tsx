import { Link } from 'react-router-dom';
import type { Product } from '@shared/types';
import { Heart, ShoppingCart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

type Props = {
  product: Product;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
};

export default function ProductCard({ product, onQuickView, onAddToCart }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [];
  
  const displayImages = images.slice(0, 5); // Máximo 5 imagens (1 principal + 4 preview)
  const previewImages = displayImages.slice(1, 5); // 4 imagens de preview
  
  const currentImage = displayImages[currentImageIndex] || displayImages[0];
  const imageUrl = currentImage?.image_url || null;

  const price = (product.price_cents / 100).toFixed(2).replace('.', ',');
  const comparePrice = product.compare_at_price_cents 
    ? (product.compare_at_price_cents / 100).toFixed(2).replace('.', ',')
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleImageChange = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    }
  };

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
      <div className="card overflow-hidden h-full flex flex-col bg-white">
        {/* Image Container */}
        <Link 
          to={`/product/${product.slug}`} 
          className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center"
        >
          {imageUrl ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={imageUrl}
                alt={currentImage?.alt_text || product.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">📦</span>
            </div>
          )}
          
          {/* Badge de destaque */}
          {product.featured && (
            <div className="absolute top-3 left-3 badge bg-primary text-primary-foreground z-10">
              Destaque
            </div>
          )}

          {/* Badge de desconto */}
          {comparePrice && product.compare_at_price_cents && (
            <div className="absolute top-3 right-3 badge bg-destructive text-destructive-foreground z-10">
              -{Math.round(((product.compare_at_price_cents - product.price_cents) / product.compare_at_price_cents) * 100)}%
            </div>
          )}

          {/* Navigation Arrows - aparecem no hover se houver múltiplas imagens */}
          {displayImages.length > 1 && isHovered && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors z-20"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors z-20"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </motion.button>
            </>
          )}

          {/* Quick View Button - aparece no hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 right-3 z-20"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(product);
              }}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              aria-label="Visualização rápida"
            >
              <Eye className="w-5 h-5 text-foreground" />
            </motion.button>
          </motion.div>

          {/* Favorite Button - aparece no hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 left-3 z-20"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg transition-colors ${
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

        {/* Preview de Imagens - 4 miniaturas */}
        {previewImages.length > 0 && (
          <div className="px-4 pt-3 pb-2 flex gap-2 justify-center">
            {previewImages.map((img, index) => {
              const previewIndex = index + 1; // +1 porque a primeira é a principal
              const isActive = currentImageIndex === previewIndex;
              return (
                <button
                  key={img.id}
                  onClick={(e) => handleImageChange(previewIndex, e)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    isActive
                      ? 'border-primary scale-110 shadow-md'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                  aria-label={`Ver imagem ${previewIndex + 1}`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || `${product.title} - Imagem ${previewIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category Badge */}
          {product.category && (
            <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
              {product.category.name}
            </span>
          )}

          <Link to={`/product/${product.slug}`}>
            <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>

          {/* Price */}
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-foreground">
              R$ {price}
            </span>
            {comparePrice && (
              <span className="text-sm text-muted-foreground line-through">
                R$ {comparePrice}
              </span>
            )}
          </div>

          {/* Rating - Placeholder */}
          <div className="flex items-center gap-1 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-sm">★</span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">(0)</span>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-semibold">Adicionar ao carrinho</span>
            </motion.button>
            
            <Link
              to={`/product/${product.slug}`}
              className="btn btn-muted px-4 flex items-center justify-center"
              aria-label="Ver detalhes"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>

          {/* Stock indicator */}
          {product.stock_quantity !== undefined && (
            <div className="mt-3 text-xs text-center">
              {product.stock_quantity > 0 ? (
                <span className="text-green-600 font-medium">✓ Em estoque</span>
              ) : (
                <span className="text-destructive font-medium">✗ Esgotado</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
