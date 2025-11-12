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
  const { data: bestSellers, isLoading: loadingBest, error: errorBest } = useQuery({
    queryKey: ['products', 'best'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Product[] }>(
          '/api/products?status=active&pageSize=10&featured=1'
        );
        return response.data?.items || [];
      } catch (error) {
        console.error('Error loading best sellers:', error);
        return [];
      }
    },
    retry: 1,
  });
  const { data: essentials, isLoading: loadingEss, error: errorEss } = useQuery({
    queryKey: ['products', 'essentials'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Product[] }>(
          '/api/products?status=active&pageSize=10'
        );
        return response.data?.items || [];
      } catch (error) {
        console.error('Error loading essentials:', error);
        return [];
      }
    },
    retry: 1,
  });

  return (
    <div className="space-y-10">
      {/* Hero Section - Melhorado */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-[var(--radius)] shadow-elevated bg-gradient-to-br from-secondary via-background to-accent/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="relative container mx-auto px-6 md:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4 text-foreground">
              Acessórios para Bolos & Eventos
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Tudo o que precisa para confeitaria, toppers, balões, caixas e decoração. Qualidade premium para seus eventos especiais.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn btn-primary text-base px-6 py-3">
                Explorar Produtos
              </button>
              <button 
                className="btn btn-muted text-base px-6 py-3" 
                onClick={() => setCategoriesOpen(true)}
              >
                Ver Categorias
              </button>
            </div>
          </div>
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
