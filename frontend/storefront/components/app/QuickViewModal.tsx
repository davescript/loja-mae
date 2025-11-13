import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@shared/types';
import { formatPrice } from '../../../utils/format';
import { useCartStore } from '../../../store/cartStore';
import { useToast } from '../../../admin/hooks/useToast';
import { sanitizeHtml } from '../../../utils/sanitize';

type QuickViewModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product;
};

export default function QuickViewModal({ open, onOpenChange, product }: QuickViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const images = product?.images && product.images.length > 0 
    ? product.images 
    : [];
  
  const currentImage = images[currentImageIndex] || images[0];
  const imageUrl = currentImage?.image_url || null;

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  // Scroll to modal when it opens
  useEffect(() => {
    if (open && modalRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const modal = modalRef.current;
        if (modal) {
          modal.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
          // Also scroll window to center
          window.scrollTo({
            top: modal.offsetTop - window.innerHeight / 2 + modal.offsetHeight / 2,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [open]);

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const price = product ? formatPrice(product.price_cents) : formatPrice(0);
  const comparePrice = product?.compare_at_price_cents 
    ? formatPrice(product.compare_at_price_cents)
    : null;

  const handleAddToCart = () => {
    if (!product) return;

    if (product.stock_quantity <= 0) {
      toast({
        title: 'Produto esgotado',
        description: 'Este produto não está disponível no momento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      addItem({
        product_id: product.id,
        variant_id: null,
        title: product.title,
        price_cents: product.price_cents,
        quantity,
        image_url: product.images?.[0]?.image_url || null,
        sku: product.sku || null,
      });

      toast({
        title: 'Adicionado ao carrinho',
        description: `${product.title} foi adicionado ao carrinho.`,
      });

      // Fechar modal após adicionar
      onOpenChange(false);
    } catch (e) {
      console.error('Falha ao adicionar ao carrinho', e);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o produto ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content 
          ref={modalRef}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-bold">Visualização Rápida</Dialog.Title>
            <Dialog.Close asChild>
              <button 
                aria-label="Fechar" 
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {product ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Images Section */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
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
                        <span className="text-6xl">📦</span>
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                          aria-label="Imagem anterior"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-800" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                          aria-label="Próxima imagem"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-800" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Gallery - Mostrar todas as imagens (mínimo 4 se houver) */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.slice(0, Math.max(4, images.length)).map((img, index) => (
                        <button
                          key={img.id}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                            currentImageIndex === index
                              ? 'border-primary scale-105 shadow-md ring-2 ring-primary/20'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <img
                            src={img.image_url}
                            alt={img.alt_text || `${product.title} - Imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {images.length > 4 && (
                        <div className="aspect-square rounded-lg border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-muted-foreground">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col">
                  {/* Category */}
                  {product.category && (
                    <span className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                      {product.category.name}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="text-2xl font-bold mb-4">{product.title}</h2>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-primary">
                        {price}
                      </span>
                      {comparePrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          {comparePrice}
                        </span>
                      )}
                    </div>
                    {comparePrice && product.compare_at_price_cents && (
                      <span className="text-sm text-green-600 font-medium">
                        Economize {Math.round(((product.compare_at_price_cents - product.price_cents) / product.compare_at_price_cents) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Short Description */}
                  {product.short_description && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {product.short_description}
                    </p>
                  )}

                  {/* Full Description */}
                  {product.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                      <div 
                        className="text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizeHtml(product.description.replace(/\n/g, '<br />'))
                        }}
                      />
                    </div>
                  )}

                  {/* Stock Status */}
                  {product.stock_quantity !== undefined && (
                    <div className="mb-6">
                      {product.stock_quantity > 0 ? (
                        <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Em estoque ({product.stock_quantity} unidades)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-red-600 font-medium">
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                          Esgotado
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quantity Selector */}
                  {product.stock_quantity > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Quantidade</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
                          disabled={quantity <= 1}
                        >
                          <span className="text-lg">−</span>
                        </button>
                        <span className="w-16 text-center font-semibold text-lg">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                          className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
                          disabled={quantity >= product.stock_quantity}
                        >
                          <span className="text-lg">+</span>
                        </button>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {product.stock_quantity} disponíveis
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="mb-6 space-y-2 text-sm">
                    {product.sku && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">SKU:</span>
                        <span>{product.sku}</span>
                      </div>
                    )}
                    {product.category && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">Categoria:</span>
                        <Link 
                          to={`/products?category_id=${product.category.id}`}
                          className="text-primary hover:underline"
                          onClick={() => onOpenChange(false)}
                        >
                          {product.category.name}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto space-y-3">
                    <div className="flex gap-3">
                      <Link
                        to={`/product/${product.slug}`}
                        className="flex-1 btn btn-outline flex items-center justify-center gap-2"
                        onClick={() => onOpenChange(false)}
                      >
                        Ver Página Completa
                      </Link>
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                          isFavorite
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                        aria-label="Adicionar aos favoritos"
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <button 
                      onClick={handleAddToCart}
                      disabled={product.stock_quantity <= 0}
                      className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {product.stock_quantity > 0 ? 'Adicionar ao Carrinho' : 'Fora de Estoque'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Carregando produto...</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

