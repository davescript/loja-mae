import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import type { Product, Category } from '@shared/types';
import ProductCard from '../components/app/ProductCard';
import QuickViewModal from '../components/app/QuickViewModal';
import { motion } from 'framer-motion';
import { Search, Grid, List, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import BannerDisplay from '../components/app/BannerDisplay';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Mobile: always grid. Desktop: user can toggle.
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id');
  const categorySlug = searchParams.get('category');

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', page, search, categoryId, categorySlug],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '20',
          status: 'active',
        });
        if (search) params.append('search', search);
        if (categoryId) params.append('category_id', categoryId);
        if (categorySlug) params.append('category', categorySlug);
        params.append('include', 'images');
        const response = await apiRequest<{ items: Product[]; total: number }>(
          `/api/products?${params.toString()}`
        );
        return response.data || { items: [], total: 0 };
      } catch {
        return { items: [], total: 0 };
      }
    },
    retry: 1,
    staleTime: 0,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ items: Category[] }>('/api/categories?status=active');
        return response.data?.items || [];
      } catch {
        return [];
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      newParams.set('search', localSearch.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const totalPages = productsData?.total ? Math.ceil(productsData.total / 20) : 1;

  // Grid classes: mobile always 2-col, sm 2-col, md 3-col, lg 4-col
  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'
    : 'grid grid-cols-1 gap-3';

  return (
    <div className="min-h-screen pb-20">

      {/* ── Header bar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 py-3 sm:py-4 mb-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-heading font-bold truncate">Nossos Produtos</h1>
          {productsData?.total != null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {productsData.total} {productsData.total === 1 ? 'produto' : 'produtos'}
            </p>
          )}
        </div>

        {/* Search — full row on mobile */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar..."
              className="input pl-9 pr-8 py-2 text-sm w-full"
            />
            {localSearch && (
              <button type="button" onClick={() => { setLocalSearch(''); const p = new URLSearchParams(searchParams); p.delete('search'); setSearchParams(p); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Controls: filter + view toggle (toggle hidden on mobile) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border text-sm font-medium transition-all ${
              filtersOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-border'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden xs:inline">Filtros</span>
            {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* View toggle — desktop only */}
          <div className="hidden sm:flex items-center bg-muted rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-muted-foreground'
              }`}
              aria-label="Grelha"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-muted-foreground'
              }`}
              aria-label="Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar — full width on mobile */}
      <form onSubmit={handleSearch} className="sm:hidden mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar produtos..."
            className="input pl-9 pr-8 py-2.5 text-sm w-full bg-white"
          />
          {localSearch && (
            <button type="button" onClick={() => { setLocalSearch(''); const p = new URLSearchParams(searchParams); p.delete('search'); setSearchParams(p); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* ── Filters panel ───────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{ height: filtersOpen ? 'auto' : 0, opacity: filtersOpen ? 1 : 0 }}
        className="overflow-hidden mb-3"
      >
        <div className="glass-card p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5">Categoria</label>
              <select
                value={categoryId || ''}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams);
                  if (e.target.value) {
                    p.set('category_id', e.target.value);
                  } else {
                    p.delete('category_id');
                  }
                  p.delete('category');
                  p.set('page', '1');
                  setSearchParams(p);
                }}
                className="input w-full text-sm"
              >
                <option value="">Todas as categorias</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5">Ordenar por</label>
              <select
                value={searchParams.get('sortBy') || 'created_at'}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams);
                  p.set('sortBy', e.target.value); p.set('page', '1');
                  setSearchParams(p);
                }}
                className="input w-full text-sm"
              >
                <option value="created_at">Mais recentes</option>
                <option value="title">Nome A-Z</option>
                <option value="price_cents">Menor preço</option>
                <option value="price_cents_desc">Maior preço</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setSearchParams({}); setLocalSearch(''); }}
                className="btn btn-ghost w-full text-sm h-10">
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 mb-8">
        <BannerDisplay position="category" variant="full" />
      </div>

      {/* ── Products ─────────────────────────────────────────────────── */}
      {loadingProducts ? (
        <div className={gridClass}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse h-56 sm:h-72 rounded-xl" />
          ))}
        </div>
      ) : productsData?.items && productsData.items.length > 0 ? (
        <>
          <div className={gridClass}>
            {productsData.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                listView={viewMode === 'list'}
                onQuickView={(prod) => {
                  setSelectedProduct(prod);
                  setQuickOpen(true);
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                }}
              />
            ))}
          </div>

          {/* ── Pagination ──────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
              <button
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', Math.max(1, page - 1).toString());
                  setSearchParams(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === 1}
                className="h-11 px-4 rounded-xl bg-muted font-medium text-sm disabled:opacity-40 hover:bg-muted/80 transition-colors"
              >
                ← Anterior
              </button>

              <div className="flex gap-1.5">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        const p = new URLSearchParams(searchParams);
                        p.set('page', pageNum.toString());
                        setSearchParams(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-11 h-11 rounded-xl font-semibold text-sm transition-all ${
                        page === pageNum
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('page', Math.min(totalPages, page + 1).toString());
                  setSearchParams(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === totalPages}
                className="h-11 px-4 rounded-xl bg-muted font-medium text-sm disabled:opacity-40 hover:bg-muted/80 transition-colors"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card p-10 text-center">
          <Search className="w-14 h-14 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {search ? 'Tente outros termos ou limpe os filtros' : 'Nenhum produto disponível'}
          </p>
          {search && (
            <button onClick={() => { setSearchParams({}); setLocalSearch(''); }} className="btn btn-primary">
              Limpar busca
            </button>
          )}
        </div>
      )}

      <QuickViewModal open={quickOpen} onOpenChange={setQuickOpen} product={selectedProduct} />
    </div>
  );
}
