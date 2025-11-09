import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../utils/api';
import type { Product } from '@shared/types';
import Carousel from '../components/app/Carousel';
import ProductCard from '../components/app/ProductCard';
import CategoriesModal from '../components/app/CategoriesModal';
import QuickViewModal from '../components/app/QuickViewModal';
import KpiWidgets from '../components/app/KpiWidgets';
import { useState } from 'react';

export default function HomePage() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['products', 'best'],
    queryFn: async () => {
      const response = await apiRequest<{ items: Product[] }>(
        '/api/products?status=active&pageSize=10&featured=1'
      );
      return response.data?.items || [];
    },
  });
  const { data: essentials, isLoading: loadingEss } = useQuery({
    queryKey: ['products', 'essentials'],
    queryFn: async () => {
      const response = await apiRequest<{ items: Product[] }>(
        '/api/products?status=active&pageSize=10'
      );
      return response.data?.items || [];
    },
  });

  return (
    <div className="space-y-10">
      {/* Hero pequeno com banner pastel */}
      <section className="rounded-xl bg-secondary p-6 shadow-soft flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Acessórios para bolos & eventos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tudo o que precisa para confeitaria, toppers, balões, caixas e decoração.</p>
          <div className="mt-4 flex gap-2">
            <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm">Explorar</button>
            <button className="px-4 py-2 rounded-full bg-muted text-sm" onClick={() => setCategoriesOpen(true)}>Categorias</button>
          </div>
        </div>
        <div className="hidden sm:block">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop" alt="Banner pastel" className="w-40 h-24 rounded-lg object-cover" />
        </div>
      </section>

      {/* KPIs estilo dashboard */}
      <KpiWidgets />

      {/* Navegação por categorias (chips com ícones) */}
      <section className="flex gap-3 flex-wrap">
        {[
          { label: 'Formas', emoji: '🍰' },
          { label: 'Toppers', emoji: '✨' },
          { label: 'Confeitaria', emoji: '🧁' },
          { label: 'Caixas', emoji: '🎁' },
          { label: 'Balões', emoji: '🎈' },
        ].map((c) => (
          <button key={c.label} className="chip">{c.emoji} {c.label}</button>
        ))}
      </section>

      {/* Mais Vendidos */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Mais Vendidos</h2>
        {loadingBest ? (
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="snap-start min-w-[240px] h-60 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <Carousel>
            {bestSellers?.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={(prod) => { setSelectedProduct(prod); setQuickOpen(true); }} />
            ))}
          </Carousel>
        )}
      </section>

      {/* Acessórios Essenciais */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Acessórios Essenciais</h2>
        {loadingEss ? (
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="snap-start min-w-[240px] h-60 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <Carousel>
            {essentials?.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={(prod) => { setSelectedProduct(prod); setQuickOpen(true); }} />
            ))}
          </Carousel>
        )}
      </section>

      <CategoriesModal open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      <QuickViewModal open={quickOpen} onOpenChange={setQuickOpen} product={selectedProduct} />
    </div>
  );
}
