import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../utils/api';
import type { Product } from '@shared/types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Share2, Package, Truck, Shield, ChevronLeft, ZoomIn } from 'lucide-react';
import { formatPrice } from '../../../utils/format';
import { sanitizeHtml } from '../../../utils/sanitize';
import { useCartStore } from '../../../store/cartStore';
import { useFavoritesStore } from '../../../store/favoritesStore';
import { useToast } from '../../../admin/hooks/useToast';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomImage, setZoomImage] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      try {
        const response = await apiRequest<Product>(`/api/products/${slug}?include=all`);
        if (!response.data) {
          throw new Error('Produto não encontrado');
        }
        return response.data;
      } catch (err: any) {
        console.error('Error loading product:', err);
        throw err;
      }
    },
    enabled: !!slug,
    staleTime: 0,
    retry: 2,
  });

  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando produto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Produto não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Link to="/products" className="btn btn-primary inline-block">
            Ver todos os produtos
          </Link>
        </div>
      </div>
    );
  }

  const price = selectedVariant
    ? product.variants?.find((v) => v.id === selectedVariant)?.price_cents || product.price_cents
    : product.price_cents;

  const stock = selectedVariant
    ? product.variants?.find((v) => v.id === selectedVariant)?.stock_quantity || product.stock_quantity
    : product.stock_quantity;

  const handleAddToCart = () => {
    if (stock <= 0) {
      toast({
        title: 'Produto esgotado',
        description: 'Este produto não está disponível no momento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const priceCents = selectedVariant
        ? (product.variants?.find(v => v.id === selectedVariant)?.price_cents || product.price_cents)
        : product.price_cents;
      const title = selectedVariant
        ? `${product.title} - ${product.variants?.find(v => v.id === selectedVariant)?.title ?? ''}`
        : product.title;
      const imageUrl = product.images?.[0]?.image_url || null;

      addItem({
        product_id: product.id,
        variant_id: selectedVariant || null,
        title,
        price_cents: priceCents,
        quantity,
        image_url: imageUrl,
        sku: product.sku || null,
      });

      toast({
        title: 'Adicionado ao carrinho',
        description: `${title} foi adicionado ao carrinho.`,
      });
    } catch (e) {
      console.error('Falha ao adicionar ao carrinho', e);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o produto ao carrinho.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.short_description || product.description || '',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copiado',
        description: 'O link do produto foi copiado para a área de transferência.',
      });
    }
  };

  const images = product.images && product.images.length > 0 ? product.images : [];

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-foreground">Produtos</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/categories/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Galeria de Imagens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="rounded-xl overflow-hidden shadow-lg bg-card">
            {images.length > 0 ? (
              <div className="relative">
                <div className="group relative aspect-square bg-secondary">
                  <img
                    src={images[activeImage]?.image_url}
                    alt={images[activeImage]?.alt_text || product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                    onClick={() => setZoomImage(true)}
                  />
                  {product.featured && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold text-sm">
                      Destaque
                    </div>
                  )}
                  <button
                    onClick={() => setZoomImage(true)}
                    className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    aria-label="Ampliar imagem"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
                {/* Miniaturas */}
                {images.length > 1 && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(idx)}
                        className={`rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === idx
                            ? 'border-primary scale-105'
                            : 'border-transparent hover:border-muted-foreground/50'
                        }`}
                      >
                        <img
                          src={img.image_url}
                          alt={img.alt_text || `${product.title} - Imagem ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-secondary flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl text-muted-foreground block mb-2">📦</span>
                  <p className="text-muted-foreground">Sem imagem disponível</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Informações do Produto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Título e Badges */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{product.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {product.featured && (
                <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  Novo
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stock > 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {stock > 0 ? `Em stock (${stock} unidades)` : 'Fora de stock'}
              </span>
            </div>

            {/* Avaliações */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round((product as any).average_rating || 4)
                        ? 'fill-current'
                        : 'opacity-30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {(product as any).reviews_count || 0} avaliações
              </span>
            </div>

            {/* Preço */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">{formatPrice(price)}</span>
              </div>
            </div>
          </div>

          {/* Descrição Curta */}
          {product.short_description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
            </div>
          )}

          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block font-semibold mb-3">Selecione a variação:</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedVariant === variant.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {variant.title}
                    {variant.price_cents !== product.price_cents && (
                      <span className="ml-2 text-xs">
                        ({formatPrice(variant.price_cents)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div>
            <label className="block font-semibold mb-3">Quantidade:</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-muted transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={stock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, Math.min(stock, val)));
                  }}
                  className="w-20 px-4 py-2 text-center border-0 focus:outline-none focus:ring-0"
                />
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="px-4 py-2 hover:bg-muted transition-colors"
                  disabled={quantity >= stock}
                >
                  +
                </button>
              </div>
              <span className="text-sm text-muted-foreground">
                {stock > 0 ? `${stock} disponíveis` : 'Esgotado'}
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <motion.button
              onClick={handleAddToCart}
              disabled={stock === 0}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: stock > 0 ? 1.02 : 1 }}
              className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {stock === 0 ? 'Fora de estoque' : 'Adicionar ao Carrinho'}
            </motion.button>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (product) {
                    toggleFavorite(product.id);
                    toast({
                      title: isFavorite(product.id) ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
                      description: isFavorite(product.id) 
                        ? 'Produto removido da sua lista de favoritos'
                        : 'Produto adicionado à sua lista de favoritos',
                    });
                  }
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  product && isFavorite(product.id)
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Heart className={`w-5 h-5 ${product && isFavorite(product.id) ? 'fill-current' : ''}`} />
                {product && isFavorite(product.id) ? 'Favoritado' : 'Favoritar'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-3 rounded-lg font-medium bg-muted hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Compartilhar
              </button>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Entrega Rápida</p>
                <p className="text-xs text-muted-foreground">2-5 dias úteis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Garantia</p>
                <p className="text-xs text-muted-foreground">30 dias</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Embalagem</p>
                <p className="text-xs text-muted-foreground">Segura</p>
              </div>
            </div>
          </div>

          {/* SKU */}
          {product.sku && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">SKU:</span> {product.sku}
            </div>
          )}
        </motion.div>
      </div>

      {/* Descrição Completa */}
      {product.description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 pt-12 border-t"
        >
          <h2 className="text-2xl font-bold mb-6">Descrição do Produto</h2>
          <div
            className="prose prose-lg max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
          />
        </motion.div>
      )}

      {/* Modal de Zoom */}
      {zoomImage && images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomImage(false)}
        >
          <button
            onClick={() => setZoomImage(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <ChevronLeft className="w-8 h-8 rotate-90" />
          </button>
          <img
            src={images[activeImage]?.image_url}
            alt={images[activeImage]?.alt_text || product.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
