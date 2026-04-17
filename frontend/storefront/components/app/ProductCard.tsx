import { Link, useNavigate, useLocation } from 'react-router-dom';
import type { Product } from '@shared/types';
import { Heart, ShoppingCart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { formatPrice } from '../../../utils/format';
import { useCartStore } from '../../../store/cartStore';
import { useFavoritesStore } from '../../../store/favoritesStore';
import { useToast } from '../../../admin/hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';

type Props = {
  product: Product;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  listView?: boolean;
};

export default function ProductCard({ product, onQuickView, onAddToCart, listView = false }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { toggleFavorite, favorites } = useFavoritesStore(); // Usar favorites diretamente
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProductFavorite = favorites.includes(product.id); // Verificar do array
  
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [];
  
  const displayImages = images.slice(0, 5); // Máximo 5 imagens (1 principal + 4 preview)
  const previewImages = displayImages.slice(1, 5); // 4 imagens de preview
  
  const currentImage = displayImages[currentImageIndex] || displayImages[0];
  const imageUrl = currentImage?.image_url || null;

  const price = formatPrice(product.price_cents);

  const { addItem } = useCartStore();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🛒 Adicionar ao carrinho clicado', { product, stock: product.stock_quantity });
    
    // Verificar se o produto tem estoque (se stock_quantity estiver definido)
    if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
      console.log('❌ Produto sem estoque');
      toast({
        title: 'Produto esgotado',
        description: 'Este produto não está disponível no momento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('✅ Adicionando produto ao carrinho...');
      
      addItem({
        product_id: product.id,
        variant_id: null,
        title: product.title,
        price_cents: product.price_cents,
        quantity: 1,
        image_url: product.images?.[0]?.image_url || null,
        sku: product.sku || null,
      });

      console.log('✅ Produto adicionado ao carrinho');

      toast({
        title: 'Adicionado ao carrinho',
        description: `${product.title} foi adicionado ao carrinho.`,
      });

      onAddToCart?.(product);
    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o produto ao carrinho.',
        variant: 'destructive',
      });
    }
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

  // ── List View Layout ────────────────────────────────────────────────────────
  if (listView) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.25 }}
        className="card overflow-hidden bg-white"
      >
        <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Image */}
          <div
            className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer bg-muted"
            onClick={() => onQuickView?.(product)}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
            )}
            {product.featured && (
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Destaque
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {product.category && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {product.category.name}
                </span>
              )}
              <h3
                className="font-bold text-sm sm:text-base leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors mt-0.5"
                onClick={() => onQuickView?.(product)}
              >
                {product.title}
              </h3>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xs">★</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-base sm:text-lg font-bold text-foreground">{price}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
                      return;
                    }
                    await toggleFavorite(product.id);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                    isProductFavorite
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary'
                  }`}
                  aria-label="Favorito"
                >
                  <Heart className={`w-4 h-4 ${isProductFavorite ? 'fill-current' : ''}`} />
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity !== undefined && product.stock_quantity <= 0}
                  className="btn btn-primary h-9 px-3 sm:px-4 text-xs sm:text-sm gap-1.5 min-h-0 disabled:opacity-50"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">
                    {product.stock_quantity !== undefined && product.stock_quantity <= 0 ? 'Esgotado' : 'Carrinho'}
                  </span>
                  <span className="xs:hidden">+</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Grid View Layout (default) ───────────────────────────────────────────────
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
        <div 
          className="relative aspect-square overflow-hidden bg-white flex items-center justify-center cursor-pointer"
          onClick={() => onQuickView?.(product)}
          style={{ fontFeatureSettings: 'normal' }}
        >
          {imageUrl ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={`product-${product.id}-image-${currentImageIndex}`}
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

          {/* Quick View Button — desktop hover only */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); onQuickView?.(product); }}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              aria-label="Visualização rápida"
            >
              <Eye className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>

          {/* Favorite Button — desktop hover only */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200">

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  const currentPath = `${location.pathname}${location.search}`;
                  toast({
                    title: 'Entre para favoritar',
                    description: 'Faça login para salvar seus produtos favoritos.',
                  });
                  navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
                  return;
                }
                const wasFavorite = favorites.includes(product.id);
                await toggleFavorite(product.id);
                toast({
                  title: wasFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
                  description: wasFavorite 
                    ? 'Produto removido da sua lista de favoritos'
                    : 'Produto adicionado à sua lista de favoritos',
                });
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg transition-colors ${
                isProductFavorite
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/90 hover:bg-white'
              }`}
              aria-label="Adicionar aos favoritos"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isProductFavorite ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
        </div>

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
        <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <span className="text-[9px] sm:text-xs text-muted-foreground mb-0.5 uppercase tracking-wide block truncate">
              {product.category.name}
            </span>
          )}

          <h3
            className="font-bold text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors cursor-pointer mb-1.5 sm:mb-2"
            onClick={() => onQuickView?.(product)}
          >
            {product.title}
          </h3>

          {/* Stars — hidden on small mobile to save space */}
          <div className="hidden sm:flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xs">★</span>
            ))}
          </div>

          {/* Price + Add button */}
          <div className="mt-auto">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-sm sm:text-lg font-bold text-foreground leading-none">
                {price}
              </span>
              {/* Stock badge — desktop only */}
              {product.stock_quantity !== undefined && product.stock_quantity <= 0 && (
                <span className="hidden sm:inline text-[10px] text-destructive font-medium">Esgotado</span>
              )}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all min-h-[42px] text-xs sm:text-sm ${
                product.stock_quantity !== undefined && product.stock_quantity <= 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:scale-95'
              }`}
              disabled={product.stock_quantity !== undefined && product.stock_quantity <= 0}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">
                {product.stock_quantity !== undefined && product.stock_quantity <= 0 ? 'Esgotado' : 'Adicionar'}
              </span>
              <span className="sm:hidden">
                {product.stock_quantity !== undefined && product.stock_quantity <= 0 ? 'Esg.' : 'Carrinho'}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
