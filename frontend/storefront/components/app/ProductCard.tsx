import { Link } from 'react-router-dom';
import type { Product } from '@shared/types';

type Props = {
  product: Product;
  onQuickView?: (p: Product) => void;
};

export default function ProductCard({ product, onQuickView }: Props) {
  const badge = product.featured ? 'Novo' : product.compare_at_price_cents ? 'Promo' : undefined;
  const inStock = (product.stock_quantity ?? 0) > 0;
  return (
    <div className="snap-start min-w-[240px] sm:min-w-[280px] card overflow-hidden group">
      {product.images?.[0]?.image_url && (
        <div className="aspect-[4/3] overflow-hidden">
          <img src={product.images[0].image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium line-clamp-1">{product.title}</h3>
          {badge && <span className="badge">{badge}</span>}
        </div>
        <p className="mt-2 text-primary font-semibold">R$ {(product.price_cents / 100).toFixed(2).replace('.', ',')}</p>
        <div className="mt-3 flex gap-2">
          <Link to={`/product/${product.slug}`} className="flex-1 btn btn-primary text-xs">Ver</Link>
          <button onClick={() => onQuickView?.(product)} className="btn btn-muted text-xs">Quick View</button>
        </div>
        {!inStock && <p className="mt-2 text-xs text-destructive">Fora de estoque</p>}
      </div>
    </div>
  );
}
